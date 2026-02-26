import express from 'express';
import { createLogger, loadConfig, errorHandler, authMiddleware, MessageBroker } from '@ecommerce/common';
import { Pool } from 'pg';
import { inventoryRoutes } from './routes/inventory.routes';

const config = loadConfig('inventory-service', 3007, 'inventory_db');
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

app.use('/', authMiddleware(config.jwt.secret), inventoryRoutes(pool, logger, () => broker));

app.use(errorHandler(logger));

async function start() {
    if (config.rabbitmq) {
        broker = new MessageBroker(config.rabbitmq.url, logger);
        await broker.connect();

        // Subscribe to order.placed events to decrement stock permanently
        await broker.subscribe('ecommerce.events', 'inventory.order.placed', 'order.placed', async (msg: any) => {
            logger.info({ orderId: msg.data?.orderId }, 'Consuming order.placed — decrementing stock');
            const items = msg.data?.items || [];
            for (const item of items) {
                await pool.query(
                    'UPDATE inventory SET quantity = quantity - $1, updated_at = NOW() WHERE product_id = $2 AND quantity >= $1',
                    [item.quantity, item.productId]
                );
            }
        });

        // Subscribe to product.created events to auto-create inventory records
        await broker.subscribe('ecommerce.events', 'inventory.product.created', 'product.created', async (msg: any) => {
            const product = msg.data || {};
            const productId = product.id;
            const quantity = Number(product.stock) || 0;
            if (!productId) return;

            logger.info({ productId, quantity }, 'Consuming product.created — creating inventory record');
            await pool.query(
                `INSERT INTO inventory (product_id, quantity, reserved)
                 VALUES ($1, $2, 0)
                 ON CONFLICT (product_id) DO UPDATE SET quantity = $2, updated_at = NOW()`,
                [productId, quantity]
            );
        });
    }

    app.listen(config.port, () => {
        logger.info({ port: config.port }, `${config.serviceName} started`);
    });
}

start();

export default app;
