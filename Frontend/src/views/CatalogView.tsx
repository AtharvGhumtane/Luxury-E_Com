import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useToast } from '../context/ToastContext';
import { Search, ShoppingBag, Check, X, Plus, Heart, Clock } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  brand: string;
  imageUrl: string;
  categoryName: string;
  active: boolean;
}

export const CatalogView: React.FC = () => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { recentlyViewed, addRecentlyViewed } = useRecentlyViewed();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Track adding success toast state for individual products
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Admin Create Product modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [apiCategories, setApiCategories] = useState<{ id: string; name: string }[]>([]);

  // Create product form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/api/products');
      setProducts(response.data.content || response.data);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to retrieve catalog. Make sure backend services are active.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/products/categories');
      setApiCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts();
    fetchCategories();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
      }, 1);

      setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedItemIds(prev => ({ ...prev, [product.id]: false }));
      }, 2000);

      showToast(`"${product.name}" added to cart!`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication required to modify shopping cart.';
      showToast(message, 'error');
    }
  };

  const handleWishlistToggle = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasWishlisted = isWishlisted(product.id);
    toggleWishlist({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      sku: product.sku,
      categoryName: product.categoryName,
      description: product.description,
    });
    showToast(
      wasWishlisted
        ? `"${product.name}" removed from wishlist`
        : `"${product.name}" saved to wishlist`,
      wasWishlisted ? 'info' : 'success'
    );
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      sku: product.sku,
      categoryName: product.categoryName,
      description: product.description,
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSku || !newPrice || !newCategoryId) {
      setCreateError('Please fill in all required fields.');
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await apiClient.post('/api/products', {
        name: newName,
        description: newDescription,
        sku: newSku,
        price: parseFloat(newPrice),
        brand: newBrand || 'LVMH Maison',
        imageUrl: newImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        categoryId: newCategoryId,
      });
      setNewName(''); setNewDescription(''); setNewSku(''); setNewPrice('');
      setNewBrand(''); setNewImageUrl(''); setNewCategoryId('');
      setShowCreateModal(false);
      showToast('Product published to catalog!', 'success');
      fetchProducts();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to create product. Check permissions.';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.categoryName || 'Other'))];

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Heart button component reused in card and modal
  const WishlistHeart = ({ product, size = 16 }: { product: Product; size?: number }) => {
    const wishlisted = isWishlisted(product.id);
    return (
      <button
        onClick={(e) => handleWishlistToggle(product, e)}
        title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        style={{
          background: 'none',
          border: wishlisted ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
          cursor: 'pointer',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          backgroundColor: wishlisted ? 'rgba(197,168,128,0.08)' : 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = wishlisted ? 'var(--accent-gold)' : 'var(--border-color)';
        }}
      >
        <Heart
          size={size}
          fill={wishlisted ? 'var(--accent-gold)' : 'none'}
          color={wishlisted ? 'var(--accent-gold)' : 'var(--text-muted)'}
          style={{ transition: 'all 0.2s ease' }}
        />
      </button>
    );
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}} />

      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '60px 0 40px 0',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '40px',
      }}>
        <h1 className="serif-font" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
          The Maison Catalog
        </h1>
        <p style={{
          fontSize: '1.1rem', maxWidth: '600px',
          margin: '0 auto', color: 'var(--text-secondary)',
        }}>
          Discover curated collections of watches, jewelry, and leather goods designed by LVMH artisans.
        </p>
      </section>

      {/* Filters & Search Row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '20px',
        justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              placeholder="Search catalog..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '44px', borderRadius: '0' }}
            />
            <Search size={16} style={{
              position: 'absolute', left: '16px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
            }} />
          </div>

          {/* Category Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Admin Action Button */}
        {user?.role === 'ROLE_ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: '24px', border: '1px solid #ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          color: '#ef4444', textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="product-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel" style={{ height: '380px', animation: 'pulse 1.5s infinite' }}>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 0.3; }
                }
              `}} />
            </div>
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <p className="serif-font" style={{ fontSize: '1.25rem' }}>No products match your criteria.</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div
                key={product.id}
                className="glass-panel"
                onClick={() => handleOpenProduct(product)}
                style={{
                  display: 'flex', flexDirection: 'column', padding: '24px',
                  boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-smooth)',
                  cursor: 'pointer', position: 'relative',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Category + Wishlist row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '0.7rem', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: 600,
                  }}>{product.brand}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.categoryName}</span>
                    <WishlistHeart product={product} size={14} />
                  </div>
                </div>

                {/* Product Image */}
                {product.imageUrl && (
                  <div style={{
                    height: '160px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginBottom: '16px', overflow: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.02)',
                  }}>
                    <img
                      src={product.imageUrl} alt={product.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}

                <h3 className="serif-font" style={{
                  fontSize: '1.4rem', lineHeight: '1.2',
                  color: 'var(--text-primary)', marginBottom: '8px',
                }}>{product.name}</h3>

                <span style={{
                  fontSize: '0.7rem', color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: '16px', display: 'block',
                }}>SKU: {product.sku}</span>

                <p style={{
                  fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '24px',
                  flexGrow: 1, display: '-webkit-box',
                  WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{product.description}</p>

                {/* Price and Cart Button Row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: '1px solid var(--border-color)', paddingTop: '16px',
                }}>
                  <strong className="serif-font" style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>
                    ${product.price.toLocaleString()}
                  </strong>

                  <button
                    onClick={e => { e.stopPropagation(); handleAddToCart(product); }}
                    className={`btn ${addedItemIds[product.id] ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '10px 18px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {addedItemIds[product.id] ? <><Check size={14} /> Added</> : <><ShoppingBag size={14} /> Add to Cart</>}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Recently Viewed Section ─────────────────────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <section style={{ marginTop: '64px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px',
          }}>
            <Clock size={16} color="var(--accent-gold)" />
            <h2 className="serif-font" style={{ fontSize: '1.6rem', margin: 0 }}>Recently Viewed</h2>
          </div>

          <div style={{
            display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px',
            scrollbarWidth: 'thin',
          }}>
            {recentlyViewed.map(product => (
              <div
                key={product.id}
                className="glass-panel"
                onClick={() => {
                  const full = products.find(p => p.id === product.id);
                  if (full) handleOpenProduct(full);
                }}
                style={{
                  flexShrink: 0, width: '200px', padding: '16px',
                  cursor: 'pointer', border: '1px solid var(--border-color)',
                  transition: 'var(--transition-smooth)',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Mini image */}
                <div style={{
                  height: '100px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '12px',
                  backgroundColor: 'rgba(255,255,255,0.01)', overflow: 'hidden',
                }}>
                  <img src={product.imageUrl} alt={product.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span style={{
                  fontSize: '0.6rem', color: 'var(--accent-gold)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontWeight: 600, display: 'block', marginBottom: '4px',
                }}>{product.brand}</span>
                <h4 className="serif-font" style={{
                  fontSize: '0.95rem', color: 'var(--text-primary)',
                  marginBottom: '6px', lineHeight: '1.2',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{product.name}</h4>
                <strong style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>
                  ${product.price.toLocaleString()}
                </strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px',
        }} onClick={() => setSelectedProduct(null)}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
            borderRadius: '0px', border: '1px solid var(--border-color)', position: 'relative',
            padding: '40px', boxShadow: 'var(--shadow-md)', animation: 'fadeIn 0.3s ease-out',
            color: 'var(--text-primary)',
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'transparent', border: 'none',
                color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
            >
              <X size={24} />
            </button>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px', marginTop: '10px',
            }}>
              {/* Product Image */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                height: '300px', position: 'relative', overflow: 'hidden',
              }}>
                <img
                  src={selectedProduct.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                  alt={selectedProduct.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Product Info */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{
                    fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '8px', display: 'block',
                  }}>{selectedProduct.brand}</span>

                  <h2 className="serif-font" style={{
                    fontSize: '2.2rem', lineHeight: '1.2',
                    marginBottom: '12px', color: 'var(--text-primary)',
                  }}>{selectedProduct.name}</h2>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '20px', fontSize: '0.8rem', color: 'var(--text-muted)',
                  }}>
                    <span>Category: {selectedProduct.categoryName}</span>
                    <span>SKU: {selectedProduct.sku}</span>
                  </div>

                  <p style={{
                    fontSize: '0.9rem', lineHeight: '1.6',
                    color: 'var(--text-secondary)', marginBottom: '24px',
                  }}>{selectedProduct.description}</p>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-color)', paddingTop: '20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                }}>
                  <span className="serif-font" style={{
                    fontSize: '2rem', color: 'var(--accent-gold)', fontWeight: 500,
                  }}>${selectedProduct.price.toLocaleString()}</span>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Wishlist in modal */}
                    <WishlistHeart product={selectedProduct} size={18} />

                    <button
                      onClick={e => { e.stopPropagation(); handleAddToCart(selectedProduct); }}
                      className={`btn ${addedItemIds[selectedProduct.id] ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '12px 24px', fontSize: '0.8rem', gap: '8px' }}
                    >
                      {addedItemIds[selectedProduct.id]
                        ? <><Check size={16} /> Added</>
                        : <><ShoppingBag size={16} /> Add to Cart</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Product Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px',
        }} onClick={() => setShowCreateModal(false)}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto',
            borderRadius: '0px', border: '1px solid var(--border-color)', position: 'relative',
            padding: '40px', boxShadow: 'var(--shadow-md)', animation: 'fadeIn 0.3s ease-out',
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'transparent', border: 'none',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              <X size={24} />
            </button>

            <h2 className="serif-font" style={{ fontSize: '2rem', marginBottom: '24px', textAlign: 'center' }}>
              New Collection Entry
            </h2>

            {createError && (
              <div style={{
                padding: '12px', border: '1px solid #ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444',
                marginBottom: '20px', fontSize: '0.85rem',
              }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="form-control" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  <input type="text" value={newBrand} onChange={e => setNewBrand(e.target.value)}
                    placeholder="e.g., Louis Vuitton" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code *</label>
                  <input type="text" value={newSku} onChange={e => setNewSku(e.target.value)}
                    placeholder="e.g., LV-BAG-001" className="form-control" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Price (USD) *</label>
                  <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select value={newCategoryId} onChange={e => setNewCategoryId(e.target.value)}
                    className="form-control" required
                    style={{ appearance: 'none', WebkitAppearance: 'none', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                    <option value="">Select Category</option>
                    {apiCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="text" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..." className="form-control" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)}
                  rows={4} className="form-control" style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={createLoading}>
                  {createLoading ? 'Publishing...' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
