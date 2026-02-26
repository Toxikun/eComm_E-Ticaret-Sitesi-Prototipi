import express from 'express';
import { createLogger, loadConfig, errorHandler, authMiddleware, MessageBroker } from '@ecommerce/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Router, Response, NextFunction } from 'express';

interface AuthRequest extends express.Request {
    userId?: string;
    userRole?: string;
}

const config = loadConfig('notification-service', 3008, 'notification_db');
const logger = createLogger(config.serviceName);

const pool = new Pool({
    host: config.postgres!.host,
    port: config.postgres!.port,
    user: config.postgres!.user,
    password: config.postgres!.password,
    database: config.postgres!.database,
});

let broker: MessageBroker | undefined;

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: config.serviceName });
});

// ─── Notification Routes ───────────────────────────────

const router = Router();

// GET /user/:userId — list notifications for a user
router.get('/user/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.userId !== req.params.userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// PATCH /:id/read — mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// PATCH /read-all — mark all as read
router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [req.userId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
});

app.use('/', authMiddleware(config.jwt.secret), router);
app.use(errorHandler(logger));

// ─── RabbitMQ event consumers ──────────────────────────

async function createNotification(userId: string, type: string, title: string, message: string, metadata: Record<string, any> = {}) {
    const id = uuidv4();
    await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, userId, type, title, message, JSON.stringify(metadata)]
    );
    logger.info({ notificationId: id, userId, type }, 'Notification created');
}

async function start() {
    if (config.rabbitmq) {
        broker = new MessageBroker(config.rabbitmq.url, logger);
        await broker.connect();

        // ─── order.placed → Notify buyer + sellers ───
        await broker.subscribe('ecommerce.events', 'notifications.order.placed', 'order.placed', async (msg: any) => {
            const { orderId, userId, buyerName, shippingAddress, totalAmount, sellerIds, items } = msg.data || {};

            // Notify the buyer
            if (userId) {
                await createNotification(
                    userId,
                    'ORDER_CONFIRMED',
                    'Order Confirmed! 🎉',
                    `Your order #${orderId?.slice(0, 8)} for $${Number(totalAmount).toFixed(2)} has been confirmed.`,
                    { orderId, totalAmount }
                );
            }

            // Notify each seller
            if (sellerIds && sellerIds.length > 0) {
                const itemCount = items?.length || 0;
                const addr = typeof shippingAddress === 'object' && shippingAddress !== null
                    ? Object.values(shippingAddress).filter(Boolean).join(', ')
                    : shippingAddress;

                for (const sellerId of sellerIds) {
                    await createNotification(
                        sellerId,
                        'PRODUCT_SOLD',
                        'You made a sale! 💰',
                        `${buyerName || 'Someone'} purchased ${itemCount} item(s) from your store.\nDelivery Address: ${addr || 'Not specified'}\nOrder total: $${Number(totalAmount).toFixed(2)}`,
                        { orderId, totalAmount, buyerId: userId, buyerName, shippingAddress }
                    );
                }
            }
        });

        // ─── stock.low → Notify admin ───
        await broker.subscribe('ecommerce.events', 'notifications.stock.low', 'stock.low', async (msg: any) => {
            const { productId, currentStock, threshold } = msg.data || {};
            logger.info({ productId, currentStock, threshold }, '📦 Low stock alert');
        });

        // ─── payment events ───
        await broker.subscribe('ecommerce.events', 'notifications.payment.succeeded', 'payment.succeeded', async (msg: any) => {
            const { orderId, amount } = msg.data || {};
            logger.info({ orderId, amount }, '📧 Payment receipt');
        });

        await broker.subscribe('ecommerce.events', 'notifications.payment.failed', 'payment.failed', async (msg: any) => {
            const { orderId, reason } = msg.data || {};
            logger.info({ orderId, reason }, '⚠️ Payment failure');
        });
    }

    app.listen(config.port, () => {
        logger.info({ port: config.port }, `${config.serviceName} started`);
    });
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start notification service');
    process.exit(1);
});

export default app;
