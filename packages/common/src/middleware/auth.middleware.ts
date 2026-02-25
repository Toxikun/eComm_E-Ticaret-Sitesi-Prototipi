import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export function authMiddleware(secret: string) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, secret) as { userId: string; role: string };
            req.userId = decoded.userId;
            req.userRole = decoded.role;
            next();
        } catch {
            res.status(401).json({ error: 'Invalid or expired token' });
        }
    };
}

export function roleMiddleware(allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.userRole || !allowedRoles.includes(req.userRole)) {
            res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
            return;
        }
        next();
    };
}
