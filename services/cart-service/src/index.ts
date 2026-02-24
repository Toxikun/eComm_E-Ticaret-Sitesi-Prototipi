import express from 'express';
import Redis from 'ioredis';
import { createLogger, loadConfig, errorHandler, authMiddleware } from '@ecommerce/common';
import { cartRoutes } from './routes/cart.routes';

const config = loadConfig('cart-service', 3004);
const logger = createLogger(config.serviceName);

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryStrategy: (times) => Math.min(times * 500, 5000),
});

redis.on('connect', () => logger.info('Connected to Redis'));
redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: config.serviceName });
});

app.use('/', authMiddleware(config.jwt.secret), cartRoutes(redis, logger));

app.use(errorHandler(logger));

app.listen(config.port, () => {
    logger.info({ port: config.port }, `${config.serviceName} started`);
});

export default app;
