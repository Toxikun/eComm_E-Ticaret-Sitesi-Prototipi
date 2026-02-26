import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

export default function Cart() {
    const { user } = useAuth();
    const { items, totalAmount, loading, updateItem, removeItem, clear } = useCart();
    const navigate = useNavigate();

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

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
                                        <button onClick={() => updateItem(item.productId, item.quantity - 1)}>−</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateItem(item.productId, item.quantity + 1)}>+</button>
                                    </div>
                                    <div className="cart-item-total">${item.totalPrice.toFixed(2)}</div>
                                    <button
                                        className="cart-item-remove"
                                        onClick={() => removeItem(item.productId)}
                                        title="Remove"
                                    >✕</button>
                                </div>
                            ))}
                        </div>

                        <div className="glass-card cart-summary">
                            <div className="total-row">
                                <span>Total</span>
                                <span className="amount">${totalAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-secondary" onClick={() => clear()}>Clear Cart</button>
                                {user ? (
                                    <button className="btn btn-primary btn-full" onClick={() => navigate('/checkout')}>
                                        Checkout →
                                    </button>
                                ) : (
                                    <Link to="/login" className="btn btn-primary btn-full" style={{ textAlign: 'center' }}>
                                        Login to Checkout →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
