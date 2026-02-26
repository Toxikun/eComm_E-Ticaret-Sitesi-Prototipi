import { Express } from 'express';
import { ClientRequest, IncomingMessage } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createLogger } from '@ecommerce/common';

const logger = createLogger('api-gateway');

interface ServiceRoute {
    path: string;
    target: string;
    name: string;
}

const services: ServiceRoute[] = [
    {
        path: '/api/auth',
        target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
        name: 'auth-service',
    },
    {
        path: '/api/users',
        target: process.env.USER_SERVICE_URL || 'http://user-service:3002',
        name: 'user-service',
    },
    {
        path: '/api/product-uploads',
        target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003',
        name: 'product-uploads',
    },
    {
        path: '/api/products',
        target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003',
        name: 'product-service',
    },
    {
        path: '/api/cart',
        target: process.env.CART_SERVICE_URL || 'http://cart-service:3004',
        name: 'cart-service',
    },
    {
        path: '/api/orders',
        target: process.env.ORDER_SERVICE_URL || 'http://order-service:3005',
        name: 'order-service',
    },
    {
        path: '/api/payments',
        target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3006',
        name: 'payment-service',
    },
    {
        path: '/api/inventory',
        target: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3007',
        name: 'inventory-service',
    },
    {
        path: '/api/notifications',
        target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3008',
        name: 'notification-service',
    },
];

export function setupRoutes(app: Express): void {
    services.forEach(({ path, target, name }) => {
        app.use(
            path,
            createProxyMiddleware({
                target,
                changeOrigin: true,
                pathRewrite: { [`^${path}`]: '' },
                onProxyReq: (proxyReq, req: any) => {
                    // Do NOT re-serialize the body for multipart/form-data (file uploads)
                    const contentType = req.headers['content-type'] || '';
                    if (contentType.includes('multipart/form-data')) {
                        return; // let http-proxy-middleware stream the raw body
                    }
                    if (req.body && Object.keys(req.body).length > 0) {
                        const bodyData = JSON.stringify(req.body);
                        proxyReq.setHeader('Content-Type', 'application/json');
                        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                        proxyReq.write(bodyData);
                    }
                },
                onError: (err, _req, res) => {
                    logger.error({ err, service: name }, 'Proxy error');
                    (res as any).status(502).json({
                        error: `Service "${name}" is unavailable`,
                    });
                },
            })
        );
    });

    logger.info(
        { services: services.map((s) => `${s.path} → ${s.target}`) },
        'Proxy routes configured'
    );
}
