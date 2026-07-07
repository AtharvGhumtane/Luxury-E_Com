import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(firstName, lastName, email, password);
      }
      // Redirect back to home/catalog on successful authentication
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 0',
      minHeight: '60vh'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '450px',
          padding: '40px',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center'
        }}
      >
        {/* Toggle Title */}
        <h2 className="serif-font" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          {isLogin ? 'Sign In' : 'Join Maison'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'Access your private order registry' : 'Register to curate your custom bag collections'}
        </p>

        {/* Error Dialog */}
        {error && (
          <div style={{
            padding: '12px 16px',
            border: '1px solid #ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            color: '#ef4444',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required 
                  className="form-control" 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required 
                  className="form-control" 
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="form-control" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="form-control" 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', marginTop: '16px', gap: '8px' }}
            disabled={loading}
          >
            {loading ? (
              'Processing...'
            ) : isLogin ? (
              <>
                <LogIn size={16} /> Enter Maison
              </>
            ) : (
              <>
                <UserPlus size={16} /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Screen Toggle Switch */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          marginTop: '32px',
          fontSize: '0.85rem'
        }}>
          {isLogin ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              New to LVMH?{' '}
              <button 
                onClick={() => { setIsLogin(false); setError(null); }} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  padding: 0
                }}
              >
                Create an account
              </button>
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <button 
                onClick={() => { setIsLogin(true); setError(null); }} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  padding: 0
                }}
              >
                Sign in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
