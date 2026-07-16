import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingBag, User, LogOut, Sun, Moon, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onCartToggle: () => void;
  onWishlistToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCartToggle, onWishlistToggle }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  // Feature 4: Theme Persistence — initialize from localStorage
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('lvmh_theme') !== 'light';
  });

  // Apply persisted theme on mount
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('lvmh_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
    }
  };

  const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  };

  return (
    <header className="glass-panel" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '70px',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      borderBottom: '1px solid var(--border-color)',
    }}>
      {/* Brand Logo */}
      <Link to={user?.role === 'ROLE_ADMIN' ? '/admin' : '/'} style={{ display: 'flex', alignItems: 'center' }}>
        <h2 className="serif-font" style={{
          fontSize: '1.6rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          margin: 0,
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}>
          LVMH <span style={{ fontSize: '0.9rem', verticalAlign: 'middle', color: 'var(--accent-gold)' }}>Maison</span>
        </h2>
      </Link>

      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {user?.role === 'ROLE_ADMIN' ? (
          <Link to="/admin" style={{
            fontSize: '0.85rem', textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-secondary)',
          }}>Admin Dashboard</Link>
        ) : (
          <>
            <Link to="/" style={{
              fontSize: '0.85rem', textTransform: 'uppercase',
              letterSpacing: '0.05em', color: 'var(--text-secondary)',
            }}>Maison Catalog</Link>
            {isAuthenticated && (
              <Link to="/orders" style={{
                fontSize: '0.85rem', textTransform: 'uppercase',
                letterSpacing: '0.05em', color: 'var(--text-secondary)',
              }}>My Orders</Link>
            )}
          </>
        )}
      </nav>

      {/* Action Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={iconBtnStyle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Info / Auth trigger */}
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Hello, <strong style={{ color: 'var(--accent-gold)' }}>{user.firstName}</strong>
            </span>
            <button onClick={() => { logout(); navigate('/auth'); }} style={iconBtnStyle} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link to="/auth" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.85rem', textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--text-secondary)',
          }}>
            <User size={16} />
            Maison Sign In
          </Link>
        )}

        {/* Wishlist Icon (non-admin only) */}
        {user?.role !== 'ROLE_ADMIN' && (
          <button onClick={onWishlistToggle} style={iconBtnStyle} title="My Wishlist">
            <Heart
              size={20}
              fill={wishlistCount > 0 ? 'var(--accent-gold)' : 'none'}
              color={wishlistCount > 0 ? 'var(--accent-gold)' : 'var(--text-primary)'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {wishlistCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                backgroundColor: 'var(--accent-gold)',
                color: '#1c1c1e',
                fontSize: '0.65rem', fontWeight: 700,
                borderRadius: '50%', width: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
              }}>
                {wishlistCount}
              </span>
            )}
          </button>
        )}

        {/* Cart Icon (non-admin only) */}
        {user?.role !== 'ROLE_ADMIN' && (
          <button onClick={onCartToggle} style={iconBtnStyle} title="Shopping Cart">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                backgroundColor: 'var(--accent-gold)',
                color: '#1c1c1e',
                fontSize: '0.65rem', fontWeight: 700,
                borderRadius: '50%', width: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
              }}>
                {itemCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
