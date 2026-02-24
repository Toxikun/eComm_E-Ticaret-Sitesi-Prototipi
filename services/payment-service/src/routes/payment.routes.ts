import { Router, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Logger, AppError, AuthRequest, MessageBroker } from '@ecommerce/common';

export function paymentRoutes(
    pool: Pool,
    logger: Logger,
    getBroker: () => MessageBroker | undefined
): Router {
    const router = Router();

    // ─── Mock Stripe-like charge ───
    router.post('/charge', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { orderId, amount, currency, paymentMethodId } = req.body;

            if (!orderId || amount == null) {
                throw new AppError(400, 'orderId and amount are required');
            }

            // Simulate payment processing (mock Stripe)
            const success = paymentMethodId !== 'fail_card'; // use "fail_card" to simulate failure
            const paymentId = uuidv4();
            const transactionId = `txn_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
            const status = success ? 'succeeded' : 'failed';

            await pool.query(
                `INSERT INTO payments (id, order_id, amount, currency, status, transaction_id, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [paymentId, orderId, amount, currency || 'USD', status, transactionId, paymentMethodId || 'mock_card']
            );

            const broker = getBroker();
            if (broker) {
                const eventType = success ? 'payment.succeeded' : 'payment.failed';
                await broker.publishToExchange('ecommerce.events', eventType, {
                    type: eventType,
                    data: { paymentId, orderId, amount, transactionId, status },
                    timestamp: new Date().toISOString(),
                });
            }

            logger.info({ paymentId, orderId, status }, 'Payment processed');

            if (!success) {
                throw new AppError(402, 'Payment failed');
            }

            res.status(201).json({ id: paymentId, orderId, amount, currency: currency || 'USD', status, transactionId });
        } catch (err) {
            next(err);
        }
    });

    // ─── POST /refund ───
    router.post('/refund', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { paymentId } = req.body;
            if (!paymentId) throw new AppError(400, 'paymentId is required');

            const result = await pool.query(
                "UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE id = $1 AND status = 'succeeded' RETURNING *",
                [paymentId]
            );

            if (result.rows.length === 0) {
                throw new AppError(404, 'Payment not found or already refunded');
            }

            logger.info({ paymentId }, 'Payment refunded');
            res.json({ message: 'Refund processed', payment: result.rows[0] });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
