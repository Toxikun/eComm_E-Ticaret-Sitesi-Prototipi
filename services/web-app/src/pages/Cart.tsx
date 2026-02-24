import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, clearCart, type Cart as CartType } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

export default function Cart() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartType | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getCart(user.id)
            .then(setCart)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    const handleQuantity = async (productId: string, qty: number) => {
        if (!user) return;
        setUpdating(productId);
        try {
            const updated = await updateCartItem(user.id, productId, qty);
            setCart(updated);
        } catch { /* ignore */ }
        setUpdating(null);
    };

    const handleClear = async () => {
        if (!user) return;
        await clearCart(user.id);
        setCart({ userId: user.id, items: [], totalAmount: 0, updatedAt: null });
    };

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    const items = cart?.items || [];

    return (
        <div className="cart-page">
            <div className="container">
                <h1>Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <h3>Your cart is empty</h3>
                        <p>Add some products to get started!</p>
                        <Link to="/products" className="btn btn-primary">Browse Products</Link>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {items.map((item) => (
                                <div key={item.productId} className="glass-card cart-item">
                                    <div className="cart-item-icon">📦</div>
                                    <div className="cart-item-details">
                                        <h3>{item.productName}</h3>
                                        <div className="unit-price">${item.unitPrice.toFixed(2)} each</div>
                                    </div>
                                    <div className="cart-item-qty">
                                        <button
                                            onClick={() => handleQuantity(item.productId, item.quantity - 1)}
                                            disabled={updating === item.productId}
                                        >−</button>
                                        <span>{item.quantity}</span>
                                        <button
                                            onClick={() => handleQuantity(item.productId, item.quantity + 1)}
                                            disabled={updating === item.productId}
                                        >+</button>
                                    </div>
                                    <div className="cart-item-total">${item.totalPrice.toFixed(2)}</div>
                                    <button
                                        className="cart-item-remove"
                                        onClick={() => handleQuantity(item.productId, 0)}
                                        disabled={updating === item.productId}
                                        title="Remove"
                                    >✕</button>
                                </div>
                            ))}
                        </div>

                        <div className="glass-card cart-summary">
                            <div className="total-row">
                                <span>Total</span>
                                <span className="amount">${cart?.totalAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-secondary" onClick={handleClear}>Clear Cart</button>
                                <button className="btn btn-primary btn-full" onClick={() => navigate('/checkout')}>
                                    Checkout →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
