import React, { createContext, useContext, useCallback } from 'react';
import { toast, ToastType } from '../components/ui/toast';

// Toast context interface
interface ToastContextType {
  showToast: (type: ToastType, message: string, description?: string, options?: any) => void;
  success: (message: string, description?: string, options?: any) => void;
  error: (message: string, description?: string, options?: any) => void;
  warning: (message: string, description?: string, options?: any) => void;
  info: (message: string, description?: string, options?: any) => void;
  loading: (message: string, description?: string, options?: any) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: any
  ) => Promise<T>;
  dismiss: (id?: string | number) => void;
  custom: (message: React.ReactNode, options?: any) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = useCallback((
    type: ToastType,
    message: string,
    description?: string,
    options?: any
  ) => {
    toast[type](message, description, options);
  }, []);

  const success = useCallback((message: string, description?: string, options?: any) => {
    toast.success(message, description, options);
  }, []);

  const error = useCallback((message: string, description?: string, options?: any) => {
    toast.error(message, description, options);
  }, []);

  const warning = useCallback((message: string, description?: string, options?: any) => {
    toast.warning(message, description, options);
  }, []);

  const info = useCallback((message: string, description?: string, options?: any) => {
    toast.info(message, description, options);
  }, []);

  const loading = useCallback((message: string, description?: string, options?: any) => {
    toast.loading(message, description, options);
  }, []);

  const promise = useCallback(<T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: any
  ) => {
    return toast.promise(promise, messages, options);
  }, []);

  const dismiss = useCallback((id?: string | number) => {
    toast.dismiss(id);
  }, []);

  const custom = useCallback((message: React.ReactNode, options?: any) => {
    toast.custom(message, options);
  }, []);

  const value: ToastContextType = {
    showToast,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    custom
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// Hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
