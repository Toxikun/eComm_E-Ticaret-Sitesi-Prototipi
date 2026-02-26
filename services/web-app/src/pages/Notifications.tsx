import { useState, useEffect } from 'react';
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

function getIcon(type: string): string {
    switch (type) {
        case 'ORDER_CONFIRMED': return '🎉';
        case 'PRODUCT_SOLD': return '💰';
        case 'LOW_STOCK': return '📦';
        case 'PAYMENT_FAILED': return '⚠️';
        default: return '🔔';
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        getNotifications(user.id)
            .then(setNotifications)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [user]);

    const handleMarkRead = async (id: string) => {
        try {
            const updated = await markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: updated.is_read } : n))
            );
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch { /* ignore */ }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="notifications-page">
            <div className="container">
                <div className="notifications-header">
                    <div>
                        <h1>Notifications</h1>
                        <span className="unread-count">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </span>
                    </div>
                    {unreadCount > 0 && (
                        <button className="btn-mark-all" onClick={handleMarkAllRead}>
                            Mark all as read
                        </button>
                    )}
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <h3>No notifications yet</h3>
                        <p>You'll see updates here when something happens with your orders or products.</p>
                    </div>
                ) : (
                    <div className="notifications-list stagger">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`glass-card notification-card animate-slide-up ${n.is_read ? 'read' : 'unread'}`}
                                onClick={() => !n.is_read && handleMarkRead(n.id)}
                            >
                                <div className="notification-icon">
                                    {getIcon(n.type)}
                                </div>
                                <div className="notification-body">
                                    <div className="notification-title">{n.title}</div>
                                    <div className="notification-message">{n.message}</div>
                                    <div className="notification-time">{timeAgo(n.created_at)}</div>
                                </div>
                                <div className={`notification-dot ${n.is_read ? 'hidden' : ''}`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
