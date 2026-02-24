import express from 'express';
import { createLogger, loadConfig, errorHandler, authMiddleware } from '@ecommerce/common';
import { Pool } from 'pg';
import { userRoutes } from './routes/user.routes';

const config = loadConfig('user-service', 3002, 'user_db');
const logger = createLogger(config.serviceName);

const pool = new Pool({
    host: config.postgres!.host,
    port: config.postgres!.port,
    user: config.postgres!.user,
    password: config.postgres!.password,
    database: config.postgres!.database,
});

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: config.serviceName });
});

app.use('/', authMiddleware(config.jwt.secret), userRoutes(pool, logger));

app.use(errorHandler(logger));

app.listen(config.port, () => {
    logger.info({ port: config.port }, `${config.serviceName} started`);
});

export default app;
