import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, clearCart as apiClearCart, type Cart, type CartItem } from '../api/cart';

/* ─── Guest cart helpers (localStorage) ─── */

interface GuestItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
}

const GUEST_CART_KEY = 'guest_cart';

function readGuestCart(): GuestItem[] {
    try {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeGuestCart(items: GuestItem[]) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
    localStorage.removeItem(GUEST_CART_KEY);
}

/* ─── Unified cart item type for the context ─── */

export interface UnifiedCartItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

interface CartContextType {
    items: UnifiedCartItem[];
    totalAmount: number;
    itemCount: number;
    loading: boolean;
    addItem: (product: { id: string; name: string; price: number }, quantity: number) => Promise<void>;
    updateItem: (productId: string, quantity: number) => Promise<void>;
    removeItem: (productId: string) => Promise<void>;
    clear: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ─── Provider ─── */

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<UnifiedCartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const prevUserRef = useRef<string | null>(null);

    /* Helper: build unified items from guest items */
    const guestToUnified = (guestItems: GuestItem[]): UnifiedCartItem[] =>
        guestItems.map((g) => ({
            productId: g.productId,
            productName: g.productName,
            unitPrice: g.unitPrice,
            quantity: g.quantity,
            totalPrice: g.unitPrice * g.quantity,
        }));

    /* Helper: build unified items from server cart */
    const serverToUnified = (cart: Cart): UnifiedCartItem[] =>
        cart.items.map((i: CartItem) => ({
            productId: i.productId,
            productName: i.productName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            totalPrice: i.totalPrice,
        }));

    /* Fetch cart – from API (auth) or localStorage (guest) */
    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            if (user) {
                const cart = await getCart(user.id);
                setItems(serverToUnified(cart));
            } else {
                setItems(guestToUnified(readGuestCart()));
            }
        } catch {
            /* on error just clear */
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    /* On mount + user change: fetch cart.
       On login (prev null → user), merge guest cart first. */
    useEffect(() => {
        const prevUser = prevUserRef.current;
        const currentUser = user?.id ?? null;
        prevUserRef.current = currentUser;

        if (!prevUser && currentUser) {
            /* User just logged in – merge guest cart then fetch */
            (async () => {
                setLoading(true);
                const guestItems = readGuestCart();
                for (const g of guestItems) {
                    try {
                        await apiAddToCart(currentUser, {
                            productId: g.productId,
                            productName: g.productName,
                            unitPrice: g.unitPrice,
                            quantity: g.quantity,
                        });
                    } catch { /* ignore individual failures */ }
                }
                clearGuestCart();
                await fetchCart();
            })();
        } else {
            fetchCart();
        }
    }, [user, fetchCart]);

    /* ─── Actions ─── */

    const addItem = useCallback(async (product: { id: string; name: string; price: number }, quantity: number) => {
        if (user) {
            await apiAddToCart(user.id, {
                productId: product.id,
                productName: product.name,
                unitPrice: product.price,
                quantity,
            });
            await fetchCart();
        } else {
            const guest = readGuestCart();
            const existing = guest.find((g) => g.productId === product.id);
            if (existing) {
                existing.quantity += quantity;
            } else {
                guest.push({
                    productId: product.id,
                    productName: product.name,
                    unitPrice: product.price,
                    quantity,
                });
            }
            writeGuestCart(guest);
            setItems(guestToUnified(guest));
        }
    }, [user, fetchCart]);

    const updateItem = useCallback(async (productId: string, quantity: number) => {
        if (quantity <= 0) {
            /* Treat as remove */
            if (user) {
                await apiUpdateCartItem(user.id, productId, 0);
                await fetchCart();
            } else {
                const guest = readGuestCart().filter((g) => g.productId !== productId);
                writeGuestCart(guest);
                setItems(guestToUnified(guest));
            }
            return;
        }

        if (user) {
            await apiUpdateCartItem(user.id, productId, quantity);
            await fetchCart();
        } else {
            const guest = readGuestCart();
            const item = guest.find((g) => g.productId === productId);
            if (item) item.quantity = quantity;
            writeGuestCart(guest);
            setItems(guestToUnified(guest));
        }
    }, [user, fetchCart]);

    const removeItem = useCallback(async (productId: string) => {
        await updateItem(productId, 0);
    }, [updateItem]);

    const clear = useCallback(async () => {
        if (user) {
            await apiClearCart(user.id);
        } else {
            clearGuestCart();
        }
        setItems([]);
    }, [user]);

    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const itemCount = items.length;

    return (
        <CartContext.Provider value={{ items, totalAmount, itemCount, loading, addItem, updateItem, removeItem, clear, refreshCart: fetchCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextType {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
