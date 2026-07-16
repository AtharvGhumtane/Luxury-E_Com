import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { OrderTracker } from '../components/OrderTracker';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, RefreshCw, XCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  shippingStreet: string;
  shippingCity: string;
  shippingCountry: string;
  shippingPostalCode: string;
  notes: string;
  createdAt: string;
  items: OrderItem[];
}

export const OrdersView: React.FC = () => {
  const { fetchCart } = useCart();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const response = await apiClient.get('/api/orders');
      // Handle spring pagination wrapper
      setOrders(response.data.content || response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your orders. Please sign in again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Intelligent Polling: Poll order state every 5 seconds if any order is currently in PENDING state
  // This allows the user to see the Kafka Saga transitions (PENDING -> PAID / FAILED) in real time
  useEffect(() => {
    const hasPendingOrder = orders.some(o => o.status === 'PENDING');
    if (!hasPendingOrder) return;

    const interval = setInterval(() => {
      fetchOrders(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [orders]);

  const handleCancelOrder = async (orderId: string) => {
    // Use toast-based confirm instead of window.confirm
    if (!window.confirm('Are you sure you want to cancel this order? This will release all reserved stock.')) {
      return;
    }
    try {
      await apiClient.put(`/api/orders/${orderId}/cancel`);
      showToast('Order cancelled. Stock has been released.', 'info');
      await fetchOrders(true);
      await fetchCart();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel order.';
      showToast(msg, 'error');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PAID': return 'badge-success';
      case 'FAILED':
      case 'CANCELLED': return 'badge-failed';
      default: return 'badge-pending';
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '20px',
        marginBottom: '40px'
      }}>
        <h1 className="serif-font" style={{ fontSize: '3rem', margin: 0 }}>
          My Order Registry
        </h1>
        <button 
          onClick={() => fetchOrders(true)} 
          className="btn btn-secondary" 
          style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          disabled={refreshing}
        >
          <RefreshCw size={12} className={refreshing ? 'spin-icon' : ''} />
          {refreshing ? 'Syncing...' : 'Sync Registry'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '24px',
          border: '1px solid #ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          color: '#ef4444',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p className="serif-font" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading registry...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 0',
          color: 'var(--text-secondary)',
          border: '1px dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}>
          <p className="serif-font" style={{ fontSize: '1.4rem' }}>No orders found in your history</p>
          <p style={{ fontSize: '0.9rem', maxWidth: '400px' }}>Explore the catalog to purchase LVMH watches, jewelry, or leather goods.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {orders.map(order => (
            <div 
              key={order.id} 
              className="glass-panel" 
              style={{
                padding: '32px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Order Header Row */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '20px',
                marginBottom: '24px',
                gap: '16px'
              }}>
                <div>
                  <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)'
                  }}>Order Identifier</span>
                  <h3 className="serif-font" style={{ fontSize: '1.5rem', margin: '4px 0 0 0' }}>
                    #{order.id.substring(0, 8).toUpperCase()}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={14} color="var(--text-muted)" />
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  {/* Status Badge */}
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Info Body */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', marginBottom: '32px' }}>
                {/* Shipping & Items details */}
                <div style={{ flex: '2 1 400px' }}>
                  {/* Shipping Details */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderLeft: '2px solid var(--accent-gold)'
                  }}>
                    <MapPin size={16} style={{ marginTop: '2px' }} />
                    <div>
                      <strong>Delivering to:</strong> {order.shippingStreet}, {order.shippingCity}, {order.shippingCountry} ({order.shippingPostalCode})
                      {order.notes && <p style={{ fontStyle: 'italic', marginTop: '4px', fontSize: '0.8rem' }}>Note: {order.notes}</p>}
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <h4 className="serif-font" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Items Details</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <th style={{ padding: '8px 0' }}>Product</th>
                          <th style={{ padding: '8px 0', textAlign: 'center' }}>Quantity</th>
                          <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px 0' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{item.productName}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>${item.unitPrice.toLocaleString()} each</span>
                            </td>
                            <td style={{ padding: '12px 0', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--accent-gold)' }}>
                              ${item.lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pricing / Actions Card */}
                <div style={{
                  flex: '1 1 200px',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  padding: '24px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Total Settled</span>
                    <h4 className="serif-font" style={{ fontSize: '2rem', color: 'var(--accent-gold)', margin: '8px 0 0 0' }}>
                      ${order.totalAmount.toLocaleString()}
                    </h4>
                  </div>

                  {/* Actions (Cancel Order) */}
                  {(order.status === 'PENDING' || order.status === 'PAID') && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      className="btn btn-secondary"
                      style={{
                        padding: '10px 16px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderColor: '#ef4444',
                        color: '#ef4444',
                        width: '100%',
                        marginTop: '24px'
                      }}
                    >
                      <XCircle size={14} /> Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Step Tracker (Saga Visualization) */}
              <OrderTracker status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
