import { Router, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { Logger, AppError, AuthRequest } from '@ecommerce/common';

const CART_TTL = 60 * 60 * 24 * 30; // 30 days

interface CartData {
    items: Array<{
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
    }>;
    updatedAt: string;
}

function calcTotal(items: CartData['items']): number {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function cartRoutes(redis: Redis, logger: Logger): Router {
    const router = Router();

    const getCartKey = (userId: string) => `cart:${userId}`;

    // ─── GET /:userId ───
    router.get('/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            if (req.userId !== userId) throw new AppError(403, 'Forbidden');

            const raw = await redis.get(getCartKey(userId));
            if (!raw) {
                return res.json({ userId, items: [], totalAmount: 0, updatedAt: null });
            }

            const cart: CartData = JSON.parse(raw);
            res.json({
                userId,
                items: cart.items.map((i) => ({ ...i, totalPrice: i.unitPrice * i.quantity })),
                totalAmount: calcTotal(cart.items),
                updatedAt: cart.updatedAt,
            });
        } catch (err) {
            next(err);
        }
    });

    // ─── POST /:userId/items (add item) ───
    router.post('/:userId/items', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            if (req.userId !== userId) throw new AppError(403, 'Forbidden');

            const { productId, productName, unitPrice, quantity } = req.body;
            if (!productId || !quantity) throw new AppError(400, 'productId and quantity are required');

            const raw = await redis.get(getCartKey(userId));
            const cart: CartData = raw ? JSON.parse(raw) : { items: [], updatedAt: '' };

            const existing = cart.items.find((i) => i.productId === productId);
            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.items.push({ productId, productName: productName || '', unitPrice: unitPrice || 0, quantity });
            }

            cart.updatedAt = new Date().toISOString();
            await redis.setex(getCartKey(userId), CART_TTL, JSON.stringify(cart));

            logger.info({ userId, productId, quantity }, 'Item added to cart');
            res.status(201).json({
                userId,
                items: cart.items.map((i) => ({ ...i, totalPrice: i.unitPrice * i.quantity })),
                totalAmount: calcTotal(cart.items),
                updatedAt: cart.updatedAt,
            });
        } catch (err) {
            next(err);
        }
    });

    // ─── PUT /:userId/items/:productId (update quantity) ───
    router.put('/:userId/items/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userId, productId } = req.params;
            if (req.userId !== userId) throw new AppError(403, 'Forbidden');

            const { quantity } = req.body;
            if (quantity == null) throw new AppError(400, 'quantity is required');

            const raw = await redis.get(getCartKey(userId));
            if (!raw) throw new AppError(404, 'Cart not found');

            const cart: CartData = JSON.parse(raw);
            const item = cart.items.find((i) => i.productId === productId);
            if (!item) throw new AppError(404, 'Item not in cart');

            if (quantity <= 0) {
                cart.items = cart.items.filter((i) => i.productId !== productId);
            } else {
                item.quantity = quantity;
            }

            cart.updatedAt = new Date().toISOString();
            await redis.setex(getCartKey(userId), CART_TTL, JSON.stringify(cart));

            res.json({
                userId,
                items: cart.items.map((i) => ({ ...i, totalPrice: i.unitPrice * i.quantity })),
                totalAmount: calcTotal(cart.items),
            });
        } catch (err) {
            next(err);
        }
    });

    // ─── DELETE /:userId (clear cart) ───
    router.delete('/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            if (req.userId !== userId) throw new AppError(403, 'Forbidden');

            await redis.del(getCartKey(userId));
            logger.info({ userId }, 'Cart cleared');
            res.json({ message: 'Cart cleared' });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
