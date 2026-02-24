import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCart } from '../api/cart';
import './Layout.css';

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => { setMenuOpen(false); }, [location]);

    useEffect(() => {
        if (!user) { setCartCount(0); return; }
        getCart(user.id)
            .then((c) => setCartCount(c.items.length))
            .catch(() => setCartCount(0));
    }, [user, location]);

    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    return (
        <>
            <header className="layout-header">
                <div className="container">
                    <Link to="/" className="header-logo">⚡ AntiGravity</Link>

                    <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? '✕' : '☰'}
                    </button>

                    <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
                        <Link to="/products" className={isActive('/products')}>Products</Link>

                        {user ? (
                            <>
                                <Link to="/cart" className={`cart-badge ${isActive('/cart')}`}>
                                    🛒 Cart
                                    {cartCount > 0 && <span className="count">{cartCount}</span>}
                                </Link>
                                <Link to="/orders" className={isActive('/orders')}>Orders</Link>
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
                    © 2026 AntiGravity. Built with microservices.
                </div>
            </footer>
        </>
    );
}
