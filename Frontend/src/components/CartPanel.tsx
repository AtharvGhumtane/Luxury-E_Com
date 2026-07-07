import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ isOpen, onClose }) => {
  const { items, totalAmount, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 200,
      display: 'flex',
      justifyContent: 'flex-end',
      transition: 'opacity 0.3s ease'
    }} onClick={onClose}>
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
          animation: 'slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Style injection for panel entry animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}} />

        {/* Panel Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '20px',
          marginBottom: '20px'
        }}>
          <h2 className="serif-font" style={{ fontSize: '1.75rem', margin: 0 }}>Shopping Cart</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: 4
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Panel Items List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {items.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              gap: '12px'
            }}>
              <p className="serif-font" style={{ fontSize: '1.25rem' }}>Your shopping cart is empty</p>
              <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem', padding: '10px 20px' }}>
                Discover Catalog
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} style={{
                display: 'flex',
                gap: '16px',
                padding: '16px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ flexGrow: 1 }}>
                  <h4 className="serif-font" style={{
                    fontSize: '1.15rem',
                    color: 'var(--text-primary)',
                    marginBottom: 4
                  }}>{item.productName}</h4>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>{item.productSku}</span>
                  
                  {/* Quantity Control Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      border: '1px solid var(--border-color)',
                      alignItems: 'center'
                    }}>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          padding: '6px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.85rem', width: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          padding: '6px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Price Column */}
                <div style={{
                  textAlign: 'right',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <strong style={{
                    color: 'var(--accent-gold)',
                    fontSize: '1.05rem',
                    fontWeight: 500
                  }}>
                    ${(item.unitPrice * item.quantity).toLocaleString()}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ${item.unitPrice.toLocaleString()} each
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel Footer */}
        {items.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px',
            marginTop: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '20px'
            }}>
              <span style={{
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)'
              }}>Maison Subtotal</span>
              <strong className="serif-font" style={{
                fontSize: '1.8rem',
                color: 'var(--accent-gold)'
              }}>
                ${totalAmount.toLocaleString()}
              </strong>
            </div>

            <button className="btn btn-primary" onClick={handleCheckout} style={{ width: '100%', padding: '16px' }}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
