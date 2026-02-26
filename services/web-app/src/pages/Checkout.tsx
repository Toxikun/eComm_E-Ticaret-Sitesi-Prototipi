import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Checkout.css';

export default function Checkout() {
    const { user } = useAuth();
    const { items, totalAmount, loading, refreshCart } = useCart();
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');
    const [orderId, setOrderId] = useState<string | null>(null);

    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [zip, setZip] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setPlacing(true);
        try {
            const shippingAddress = `${address}, ${city} ${zip}`;
            const result = await createOrder({ shippingAddress });
            setOrderId(result.orderId);
            await refreshCart();
        } catch (err: any) {
            setError(err.message || 'Failed to place order');
        } finally {
            setPlacing(false);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    if (orderId) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <div className="order-success">
                        <div className="success-icon">🎉</div>
                        <h2>Order Placed!</h2>
                        <p>Your order <strong>{orderId.slice(0, 8)}...</strong> has been confirmed.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <Link to="/orders" className="btn btn-primary">View Orders</Link>
                            <Link to="/products" className="btn btn-secondary">Continue Shopping</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <div className="empty-state">
                        <h3>Your cart is empty</h3>
                        <Link to="/products" className="btn btn-primary">Browse Products</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1 style={{ marginBottom: 32 }}>Checkout</h1>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="checkout-layout">
                    <div className="glass-card checkout-form">
                        <h2>Shipping Address</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Street Address</label>
                                <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Zip Code</label>
                                <input className="form-input" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="10001" required />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={placing}>
                                {placing ? <span className="spinner" /> : `Place Order — $${totalAmount.toFixed(2)}`}
                            </button>
                        </form>
                    </div>

                    <div className="glass-card checkout-summary">
                        <h3>Order Summary</h3>
                        <div className="checkout-items">
                            {items.map((item) => (
                                <div key={item.productId} className="checkout-item">
                                    <span className="name">{item.productName} ×{item.quantity}</span>
                                    <span className="price">${item.totalPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="checkout-total">
                            <span>Total</span>
                            <span className="amount">${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
