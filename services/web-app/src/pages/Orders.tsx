import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserOrders, type Order } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

export default function Orders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        getUserOrders(user.id)
            .then(setOrders)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="orders-page">
            <div className="container">
                <h1>My Orders</h1>

                {error && <div className="alert alert-error">{error}</div>}

                {orders.length === 0 ? (
                    <div className="empty-state">
                        <h3>No orders yet</h3>
                        <p>When you place your first order, it will show up here.</p>
                        <Link to="/products" className="btn btn-primary">Browse Products</Link>
                    </div>
                ) : (
                    <div className="orders-list stagger">
                        {orders.map((order) => (
                            <div key={order.id} className="glass-card order-card animate-slide-up">
                                <div className="order-card-header">
                                    <div>
                                        <span className="order-id">#{order.id.slice(0, 8)}</span>
                                        <span className={`status-badge status-${order.status}`} style={{ marginLeft: 12 }}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="order-amount">${Number(order.total_amount).toFixed(2)}</div>
                                </div>
                                <div className="order-meta">
                                    <span>📍 {order.shipping_address}</span>
                                    <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
