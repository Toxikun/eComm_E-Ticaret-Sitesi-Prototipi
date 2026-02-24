// ─── Order Types ───
export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    shippingAddress: string;
    paymentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface CreateOrderRequest {
    shippingAddressId: string;
    paymentMethodId: string;
}

export interface PaymentRequest {
    orderId: string;
    amount: number;
    currency: string;
    paymentMethodId: string;
}

export interface PaymentResult {
    id: string;
    orderId: string;
    status: 'succeeded' | 'failed' | 'pending';
    transactionId: string;
    amount: number;
    currency: string;
}
