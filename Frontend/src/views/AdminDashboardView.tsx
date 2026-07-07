import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  AlertCircle, 
  X,
  Sparkles,
  Layers
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  brand: string;
  imageUrl: string;
  categoryId: string;
  categoryName: string;
  active: boolean;
  availableQuantity?: number;
  reservedQuantity?: number;
}

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
  createdAt: string;
  items: OrderItem[];
}

export const AdminDashboardView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('0');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Products
      const productsRes = await apiClient.get('/api/products');
      const productsList = productsRes.data.content || productsRes.data;

      // Fetch stock level for each product concurrently
      const productsWithStock = await Promise.all(productsList.map(async (p: Product) => {
        try {
          const invRes = await apiClient.get(`/api/inventory/${p.id}`);
          return { 
            ...p, 
            availableQuantity: invRes.data.availableQuantity,
            reservedQuantity: invRes.data.reservedQuantity 
          };
        } catch (err) {
          return { ...p, availableQuantity: 0, reservedQuantity: 0 };
        }
      }));
      setProducts(productsWithStock);

      // 2. Fetch Categories for creation dropdown
      const categoriesRes = await apiClient.get('/api/products/categories');
      setCategories(categoriesRes.data);

      // 3. Fetch all orders for analytics calculation
      const ordersRes = await apiClient.get('/api/orders/admin/all');
      setOrders(ordersRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch administrator data. Verify backend systems are active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setSku('');
    setPrice('');
    setBrand('');
    setImageUrl('');
    setCategoryId(categories[0]?.id || '');
    setStock('100'); // Default stock level
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setSku(product.sku);
    setPrice(product.price.toString());
    setBrand(product.brand || '');
    setImageUrl(product.imageUrl || '');
    setCategoryId(product.categoryId || categories[0]?.id || '');
    setStock(product.availableQuantity?.toString() || '0');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price || !categoryId) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const payload = {
      name,
      description,
      sku,
      price: parseFloat(price),
      brand: brand || 'LVMH Maison',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      categoryId
    };

    try {
      let productId = '';
      if (editingProduct) {
        // Edit Product
        await apiClient.put(`/api/products/${editingProduct.id}`, payload);
        productId = editingProduct.id;
      } else {
        // Create Product
        const response = await apiClient.post('/api/products', payload);
        productId = response.data.id;
      }

      // Update Stock level in inventory-service
      await apiClient.put(`/api/inventory/${productId}?quantity=${parseInt(stock || '0')}`);

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to persist product.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to soft-delete this product?')) {
      return;
    }
    try {
      await apiClient.delete(`/api/products/${productId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  // Helper date calculators
  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  };

  const getStartOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  };

  const getStartOfYear = () => {
    const d = new Date();
    return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  };

  // Compute Sales Analytics
  const paidOrders = orders.filter(o => o.status === 'PAID' || o.status === 'DELIVERED' || o.status === 'SHIPPED');

  const startOfWeek = getStartOfWeek();
  const startOfMonth = getStartOfMonth();
  const startOfYear = getStartOfYear();

  const weekOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfWeek);
  const monthOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfMonth);
  const yearOrders = paidOrders.filter(o => new Date(o.createdAt) >= startOfYear);

  const weekRevenue = weekOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const yearRevenue = yearOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Compute Charts Data: Most Sold Items
  const itemsMap: Record<string, { name: string; quantity: number }> = {};
  paidOrders.forEach(o => {
    o.items?.forEach(i => {
      if (itemsMap[i.productId]) {
        itemsMap[i.productId].quantity += i.quantity;
      } else {
        itemsMap[i.productId] = { name: i.productName, quantity: i.quantity };
      }
    });
  });

  const mostSoldItems = Object.values(itemsMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const maxSoldQty = mostSoldItems.length > 0 ? mostSoldItems[0].quantity : 1;

  // Compute Charts Data: Category Performance
  const categorySalesMap: Record<string, number> = {};
  
  // Create mapping of productId -> categoryName from fetched products
  const productCategoryMapping: Record<string, string> = {};
  products.forEach(p => {
    productCategoryMapping[p.id] = p.categoryName || 'Other';
  });

  paidOrders.forEach(o => {
    o.items?.forEach(i => {
      const category = productCategoryMapping[i.productId] || 'Other';
      categorySalesMap[category] = (categorySalesMap[category] || 0) + i.lineTotal;
    });
  });

  const categoryPerformance = Object.entries(categorySalesMap)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = categoryPerformance.reduce((sum, c) => sum + c.revenue, 0) || 1;

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Dynamic Keyframes for entrance */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtleFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-entrance {
          animation: subtleFadeIn 0.6s ease forwards;
        }
      `}} />

      {/* Header Panel */}
      <div className="animate-entrance" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '20px', 
        marginBottom: '40px' 
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-gold)', letterSpacing: '0.15em' }}>
            Owner Control Center
          </span>
          <h1 className="serif-font" style={{ fontSize: '3rem', margin: '4px 0 0 0' }}>
            Admin Dashboard
          </h1>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Add Masterpiece
        </button>
      </div>

      {error && (
        <div style={{
          padding: '20px',
          border: '1px solid #ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          color: '#ef4444',
          marginBottom: '40px',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
          <p className="serif-font" style={{ fontSize: '1.5rem' }}>Gathering Maison Analytics...</p>
        </div>
      ) : (
        <div className="animate-entrance">
          
          {/* Section 1: Sales Analytics Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px', 
            marginBottom: '48px' 
          }}>
            {/* Week Sales */}
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '3px solid var(--accent-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  Current Week
                </span>
                <Calendar size={18} color="var(--text-muted)" />
              </div>
              <h2 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--accent-gold)', margin: '0 0 8px 0' }}>
                ${weekRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>{weekOrders.length}</strong> orders settled this week
              </p>
            </div>

            {/* Month Sales */}
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '3px solid var(--accent-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  Current Month
                </span>
                <TrendingUp size={18} color="var(--text-muted)" />
              </div>
              <h2 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--accent-gold)', margin: '0 0 8px 0' }}>
                ${monthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>{monthOrders.length}</strong> orders settled this month
              </p>
            </div>

            {/* Year Sales */}
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '3px solid var(--accent-gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  Current Year
                </span>
                <DollarSign size={18} color="var(--text-muted)" />
              </div>
              <h2 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--accent-gold)', margin: '0 0 8px 0' }}>
                ${yearRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>{yearOrders.length}</strong> orders settled this year
              </p>
            </div>
          </div>

          {/* Section 2: Visual Charts / Flowcharts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '56px' }}>
            
            {/* Visual Chart: Most Sold Items */}
            <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <ShoppingBag size={18} color="var(--accent-gold)" />
                <h3 className="serif-font" style={{ fontSize: '1.3rem', margin: 0 }}>Most Sold Items (Virtual Units)</h3>
              </div>
              
              {mostSoldItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No virtual order items settled yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {mostSoldItems.map((item, idx) => {
                    const widthPercent = (item.quantity / maxSoldQty) * 100;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                          <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{item.quantity} Units</span>
                        </div>
                        {/* CSS Progress Bar */}
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1px' }}>
                          <div style={{ 
                            width: `${widthPercent}%`, 
                            height: '100%', 
                            backgroundColor: 'var(--accent-gold)', 
                            transition: 'width 1s ease-in-out'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visual Chart: Top-performing Categories */}
            <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <Layers size={18} color="var(--accent-gold)" />
                <h3 className="serif-font" style={{ fontSize: '1.3rem', margin: 0 }}>Top-performing Categories (Revenue)</h3>
              </div>
              
              {categoryPerformance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No category statistics available.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {categoryPerformance.map((cat, idx) => {
                    const sharePercent = (cat.revenue / totalRevenue) * 100;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.category}</span>
                          <span style={{ color: 'var(--accent-gold)' }}>
                            ${cat.revenue.toLocaleString()} ({sharePercent.toFixed(1)}%)
                          </span>
                        </div>
                        {/* Category Progress Bar */}
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1px' }}>
                          <div style={{ 
                            width: `${sharePercent}%`, 
                            height: '100%', 
                            backgroundImage: 'linear-gradient(90deg, #b8860b, var(--accent-gold))', 
                            transition: 'width 1s ease-in-out'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Section 3: Product Management Table */}
          <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--border-color)' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'baseline', 
              borderBottom: '1px solid var(--border-color)', 
              paddingBottom: '16px', 
              marginBottom: '24px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="var(--accent-gold)" />
                <h3 className="serif-font" style={{ fontSize: '1.6rem', margin: 0 }}>Collection Masterpieces</h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Total Catalog size: {products.length} Items
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '1px solid var(--border-color)', 
                    color: 'var(--text-muted)', 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em' 
                  }}>
                    <th style={{ padding: '12px 16px' }}>Masterpiece</th>
                    <th style={{ padding: '12px 16px' }}>Brand / SKU</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Stock (Avail/Res)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.02)', 
                      opacity: p.active ? 1 : 0.4 
                    }}>
                      <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          style={{ 
                            width: '45px', 
                            height: '45px', 
                            objectFit: 'cover', 
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#fff'
                          }} 
                        />
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{p.name}</strong>
                          <span style={{ 
                            display: 'block', 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)', 
                            maxWidth: '300px', 
                            textOverflow: 'ellipsis', 
                            overflow: 'hidden', 
                            whiteSpace: 'nowrap' 
                          }}>
                            {p.description}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontWeight: 600 }}>{p.brand}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          padding: '3px 8px', 
                          borderRadius: '2px', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em' 
                        }}>{p.categoryName || 'Other'}</span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: 'var(--accent-gold)', fontWeight: 700 }}>
                        ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>
                        <span style={{ color: (p.availableQuantity || 0) > 0 ? 'var(--text-primary)' : '#ef4444' }}>
                          {p.availableQuantity ?? 0}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          / {p.reservedQuantity ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span className={`badge ${p.active ? 'badge-success' : 'badge-failed'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button 
                            onClick={() => openEditModal(p)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          {p.active && (
                            <button 
                              onClick={() => handleDelete(p.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              title="Archive/Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Slide-over Modal for Add/Edit Product */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-entrance" style={{
            width: '100%',
            maxWidth: '600px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            padding: '40px'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 className="serif-font" style={{ fontSize: '2rem', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              {editingProduct ? 'Edit Masterpiece' : 'Publish New Masterpiece'}
            </h3>

            {formError && (
              <div style={{
                padding: '12px 16px',
                border: '1px solid #ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                color: '#ef4444',
                marginBottom: '20px',
                fontSize: '0.85rem'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="form-control"
                  placeholder="e.g. Tambour Horizon Light Up Watch"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Brand / Maison Name</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  className="form-control"
                  placeholder="e.g. Louis Vuitton (Defaults to LVMH Maison)"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">SKU Code *</label>
                  <input 
                    type="text" 
                    value={sku} 
                    onChange={(e) => setSku(e.target.value)} 
                    required 
                    disabled={!!editingProduct} // SKU shouldn't change
                    className="form-control"
                    placeholder="LV-TM-872"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (USD) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required 
                    className="form-control"
                    placeholder="3400.00"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Collection Category *</label>
                  <select 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)}
                    required 
                    className="form-control"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Available Stock *</label>
                  <input 
                    type="number" 
                    value={stock} 
                    onChange={(e) => setStock(e.target.value)} 
                    required 
                    className="form-control"
                    placeholder="100"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  className="form-control"
                  placeholder="Paste premium image URL link..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="form-control"
                  rows={4}
                  placeholder="Detailed description of the materials, craftsmanship, and heritage..."
                  style={{ resize: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
                disabled={formLoading}
              >
                {formLoading ? 'Saving changes...' : (editingProduct ? 'Update Product' : 'Publish & Broadcast arrival')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
