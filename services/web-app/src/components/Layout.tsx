import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Layout.css';

export default function Layout() {
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => { setMenuOpen(false); }, [location]);

    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    return (
        <>
            <header className="layout-header">
                <div className="container">
                    <Link to="/" className="header-logo">🛒 eComm</Link>

                    <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? '✕' : '☰'}
                    </button>

                    <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
                        <Link to="/products" className={isActive('/products')}>Products</Link>
                        {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
                            <Link to="/add-product" className={isActive('/add-product')}>Add Product</Link>
                        )}

                        <Link to="/cart" className={`cart-badge ${isActive('/cart')}`}>
                            🛒 Cart
                            {itemCount > 0 && <span className="count">{itemCount}</span>}
                        </Link>

                        {user ? (
                            <>
                                <Link to="/orders" className={isActive('/orders')}>Orders</Link>
                                <Link to="/notifications" className={isActive('/notifications')}>
                                    🔔 Notifications
                                </Link>
                                <Link to="/profile" className={isActive('/profile')}>
                                    <span className="user-name">{user.name}</span>
                                </Link>
                                <button onClick={logout}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={isActive('/login')}>Login</Link>
                                <Link to="/register" className={`btn btn-primary btn-sm`}>Sign Up</Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="layout-main">
                <Outlet />
            </main>

            <footer className="layout-footer">
                <div className="container">
                    © 2026 eComm. Built with microservices.
                </div>
            </footer>
        </>
    );
}
