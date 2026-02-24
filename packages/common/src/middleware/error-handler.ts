import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function errorHandler(logger: Logger) {
    return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
        if (err instanceof AppError) {
            logger.warn({ statusCode: err.statusCode, message: err.message }, 'Operational error');
            res.status(err.statusCode).json({
                error: err.message,
            });
            return;
        }

        logger.error({ err }, 'Unhandled error');
        res.status(500).json({
            error: 'Internal server error',
        });
    };
}
