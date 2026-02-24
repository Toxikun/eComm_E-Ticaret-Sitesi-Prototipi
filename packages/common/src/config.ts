export interface ServiceConfig {
    port: number;
    serviceName: string;
    postgres?: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    redis?: {
        host: string;
        port: number;
    };
    rabbitmq?: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
}

export function loadConfig(serviceName: string, port: number, dbName?: string): ServiceConfig {
    const config: ServiceConfig = {
        port: parseInt(process.env[`${serviceName.toUpperCase().replace(/-/g, '_')}_PORT`] || String(port), 10),
        serviceName,
        jwt: {
            secret: process.env.JWT_SECRET || 'dev-secret-key',
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        },
    };

    if (dbName) {
        config.postgres = {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: dbName,
        };
    }

    if (process.env.REDIS_HOST) {
        config.redis = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        };
    }

    if (process.env.RABBITMQ_URL) {
        config.rabbitmq = {
            url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        };
    }

    return config;
}
