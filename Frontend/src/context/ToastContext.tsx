import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toastColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', icon: '✓' },
    error:   { bg: 'rgba(239,68,68,0.1)',  border: '#ef4444', icon: '✕' },
    info:    { bg: 'rgba(99,102,241,0.1)', border: '#6366f1', icon: 'ℹ' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', icon: '⚠' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container — fixed bottom-right */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes toastIn {
            from { opacity: 0; transform: translateX(40px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes toastOut {
            from { opacity: 1; transform: translateX(0); }
            to   { opacity: 0; transform: translateX(40px); }
          }
          .toast-item {
            animation: toastIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
          }
        `}} />
        {toasts.map(toast => {
          const style = toastColors[toast.type];
          return (
            <div
              key={toast.id}
              className="toast-item glass-panel"
              style={{
                pointerEvents: 'auto',
                minWidth: '300px',
                maxWidth: '420px',
                padding: '14px 18px',
                borderLeft: `3px solid ${style.border}`,
                backgroundColor: style.bg,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                cursor: 'pointer',
              }}
              onClick={() => removeToast(toast.id)}
            >
              <span style={{
                color: style.border,
                fontWeight: 700,
                fontSize: '1rem',
                flexShrink: 0,
                lineHeight: 1.4
              }}>
                {style.icon}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
