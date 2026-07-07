import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { CartPanel } from './components/CartPanel';
import { CatalogView } from './views/CatalogView';
import { AuthView } from './views/AuthView';
import { CheckoutView } from './views/CheckoutView';
import { OrdersView } from './views/OrdersView';
import { AdminDashboardView } from './views/AdminDashboardView';

// Route guards
const CatalogRoute: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><p className="serif-font">Loading...</p></div>;
  if (isAuthenticated && user?.role === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
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

const MainLayout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="app-container">
      <Header onCartToggle={() => setIsCartOpen(!isCartOpen)} />
      
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
        <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
