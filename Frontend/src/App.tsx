import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import { Header } from './components/Header';
import { CartPanel } from './components/CartPanel';
import { WishlistPanel } from './components/WishlistPanel';
import { CatalogView } from './views/CatalogView';
import { AuthView } from './views/AuthView';
import { CheckoutView } from './views/CheckoutView';
import { OrdersView } from './views/OrdersView';
import { AdminDashboardView } from './views/AdminDashboardView';

// ─── Route Guards ─────────────────────────────────────────────────────────────

const CatalogRoute: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><p className="serif-font">Loading...</p></div>;
  if (isAuthenticated && user?.role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
  return <CatalogView />;
};

const CheckoutRoute: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><p className="serif-font">Loading...</p></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
  return <CheckoutView />;
};

const OrdersRoute: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><p className="serif-font">Loading...</p></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
  return <OrdersView />;
};

const AdminRoute: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><p className="serif-font">Loading...</p></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== 'ROLE_ADMIN') return <Navigate to="/" replace />;
  return <AdminDashboardView />;
};

// ─── Main Layout ──────────────────────────────────────────────────────────────

const MainLayout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { _pendingMoveToCart, _clearPendingMoveToCart, moveToCart } = useWishlist();

  // Handle "Move to Cart" triggered from WishlistPanel
  useEffect(() => {
    if (!_pendingMoveToCart) return;
    addToCart(
      {
        productId: _pendingMoveToCart.id,
        productName: _pendingMoveToCart.name,
        productSku: _pendingMoveToCart.sku,
        unitPrice: _pendingMoveToCart.price,
      },
      1
    )
      .then(() => {
        showToast(`"${_pendingMoveToCart.name}" moved to cart!`, 'success');
        setIsWishlistOpen(false);
        setIsCartOpen(true);
      })
      .catch((err: Error) => {
        showToast(err.message || 'Failed to move item to cart.', 'error');
      })
      .finally(() => {
        _clearPendingMoveToCart();
      });
  }, [_pendingMoveToCart]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-container">
      <Header
        onCartToggle={() => setIsCartOpen(prev => !prev)}
        onWishlistToggle={() => setIsWishlistOpen(prev => !prev)}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<CatalogRoute />} />
          <Route path="/auth" element={<AuthView />} />
          <Route path="/checkout" element={<CheckoutRoute />} />
          <Route path="/orders" element={<OrdersRoute />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to={user?.role === 'ROLE_ADMIN' ? '/admin' : '/'} replace />} />
        </Routes>
      </main>

      {user?.role !== 'ROLE_ADMIN' && (
        <>
          <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          <WishlistPanel
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            onMoveToCart={moveToCart}
          />
        </>
      )}
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <Router>
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <MainLayout />
            </RecentlyViewedProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  </Router>
);

export default App;
