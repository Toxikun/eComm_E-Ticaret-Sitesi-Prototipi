import { Router, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Logger, AppError, AuthRequest, MessageBroker } from '@ecommerce/common';

const LOW_STOCK_THRESHOLD = 10;

export function inventoryRoutes(
    pool: Pool,
    logger: Logger,
    getBroker: () => MessageBroker | undefined
): Router {
    const router = Router();

    // ─── GET /:productId ───
    router.get('/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query(
                'SELECT * FROM inventory WHERE product_id = $1',
                [req.params.productId]
            );
            if (result.rows.length === 0) throw new AppError(404, 'Inventory record not found');
            res.json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    // ─── POST /reserve (reserve stock for an order) ───
    router.post('/reserve', async (req: AuthRequest, res: Response, next: NextFunction) => {
        const client = await pool.connect();
        try {
            const { orderId, items } = req.body;
            if (!orderId || !items?.length) throw new AppError(400, 'orderId and items are required');

            await client.query('BEGIN');
            const reservationId = uuidv4();

            for (const item of items) {
                // Lock the row and verify stock
                const result = await client.query(
                    'SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE',
                    [item.productId]
                );

                if (result.rows.length === 0) {
                    await client.query('ROLLBACK');
                    throw new AppError(404, `Product ${item.productId} not found in inventory`);
                }

                if (result.rows[0].quantity < item.quantity) {
                    await client.query('ROLLBACK');
                    throw new AppError(409, `Insufficient stock for product ${item.productId}`);
                }

                // Reserve (decrement available, record reservation)
                await client.query(
                    'UPDATE inventory SET reserved = reserved + $1, updated_at = NOW() WHERE product_id = $2',
                    [item.quantity, item.productId]
                );

                await client.query(
                    'INSERT INTO reservations (id, order_id, product_id, quantity, status) VALUES ($1, $2, $3, $4, $5)',
                    [uuidv4(), orderId, item.productId, item.quantity, 'RESERVED']
                );

                // Check low stock
                const updated = await client.query('SELECT quantity, reserved FROM inventory WHERE product_id = $1', [item.productId]);
                const available = updated.rows[0].quantity - updated.rows[0].reserved;
                if (available <= LOW_STOCK_THRESHOLD) {
                    const broker = getBroker();
                    if (broker) {
                        await broker.publishToExchange('ecommerce.events', 'stock.low', {
                            type: 'stock.low',
                            data: { productId: item.productId, currentStock: available, threshold: LOW_STOCK_THRESHOLD },
                            timestamp: new Date().toISOString(),
                        });
                    }
                }
            }

            await client.query('COMMIT');
            logger.info({ reservationId, orderId }, 'Stock reserved');
            res.status(201).json({ reservationId, orderId, status: 'RESERVED' });
        } catch (err) {
            await client.query('ROLLBACK').catch(() => { });
            next(err);
        } finally {
            client.release();
        }
    });

    // ─── POST /release (release reserved stock — compensation) ───
    router.post('/release', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { orderId } = req.body;
            if (!orderId) throw new AppError(400, 'orderId is required');

            const reservations = await pool.query(
                "SELECT * FROM reservations WHERE order_id = $1 AND status = 'RESERVED'",
                [orderId]
            );

            for (const res of reservations.rows) {
                await pool.query(
                    'UPDATE inventory SET reserved = GREATEST(reserved - $1, 0), updated_at = NOW() WHERE product_id = $2',
                    [res.quantity, res.product_id]
                );
            }

            await pool.query(
                "UPDATE reservations SET status = 'RELEASED' WHERE order_id = $1 AND status = 'RESERVED'",
                [orderId]
            );

            logger.info({ orderId }, 'Stock released');
            res.json({ message: 'Stock released', orderId });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
