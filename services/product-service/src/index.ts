import express from 'express';
import path from 'path';
import { createLogger, loadConfig, errorHandler, MessageBroker } from '@ecommerce/common';
import { Pool } from 'pg';
import { productRoutes } from './routes/product.routes';

const config = loadConfig('product-service', 3003, 'catalog_db');
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

// Serve uploaded product images as static files
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: config.serviceName });
});

app.use('/', productRoutes(pool, config, logger, () => broker));

app.use(errorHandler(logger));

async function start() {
    if (config.rabbitmq) {
        broker = new MessageBroker(config.rabbitmq.url, logger);
        await broker.connect();
    }

    app.listen(config.port, () => {
        logger.info({ port: config.port }, `${config.serviceName} started`);
    });
}

start();

export default app;
