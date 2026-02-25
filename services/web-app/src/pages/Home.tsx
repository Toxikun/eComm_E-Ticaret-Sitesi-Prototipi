import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
    return (
        <div className="animate-fade-in">
            <section className="home-hero">
                <div className="container">
                    <h1>
                        Shop the <span className="gradient-text">Future</span>
                    </h1>
                    <p>
                        Discover premium products powered by cutting-edge microservices architecture.
                        Fast, reliable, and built for scale.
                    </p>
                    <div className="hero-actions">
                        <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
                        <Link to="/register" className="btn btn-secondary btn-lg">Create Account</Link>
                    </div>
                </div>
            </section>

            <section className="home-features">
                <div className="container">
                    <h2>Why eComm?</h2>
                    <div className="features-grid stagger">
                        <div className="glass-card feature-card animate-slide-up">
                            <div className="feature-icon">🚀</div>
                            <h3>Lightning Fast</h3>
                            <p>Microservices architecture ensures each component scales independently for maximum performance.</p>
                        </div>
                        <div className="glass-card feature-card animate-slide-up">
                            <div className="feature-icon">🔒</div>
                            <h3>Secure Payments</h3>
                            <p>JWT authentication and encrypted payment processing keep your data safe at every step.</p>
                        </div>
                        <div className="glass-card feature-card animate-slide-up">
                            <div className="feature-icon">📦</div>
                            <h3>Real-time Inventory</h3>
                            <p>Event-driven inventory management ensures stock accuracy with instant updates.</p>
                        </div>
                        <div className="glass-card feature-card animate-slide-up">
                            <div className="feature-icon">📱</div>
                            <h3>Mobile Ready</h3>
                            <p>Designed to be responsive and ready for native mobile apps with Android support coming soon.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
