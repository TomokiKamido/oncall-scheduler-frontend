import React from 'react';
import Toast from './Toast';
import { useToast } from '../../hooks/useToast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="toast-wrapper"
          style={{
            top: `${20 + index * 70}px`
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration || 4000}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
