import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createLogger } from '@ecommerce/common';
import { setupRoutes } from './routes';

const logger = createLogger('api-gateway');
const app = express();
const PORT = parseInt(process.env.API_GATEWAY_PORT || '3000', 10);

// ─── Global Middleware ───
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ─── Rate Limiting ───
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Health Check ───
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ─── Service Routes (Proxy) ───
setupRoutes(app);

// ─── Start ───
app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API Gateway started');
});

export default app;
