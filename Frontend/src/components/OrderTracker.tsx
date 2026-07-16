import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface OrderTrackerProps {
  status: string;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ status }) => {
  // Map Saga status to step indexes
  // 0 = Placed, 1 = Stock Reservation, 2 = Payment Processing, 3 = Completed
  let currentStep = 0;
  let isFailed = false;
  let isCancelled = false;

  switch (status) {
    case 'PENDING':
      currentStep = 1; // Order placed, stock reservation / payment in progress
      break;
    case 'PAID':
      currentStep = 3; // Fully completed
      break;
    case 'FAILED':
      isFailed = true;
      currentStep = 2; // Failed at payment or stock check
      break;
    case 'CANCELLED':
      isCancelled = true;
      currentStep = 3; // Compensated / reversed
      break;
  }

  const steps = [
    { label: 'Order Placed', desc: 'Saga Start' },
    { label: 'Stock Reserved', desc: 'SKU Reservation' },
    { label: 'Payment Intent', desc: 'Virtual Settlement' },
    { label: status === 'CANCELLED' ? 'Reverted' : 'Order Finished', desc: status === 'CANCELLED' ? 'Stock Released' : 'Completed' }
  ];

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      marginTop: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        {status === 'PAID' ? (
          <CheckCircle2 color="#10b981" size={22} />
        ) : status === 'FAILED' ? (
          <XCircle color="#ef4444" size={22} />
        ) : status === 'CANCELLED' ? (
          <AlertTriangle color="#ef4444" size={22} />
        ) : (
          <Clock className="spin-icon" color="var(--accent-gold)" size={22} />
        )}
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin-icon {
            animation: spin 3s linear infinite;
          }
        `}} />

        <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Saga Status: <strong style={{ 
            color: status === 'PAID' ? '#10b981' : (status === 'FAILED' || status === 'CANCELLED' ? '#ef4444' : 'var(--accent-gold)')
          }}>{status}</strong>
        </span>
      </div>

      <div className="order-tracker">
        {steps.map((step, idx) => {
          let stepClass = '';
          let nodeContent = (idx + 1).toString();

          if (isFailed && idx === currentStep) {
            stepClass = 'failed';
            nodeContent = '✗';
          } else if (isCancelled && idx === currentStep) {
            stepClass = 'failed'; // Render cancellation node as warning red
            nodeContent = '!';
          } else if (idx < currentStep) {
            stepClass = 'completed';
            nodeContent = '✓';
          } else if (idx === currentStep) {
            stepClass = 'active';
          }

          return (
            <div key={idx} className={`order-step ${stepClass}`}>
              <div className="step-node">{nodeContent}</div>
              <div className="step-label">{step.label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>{step.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
