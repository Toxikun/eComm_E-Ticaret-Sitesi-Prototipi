import { Router, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ServiceConfig, Logger, AppError, AuthRequest, MessageBroker } from '@ecommerce/common';

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://cart-service:3004';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3007';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3006';

export function orderRoutes(
    pool: Pool,
    config: ServiceConfig,
    logger: Logger,
    getBroker: () => MessageBroker | undefined
): Router {
    const router = Router();

    // ─── POST / (create order — Saga orchestrator) ───
    router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
        const orderId = uuidv4();
        const userId = req.userId!;

        try {
            const { shippingAddress, paymentMethodId } = req.body;
            if (!shippingAddress) throw new AppError(400, 'shippingAddress is required');

            // Step 1 — Fetch cart
            logger.info({ orderId, userId }, 'Saga: fetching cart');
            const cartRes = await axios.get(`${CART_SERVICE_URL}/${userId}`, {
                headers: { Authorization: req.headers.authorization! },
            });
            const cart = cartRes.data;

            if (!cart.items || cart.items.length === 0) {
                throw new AppError(400, 'Cart is empty');
            }

            // Step 2 — Reserve inventory
            logger.info({ orderId }, 'Saga: reserving inventory');
            try {
                await axios.post(
                    `${INVENTORY_SERVICE_URL}/reserve`,
                    { orderId, items: cart.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })) },
                    { headers: { Authorization: req.headers.authorization! } }
                );
            } catch {
                throw new AppError(409, 'Insufficient stock for one or more items');
            }

            // Step 3 — Process payment
            logger.info({ orderId }, 'Saga: processing payment');
            let paymentResult;
            try {
                const payRes = await axios.post(
                    `${PAYMENT_SERVICE_URL}/charge`,
                    { orderId, amount: cart.totalAmount, currency: 'USD', paymentMethodId: paymentMethodId || 'mock_card' },
                    { headers: { Authorization: req.headers.authorization! } }
                );
                paymentResult = payRes.data;
            } catch {
                // Compensate: release inventory
                logger.warn({ orderId }, 'Saga: payment failed, releasing inventory');
                await axios.post(
                    `${INVENTORY_SERVICE_URL}/release`,
                    { orderId },
                    { headers: { Authorization: req.headers.authorization! } }
                ).catch(() => { });
                throw new AppError(402, 'Payment failed');
            }

            // Step 4 — Persist order
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                await client.query(
                    `INSERT INTO orders (id, user_id, total_amount, status, shipping_address, payment_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
                    [orderId, userId, cart.totalAmount, 'CONFIRMED', shippingAddress, paymentResult.id]
                );

                for (const item of cart.items) {
                    await client.query(
                        `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [uuidv4(), orderId, item.productId, item.productName, item.quantity, item.unitPrice, item.unitPrice * item.quantity]
                    );
                }

                await client.query('COMMIT');
            } catch (dbErr) {
                await client.query('ROLLBACK');
                throw dbErr;
            } finally {
                client.release();
            }

            // Step 5 — Clear cart
            await axios.delete(`${CART_SERVICE_URL}/${userId}`, {
                headers: { Authorization: req.headers.authorization! },
            }).catch(() => { });

            // Step 6 — Publish event
            const broker = getBroker();
            if (broker) {
                await broker.publishToExchange('ecommerce.events', 'order.placed', {
                    type: 'order.placed',
                    data: { orderId, userId, items: cart.items, totalAmount: cart.totalAmount },
                    timestamp: new Date().toISOString(),
                });
            }

            logger.info({ orderId, userId }, 'Order placed successfully');
            res.status(201).json({ orderId, status: 'CONFIRMED', totalAmount: cart.totalAmount });
        } catch (err) {
            next(err);
        }
    });

    // ─── GET /:id ───
    router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query(
                `SELECT o.*, json_agg(json_build_object(
          'productId', oi.product_id, 'productName', oi.product_name,
          'quantity', oi.quantity, 'unitPrice', oi.unit_price, 'totalPrice', oi.total_price
        )) as items
        FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1 AND o.user_id = $2
        GROUP BY o.id`,
                [req.params.id, req.userId]
            );

            if (result.rows.length === 0) throw new AppError(404, 'Order not found');
            res.json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    // ─── GET /user/:userId (list user orders) ───
    router.get('/user/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (req.userId !== req.params.userId) throw new AppError(403, 'Forbidden');

            const result = await pool.query(
                'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
                [req.params.userId]
            );
            res.json(result.rows);
        } catch (err) {
            next(err);
        }
    });

    return router;
}
