import { apiFetch } from './client';

export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    shipping_address: string;
    payment_id: string | null;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface CreateOrderResponse {
    orderId: string;
    status: string;
    totalAmount: number;
}

export async function createOrder(data: {
    shippingAddress: string;
    paymentMethodId?: string;
}): Promise<CreateOrderResponse> {
    return apiFetch<CreateOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getOrder(id: string): Promise<Order> {
    return apiFetch<Order>(`/orders/${id}`);
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    return apiFetch<Order[]>(`/orders/user/${userId}`);
}
