import express from 'express';
import { createLogger, loadConfig, errorHandler, authMiddleware, MessageBroker } from '@ecommerce/common';
import { Pool } from 'pg';
import { paymentRoutes } from './routes/payment.routes';

const config = loadConfig('payment-service', 3006, 'payment_db');
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

app.use('/', authMiddleware(config.jwt.secret), paymentRoutes(pool, logger, () => broker));

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
