import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMoveToCart: (product: import('../context/WishlistContext').WishlistProduct) => void;
}

export const WishlistPanel: React.FC<WishlistPanelProps> = ({ isOpen, onClose, onMoveToCart }) => {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 200,
      display: 'flex',
      justifyContent: 'flex-end',
    }} onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInWishlist {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}} />
      <div
        className="glass-panel"
        style={{
          width: '450px',
          maxWidth: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          boxShadow: 'var(--shadow-md)',
          animation: 'slideInWishlist 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          borderLeft: '1px solid var(--border-color)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Heart size={20} color="var(--accent-gold)" fill="var(--accent-gold)" />
            <h2 className="serif-font" style={{ fontSize: '1.75rem', margin: 0 }}>My Wishlist</h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: 'var(--text-primary)', cursor: 'pointer', padding: 4
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {wishlistItems.length === 0 ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', gap: '12px', textAlign: 'center',
            }}>
              <Heart size={40} color="var(--text-muted)" />
              <p className="serif-font" style={{ fontSize: '1.25rem' }}>
                Your wishlist is empty
              </p>
              <p style={{ fontSize: '0.85rem', maxWidth: '260px' }}>
                Click the heart icon on any product to save it for later.
              </p>
              <button className="btn btn-secondary" onClick={onClose}
                style={{ fontSize: '0.8rem', padding: '10px 20px' }}>
                Explore Catalog
              </button>
            </div>
          ) : (
            wishlistItems.map(item => (
              <div key={item.id} style={{
                display: 'flex', gap: '16px',
                padding: '16px 0',
                borderBottom: '1px solid var(--border-color)',
              }}>
                {/* Product Image */}
                <div style={{
                  width: '72px', height: '72px', flexShrink: 0,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Heart size={24} color="var(--text-muted)" />
                  )}
                </div>

                {/* Info */}
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '0.65rem', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--accent-gold)',
                    fontWeight: 600, display: 'block', marginBottom: '2px'
                  }}>{item.brand}</span>
                  <h4 className="serif-font" style={{
                    fontSize: '1rem', marginBottom: '4px', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{item.name}</h4>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--accent-gold)' }}>
                    ${item.price.toLocaleString()}
                  </strong>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '7px 14px', fontSize: '0.72rem', gap: '6px' }}
                      onClick={() => onMoveToCart(item)}
                    >
                      <ShoppingBag size={12} /> Add to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      style={{
                        background: 'none', border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        padding: '7px 10px', display: 'flex', alignItems: 'center',
                      }}
                      title="Remove from wishlist"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer count */}
        {wishlistItems.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px', marginTop: '16px',
            fontSize: '0.8rem', color: 'var(--text-secondary)',
            textAlign: 'center',
          }}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved to wishlist
          </div>
        )}
      </div>
    </div>
  );
};
