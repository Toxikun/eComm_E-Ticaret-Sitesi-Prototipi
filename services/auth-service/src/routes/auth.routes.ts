import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ServiceConfig, Logger, AppError } from '@ecommerce/common';

export function authRoutes(pool: Pool, config: ServiceConfig, logger: Logger): Router {
    const router = Router();

    // ─── POST /register ───
    router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name, role } = req.body;

            if (!email || !password || !name) {
                throw new AppError(400, 'Email, password, and name are required');
            }

            // Allowed roles for registration (in a real app, this would be restricted)
            const userRole = (role === 'SELLER' || role === 'ADMIN') ? role : 'CUSTOMER';

            // Check for existing user
            const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                throw new AppError(409, 'User with this email already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const id = uuidv4();

            await pool.query(
                'INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5)',
                [id, email, hashedPassword, name, userRole]
            );

            const accessToken = jwt.sign(
                { userId: id, role: userRole },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
            );

            const refreshToken = jwt.sign(
                { userId: id, type: 'refresh' },
                config.jwt.secret,
                { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
            );

            logger.info({ userId: id, email }, 'User registered');

            res.status(201).json({
                user: { id, email, name, role: userRole },
                accessToken,
                refreshToken,
                expiresIn: config.jwt.expiresIn,
            });
        } catch (err) {
            next(err);
        }
    });

    // ─── POST /login ───
    router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError(400, 'Email and password are required');
            }

            const result = await pool.query(
                'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                throw new AppError(401, 'Invalid email or password');
            }

            const user = result.rows[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                throw new AppError(401, 'Invalid email or password');
            }

            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
            );

            const refreshToken = jwt.sign(
                { userId: user.id, type: 'refresh' },
                config.jwt.secret,
                { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
            );

            logger.info({ userId: user.id }, 'User logged in');

            res.json({
                user: { id: user.id, email: user.email, name: user.name, role: user.role },
                accessToken,
                refreshToken,
                expiresIn: config.jwt.expiresIn,
            });
        } catch (err) {
            next(err);
        }
    });

    // ─── POST /refresh ───
    router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new AppError(400, 'Refresh token is required');
            }

            const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
                userId: string;
                type: string;
            };

            if (decoded.type !== 'refresh') {
                throw new AppError(401, 'Invalid token type');
            }

            const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.userId]);
            if (result.rows.length === 0) {
                throw new AppError(401, 'User not found');
            }

            const user = result.rows[0];
            const newAccessToken = jwt.sign(
                { userId: user.id, role: user.role },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
            );

            res.json({ accessToken: newAccessToken, expiresIn: config.jwt.expiresIn });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
