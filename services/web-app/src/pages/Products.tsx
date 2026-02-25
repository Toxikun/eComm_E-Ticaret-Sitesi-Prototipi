import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, type Product, type ProductQuery } from '../api/products';
import './Products.css';

// Resolve image URL: uploaded files go through the API gateway
function resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
        return `/api/product-uploads${url.replace('/uploads', '')}`;
    }
    return url;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState<ProductQuery>({ page: 1, limit: 12, sortBy: 'created_at', sortOrder: 'desc' });
    const [searchInput, setSearchInput] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getProducts(query);
            setProducts(result.data);
            setTotal(result.totalPages);
        } catch (err: any) {
            setError(err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleSearch = () => {
        setQuery((q) => ({ ...q, search: searchInput, page: 1 }));
    };

    const handleSort = (value: string) => {
        const [sortBy, sortOrder] = value.split(':');
        setQuery((q) => ({ ...q, sortBy, sortOrder, page: 1 }));
    };

    const getStockLabel = (stock: number) => {
        const s = Number(stock);
        if (s <= 0) return { text: 'Out of stock', cls: 'out-of-stock' };
        if (s < 10) return { text: `Only ${s} left`, cls: 'low-stock' };
        return { text: 'In stock', cls: 'in-stock' };
    };

    return (
        <div className="products-page">
            <div className="container">
                <div className="products-header">
                    <h1>Products</h1>
                    <div className="products-controls">
                        <input
                            className="search-input"
                            type="text"
                            placeholder="Search products..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <select className="sort-select" onChange={(e) => handleSort(e.target.value)} defaultValue="created_at:desc">
                            <option value="created_at:desc">Newest</option>
                            <option value="created_at:asc">Oldest</option>
                            <option value="price:asc">Price: Low → High</option>
                            <option value="price:desc">Price: High → Low</option>
                            <option value="name:asc">Name: A → Z</option>
                        </select>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <div className="page-loader"><div className="spinner" /></div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <h3>No products found</h3>
                        <p>Try adjusting your search or check back later.</p>
                    </div>
                ) : (
                    <>
                        <div className="products-grid stagger">
                            {products.map((product) => {
                                const stock = getStockLabel(product.stock);
                                return (
                                    <Link key={product.id} to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div className="glass-card product-card animate-slide-up">
                                            <div className="product-image">
                                                {product.image_url ? (
                                                    <img src={resolveImageUrl(product.image_url)} alt={product.name} />
                                                ) : (
                                                    '📦'
                                                )}
                                            </div>
                                            <div className="product-info">
                                                <div className="category">{product.category}</div>
                                                <h3>{product.name}</h3>
                                                <div className="price">${Number(product.price).toFixed(2)}</div>
                                                <div className={`stock ${stock.cls}`}>{stock.text}</div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {total > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={query.page === 1}
                                    onClick={() => setQuery((q) => ({ ...q, page: (q.page || 1) - 1 }))}
                                >
                                    ← Prev
                                </button>
                                <span className="page-info">Page {query.page} of {total}</span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={query.page === total}
                                    onClick={() => setQuery((q) => ({ ...q, page: (q.page || 1) + 1 }))}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
