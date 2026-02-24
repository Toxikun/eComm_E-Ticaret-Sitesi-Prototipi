import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, type Product } from '../api/products';
import { addToCart } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [qty, setQty] = useState(1);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getProduct(id)
            .then(setProduct)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleAddToCart = async () => {
        if (!user) { navigate('/login'); return; }
        if (!product) return;
        setAdding(true);
        try {
            await addToCart(user.id, {
                productId: product.id,
                productName: product.name,
                unitPrice: product.price,
                quantity: qty,
            });
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (error) return <div className="container" style={{ padding: '40px 0' }}><div className="alert alert-error">{error}</div></div>;
    if (!product) return null;

    return (
        <div className="detail-page">
            <div className="container">
                <Link to="/products" className="back-link">← Back to Products</Link>

                <div className="detail-layout">
                    <div className="detail-image">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} />
                        ) : (
                            '📦'
                        )}
                    </div>

                    <div className="detail-info">
                        <div className="category">{product.category}</div>
                        <h1>{product.name}</h1>
                        <div className="price">${product.price.toFixed(2)}</div>
                        <p className="description">{product.description || 'No description available.'}</p>

                        <div className="quantity-selector">
                            <label>Quantity:</label>
                            <div className="qty-controls">
                                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                                <span>{qty}</span>
                                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
                            </div>
                        </div>

                        <div className="detail-actions">
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleAddToCart}
                                disabled={adding || product.stock <= 0}
                            >
                                {added ? '✓ Added!' : adding ? 'Adding...' : product.stock <= 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                            </button>
                        </div>

                        {added && <div className="alert alert-success" style={{ marginTop: 16 }}>Added to cart successfully!</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
