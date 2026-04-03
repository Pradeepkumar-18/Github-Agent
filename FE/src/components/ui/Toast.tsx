import React from 'react';
import { useToast } from '../../context/ToastContext';
import type { ToastType } from '../../context/ToastContext';
import './Toast.css';

const Toast: React.FC<{
  id: string;
  message: string;
  type: ToastType;
}> = ({ id, message, type }) => {
  const { removeToast } = useToast();

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  return (
    <div className={`toast-item toast-${type} animate-in`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => removeToast(id)}>
        &times;
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};
