import { apiFetch } from './client';

export interface CartItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export interface Cart {
    userId: string;
    items: CartItem[];
    totalAmount: number;
    updatedAt: string | null;
}

export async function getCart(userId: string): Promise<Cart> {
    return apiFetch<Cart>(`/cart/${userId}`);
}

export async function addToCart(
    userId: string,
    item: { productId: string; productName: string; unitPrice: number; quantity: number }
): Promise<Cart> {
    return apiFetch<Cart>(`/cart/${userId}/items`, {
        method: 'POST',
        body: JSON.stringify(item),
    });
}

export async function updateCartItem(
    userId: string,
    productId: string,
    quantity: number
): Promise<Cart> {
    return apiFetch<Cart>(`/cart/${userId}/items/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
    });
}

export async function clearCart(userId: string): Promise<void> {
    return apiFetch<void>(`/cart/${userId}`, { method: 'DELETE' });
}
