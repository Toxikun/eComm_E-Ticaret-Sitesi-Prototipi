import { createLogger, MessageBroker } from '@ecommerce/common';

const logger = createLogger('notification-service');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

async function start() {
    const broker = new MessageBroker(RABBITMQ_URL, logger);
    await broker.connect();

    // ─── order.placed → Send order confirmation email ───
    await broker.subscribe('ecommerce.events', 'notifications.order.placed', 'order.placed', async (msg: any) => {
        const { orderId, userId, totalAmount } = msg.data || {};
        logger.info(
            { orderId, userId, totalAmount },
            '📧 [STUB] Sending order confirmation email'
        );
        // In production: call SendGrid / SES / SMTP here
    });

    // ─── payment.succeeded → Send payment receipt ───
    await broker.subscribe('ecommerce.events', 'notifications.payment.succeeded', 'payment.succeeded', async (msg: any) => {
        const { paymentId, orderId, amount } = msg.data || {};
        logger.info(
            { paymentId, orderId, amount },
            '📧 [STUB] Sending payment receipt email'
        );
    });

    // ─── payment.failed → Send payment failure alert ───
    await broker.subscribe('ecommerce.events', 'notifications.payment.failed', 'payment.failed', async (msg: any) => {
        const { orderId, reason } = msg.data || {};
        logger.info(
            { orderId, reason },
            '⚠️ [STUB] Sending payment failure notification'
        );
    });

    // ─── stock.low → Alert admin ───
    await broker.subscribe('ecommerce.events', 'notifications.stock.low', 'stock.low', async (msg: any) => {
        const { productId, currentStock, threshold } = msg.data || {};
        logger.info(
            { productId, currentStock, threshold },
            '📦 [STUB] Sending low stock alert to admin'
        );
    });

    logger.info('Notification service started — listening for events');
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start notification service');
    process.exit(1);
});
