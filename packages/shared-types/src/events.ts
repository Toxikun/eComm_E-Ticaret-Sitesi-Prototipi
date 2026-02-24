// ─── Event Types (Message Broker) ───

export enum EventType {
    // Auth events
    USER_REGISTERED = 'user.registered',
    USER_LOGIN = 'user.login',

    // Product events
    PRODUCT_CREATED = 'product.created',
    PRODUCT_UPDATED = 'product.updated',
    PRICE_CHANGED = 'price.changed',

    // Order events
    ORDER_PLACED = 'order.placed',
    ORDER_CONFIRMED = 'order.confirmed',
    ORDER_SHIPPED = 'order.shipped',
    ORDER_CANCELLED = 'order.cancelled',

    // Payment events
    PAYMENT_SUCCEEDED = 'payment.succeeded',
    PAYMENT_FAILED = 'payment.failed',

    // Inventory events
    STOCK_RESERVED = 'stock.reserved',
    STOCK_RELEASED = 'stock.released',
    STOCK_LOW = 'stock.low',
}

export interface DomainEvent<T = unknown> {
    id: string;
    type: EventType;
    timestamp: Date;
    source: string;
    data: T;
    correlationId?: string;
}

export interface OrderPlacedEvent {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    email: string;
}

export interface PaymentSucceededEvent {
    paymentId: string;
    orderId: string;
    amount: number;
    transactionId: string;
}

export interface PaymentFailedEvent {
    paymentId: string;
    orderId: string;
    reason: string;
}

export interface StockReservedEvent {
    reservationId: string;
    orderId: string;
    items: Array<{ productId: string; quantity: number }>;
}

export interface StockLowEvent {
    productId: string;
    currentStock: number;
    threshold: number;
}
