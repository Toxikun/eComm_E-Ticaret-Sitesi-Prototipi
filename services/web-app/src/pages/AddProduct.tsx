import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Reusing some base form styles

export default function AddProduct() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: ''
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const body = new FormData();
            body.append('name', formData.name);
            body.append('description', formData.description);
            body.append('price', formData.price);
            body.append('category', formData.category);
            body.append('stock', formData.stock || '0');
            if (imageFile) {
                body.append('image', imageFile);
            }

            const accessToken = localStorage.getItem('accessToken');
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Failed (${res.status})`);
            }

            navigate('/products');
        } catch (err: any) {
            setError(err.message || 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="glass-card auth-card animate-scale-in" style={{ maxWidth: 560 }}>
                    <h2>Add New Product</h2>
                    <p className="auth-subtitle">Enter product details to list it in the store.</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="ap-name">Product Name</label>
                            <input
                                className="form-input"
                                type="text"
                                id="ap-name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Quantum V Headset"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="ap-category">Category</label>
                            <input
                                className="form-input"
                                type="text"
                                id="ap-category"
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g. Electronics"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="ap-price">Price ($)</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    id="ap-price"
                                    step="0.01"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="ap-stock">Stock</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    id="ap-stock"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="form-group">
                            <label className="form-label">Product Image</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: imagePreview ? 0 : 40,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'border-color var(--transition-fast)',
                                    overflow: 'hidden',
                                    background: 'var(--bg-input)',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div>
                                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📷</div>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                                            Click to upload an image
                                        </p>
                                        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.75rem' }}>
                                            JPG, PNG, GIF, WebP — Max 5 MB
                                        </p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                            {imageFile && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                                    ✓ {imageFile.name}
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="ap-description">Description</label>
                            <textarea
                                className="form-input"
                                id="ap-description"
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your product..."
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating Product...' : '🚀 Create Product'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
