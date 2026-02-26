import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, type Product } from '../api/products';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

// Resolve image URL: uploaded files go through the API gateway
function resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
        return `/api/product-uploads${url.replace('/uploads', '')}`;
    }
    return url;
}

function getStockLabel(stock: number) {
    const s = Number(stock);
    if (s <= 0) return { text: 'Out of stock', cls: 'out-of-stock' };
    if (s < 10) return { text: `Only ${s} left`, cls: 'low-stock' };
    return { text: 'In stock', cls: 'in-stock' };
}

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const { addItem } = useCart();
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
        if (!product) return;
        setAdding(true);
        try {
            await addItem(
                { id: product.id, name: product.name, price: Number(product.price) },
                qty,
            );
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

    const stock = getStockLabel(product.stock);

    return (
        <div className="detail-page">
            <div className="container">
                <Link to="/products" className="back-link">← Back to Products</Link>

                <div className="detail-layout">
                    <div className="detail-image">
                        {product.image_url ? (
                            <img src={resolveImageUrl(product.image_url)} alt={product.name} />
                        ) : (
                            '📦'
                        )}
                    </div>

                    <div className="detail-info">
                        <div className="category">{product.category}</div>
                        <h1>{product.name}</h1>
                        <div className="price">${Number(product.price).toFixed(2)}</div>
                        <div className={`stock ${stock.cls}`}>{stock.text}</div>
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
