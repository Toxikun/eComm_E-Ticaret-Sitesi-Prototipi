import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="profile-page">
            <div className="container">
                <div className="glass-card profile-card">
                    <div className="profile-avatar">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <h2>{user.name}</h2>
                    <p className="profile-email">{user.email}</p>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-accent' : 'badge-info'} profile-role`}>
                        {user.role}
                    </span>

                    <div className="profile-actions">
                        <Link to="/orders" className="btn btn-secondary btn-full">📦 My Orders</Link>
                        <button className="btn btn-danger btn-full" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
