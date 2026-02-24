import amqplib from 'amqplib';
import { Logger } from './logger';

export class MessageBroker {
    private connection: any = null;
    private channel: any = null;

    constructor(
        private url: string,
        private logger: Logger
    ) { }

    async connect(): Promise<void> {
        try {
            this.connection = await amqplib.connect(this.url);
            this.channel = await this.connection.createChannel();
            this.logger.info('Connected to RabbitMQ');

            this.connection.on('error', (err: Error) => {
                this.logger.error({ err }, 'RabbitMQ connection error');
            });

            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed, reconnecting in 5s...');
                setTimeout(() => this.connect(), 5000);
            });
        } catch (err) {
            this.logger.error({ err }, 'Failed to connect to RabbitMQ, retrying in 5s...');
            setTimeout(() => this.connect(), 5000);
        }
    }

    async publishToExchange(exchange: string, routingKey: string, message: object): Promise<void> {
        if (!this.channel) {
            this.logger.error('Cannot publish: no channel available');
            return;
        }

        await this.channel.assertExchange(exchange, 'topic', { durable: true });
        this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
            persistent: true,
            contentType: 'application/json',
            timestamp: Date.now(),
        });

        this.logger.info({ exchange, routingKey }, 'Message published');
    }

    async subscribe(
        exchange: string,
        queue: string,
        routingKey: string,
        handler: (msg: any) => Promise<void>
    ): Promise<void> {
        if (!this.channel) {
            this.logger.error('Cannot subscribe: no channel available');
            return;
        }

        await this.channel.assertExchange(exchange, 'topic', { durable: true });
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.bindQueue(queue, exchange, routingKey);

        this.channel.consume(queue, async (msg: any) => {
            if (!msg) return;

            try {
                const content = JSON.parse(msg.content.toString());
                await handler(content);
                this.channel!.ack(msg);
            } catch (err) {
                this.logger.error({ err }, 'Error processing message');
                this.channel!.nack(msg, false, false);
            }
        });

        this.logger.info({ exchange, queue, routingKey }, 'Subscribed to queue');
    }

    async close(): Promise<void> {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
    }
}
