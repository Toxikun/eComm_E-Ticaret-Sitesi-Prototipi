import { Router, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Logger, AppError, AuthRequest } from '@ecommerce/common';

export function userRoutes(pool: Pool, logger: Logger): Router {
    const router = Router();

    // ─── GET /:id (get user profile) ───
    router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            // Users can only see their own profile unless admin
            if (req.userId !== id && req.userRole !== 'ADMIN') {
                throw new AppError(403, 'Forbidden');
            }

            const result = await pool.query(
                'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                throw new AppError(404, 'User not found');
            }

            res.json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    // ─── PUT /:id (update user profile) ───
    router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (req.userId !== id) {
                throw new AppError(403, 'Forbidden');
            }

            const { name } = req.body;
            const result = await pool.query(
                'UPDATE users SET name = COALESCE($1, name), updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role, updated_at',
                [name, id]
            );

            if (result.rows.length === 0) {
                throw new AppError(404, 'User not found');
            }

            logger.info({ userId: id }, 'User profile updated');
            res.json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    // ─── GET /:id/addresses ───
    router.get('/:id/addresses', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (req.userId !== id && req.userRole !== 'ADMIN') {
                throw new AppError(403, 'Forbidden');
            }

            const result = await pool.query('SELECT * FROM addresses WHERE user_id = $1', [id]);
            res.json(result.rows);
        } catch (err) {
            next(err);
        }
    });

    // ─── POST /:id/addresses ───
    router.post('/:id/addresses', async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (req.userId !== id) {
                throw new AppError(403, 'Forbidden');
            }

            const { street, city, state, zipCode, country, isDefault } = req.body;
            const addressId = uuidv4();

            if (isDefault) {
                await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [id]);
            }

            const result = await pool.query(
                `INSERT INTO addresses (id, user_id, street, city, state, zip_code, country, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [addressId, id, street, city, state, zipCode, country, isDefault || false]
            );

            logger.info({ userId: id, addressId }, 'Address added');
            res.status(201).json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    return router;
}
