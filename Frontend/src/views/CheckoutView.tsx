import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ClipboardList } from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  // Address State
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    setError(null);
    setLoading(true);

    try {
      // 1. Send Order Request to API Gateway
      const orderResponse = await apiClient.post('/api/orders', {
        shippingStreet: street,
        shippingCity: city,
        shippingCountry: country,
        shippingPostalCode: postalCode,
        notes: notes
      });

      const orderData = orderResponse.data;

      // 2. Clear Cart local Context
      await clearCart();

      // 3. Immediately trigger simulated payment completion in the background
      await apiClient.post('/api/payments/initiate', {
        orderId: orderData.id,
        amount: orderData.totalAmount,
        currency: 'usd'
      });

      // 4. Redirect to Orders view to watch the Saga trigger real-time progress
      navigate('/orders');

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
        <h2 className="serif-font" style={{ fontSize: '2rem', marginBottom: '16px' }}>Your Cart is Empty</h2>
        <p style={{ marginBottom: '24px' }}>Please add products to your cart before proceeding to checkout.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Catalog</button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 className="serif-font" style={{ fontSize: '3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '40px' }}>
        Checkout Registry
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
        {/* Checkout Forms Column */}
        <div style={{ flex: '1 1 500px' }}>
          <form onSubmit={handleCheckoutSubmit}>
            
            {/* Section 1: Shipping */}
            <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <Truck size={18} color="var(--accent-gold)" />
                <h3 className="serif-font" style={{ fontSize: '1.4rem' }}>Shipping Address</h3>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input 
                  type="text" 
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required 
                  className="form-control"
                  placeholder="e.g. 123 Champs-Elysees"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">City</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required 
                    className="form-control"
                    placeholder="e.g. Paris"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Postal Code</label>
                  <input 
                    type="text" 
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required 
                    className="form-control"
                    placeholder="e.g. 75008"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
                <input 
                  type="text" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required 
                  className="form-control"
                  placeholder="e.g. France"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Delivery Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-control"
                  rows={3}
                  placeholder="Notes for courier..."
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

            {/* Section 2: Payment Selector (POD Only) */}
            <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <CreditCard size={18} color="var(--accent-gold)" />
                <h3 className="serif-font" style={{ fontSize: '1.4rem' }}>Settlement Registry</h3>
              </div>

              <div style={{ 
                border: '2px solid var(--accent-gold)', 
                padding: '20px', 
                backgroundColor: 'rgba(212, 175, 55, 0.03)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                borderRadius: '2px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Pay on Delivery (Virtual)</span>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--accent-gold)'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1c1c1e' }} />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  This application runs virtual transactions only. No physical payment cards are accepted. Choosing Pay on Delivery automatically triggers a simulated payment completion to finalize the transaction.
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                border: '1px solid #ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                color: '#ef4444',
                marginBottom: '24px',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px' }} disabled={loading}>
              {loading ? 'Processing Virtual Settlement...' : 'Place Order & Auto-Settle'}
            </button>
          </form>
        </div>

        {/* Cart Summary Column */}
        <div style={{ flex: '1 1 350px', maxWidth: '450px' }}>
          <div className="glass-panel" style={{ padding: '32px', position: 'sticky', top: '100px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <ClipboardList size={18} color="var(--accent-gold)" />
              <h3 className="serif-font" style={{ fontSize: '1.4rem' }}>Bag Summary</h3>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '300px', marginBottom: '24px' }}>
              {items.map(item => (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h5 className="serif-font" style={{ fontSize: '1.05rem', margin: '0 0 4px 0' }}>{item.productName}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</span>
                  </div>
                  <strong style={{ color: 'var(--accent-gold)' }}>
                    ${(item.unitPrice * item.quantity).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Grand Total</span>
              <strong className="serif-font" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)' }}>
                ${totalAmount.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
