// ─── Cart Types ───
export interface Cart {
    userId: string;
    items: CartItem[];
    totalAmount: number;
    updatedAt: Date;
}

export interface CartItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
}

export interface UpdateCartItemRequest {
    quantity: number;
}
