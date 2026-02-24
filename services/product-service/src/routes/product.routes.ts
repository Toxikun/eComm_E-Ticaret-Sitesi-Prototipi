import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { ServiceConfig, Logger, AppError, MessageBroker, authMiddleware } from '@ecommerce/common';

export function productRoutes(
    pool: Pool,
    config: ServiceConfig,
    logger: Logger,
    getBroker: () => MessageBroker | undefined
): Router {
    const router = Router();

    // ─── GET / (list products with filtering & pagination) ───
    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const offset = (page - 1) * limit;
            const { category, search, minPrice, maxPrice, sortBy, sortOrder } = req.query;

            let whereClause = 'WHERE is_active = true';
            const params: (string | number)[] = [];
            let paramIdx = 1;

            if (category) {
                whereClause += ` AND category = $${paramIdx++}`;
                params.push(category as string);
            }
            if (search) {
                whereClause += ` AND (name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
                params.push(`%${search}%`);
                paramIdx++;
            }
            if (minPrice) {
                whereClause += ` AND price >= $${paramIdx++}`;
                params.push(Number(minPrice));
            }
            if (maxPrice) {
                whereClause += ` AND price <= $${paramIdx++}`;
                params.push(Number(maxPrice));
            }

            const validSort = ['price', 'name', 'created_at'];
            const sort = validSort.includes(sortBy as string) ? sortBy : 'created_at';
            const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

            const countResult = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
            const total = parseInt(countResult.rows[0].count, 10);

            const dataResult = await pool.query(
                `SELECT * FROM products ${whereClause} ORDER BY ${sort} ${order} LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
                [...params, limit, offset]
            );

            res.json({
                data: dataResult.rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        } catch (err) {
            next(err);
        }
    });

    // ─── GET /:id ───
    router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) {
                throw new AppError(404, 'Product not found');
            }
            res.json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    // ─── POST / (create product — admin only) ───
    router.post('/', authMiddleware(config.jwt.secret), async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, description, price, category, imageUrl, stock } = req.body;

            if (!name || price == null || !category) {
                throw new AppError(400, 'Name, price, and category are required');
            }

            const id = uuidv4();
            const result = await pool.query(
                `INSERT INTO products (id, name, description, price, category, image_url, stock, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
                [id, name, description || '', price, category, imageUrl || '', stock || 0]
            );

            const broker = getBroker();
            if (broker) {
                await broker.publishToExchange('ecommerce.events', 'product.created', {
                    type: 'product.created',
                    data: result.rows[0],
                    timestamp: new Date().toISOString(),
                });
            }

            logger.info({ productId: id }, 'Product created');
            res.status(201).json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    // ─── PUT /:id (update product) ───
    router.put('/:id', authMiddleware(config.jwt.secret), async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, description, price, category, imageUrl, isActive } = req.body;
            const { id } = req.params;

            const existing = await pool.query('SELECT price FROM products WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                throw new AppError(404, 'Product not found');
            }

            const result = await pool.query(
                `UPDATE products SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          price = COALESCE($3, price),
          category = COALESCE($4, category),
          image_url = COALESCE($5, image_url),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
         WHERE id = $7 RETURNING *`,
                [name, description, price, category, imageUrl, isActive, id]
            );

            // Publish price.changed event if price was updated
            if (price && price !== existing.rows[0].price) {
                const broker = getBroker();
                if (broker) {
                    await broker.publishToExchange('ecommerce.events', 'price.changed', {
                        type: 'price.changed',
                        data: { productId: id, oldPrice: existing.rows[0].price, newPrice: price },
                        timestamp: new Date().toISOString(),
                    });
                }
            }

            logger.info({ productId: id }, 'Product updated');
            res.json(result.rows[0]);
        } catch (err) {
            next(err);
        }
    });

    // ─── DELETE /:id (soft delete) ───
    router.delete('/:id', authMiddleware(config.jwt.secret), async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await pool.query(
                'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
                [req.params.id]
            );
            if (result.rows.length === 0) {
                throw new AppError(404, 'Product not found');
            }
            logger.info({ productId: req.params.id }, 'Product soft-deleted');
            res.json({ message: 'Product deleted' });
        } catch (err) {
            next(err);
        }
    });

    return router;
}
