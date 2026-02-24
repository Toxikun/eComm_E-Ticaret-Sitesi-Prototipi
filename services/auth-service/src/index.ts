import express from 'express';
import { createLogger, loadConfig, errorHandler } from '@ecommerce/common';
import { Pool } from 'pg';
import { authRoutes } from './routes/auth.routes';

const config = loadConfig('auth-service', 3001, 'auth_db');
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

app.use('/', authRoutes(pool, config, logger));

app.use(errorHandler(logger));

app.listen(config.port, () => {
    logger.info({ port: config.port }, `${config.serviceName} started`);
});

export default app;
