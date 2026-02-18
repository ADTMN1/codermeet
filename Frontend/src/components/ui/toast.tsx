import React from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, X, Loader2 } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Custom toast configuration
const toastConfig = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-green-400" />,
    className: 'border-green-500/20 bg-green-500/10 text-green-100',
    progressBarClass: 'bg-green-400'
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    className: 'border-red-500/20 bg-red-500/10 text-red-100',
    progressBarClass: 'bg-red-400'
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    className: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-100',
    progressBarClass: 'bg-yellow-400'
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-400" />,
    className: 'border-blue-500/20 bg-blue-500/10 text-blue-100',
    progressBarClass: 'bg-blue-400'
  },
  loading: {
    icon: <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />,
    className: 'border-purple-500/20 bg-purple-500/10 text-purple-100',
    progressBarClass: 'bg-purple-400'
  }
};

// Custom toast component
const CustomToast = ({ message, type, description, onDismiss }: {
  message: string;
  type: ToastType;
  description?: string;
  onDismiss?: () => void;
}) => {
  const config = toastConfig[type];

  return (
    <div className={`
      relative flex items-start gap-3 p-4 rounded-lg border shadow-lg
      backdrop-blur-sm transition-all duration-300 ease-in-out
      animate-in slide-in-from-right-full
      ${config.className}
    `}>
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight">
          {message}
        </p>
        {description && (
          <p className="text-xs mt-1 opacity-80 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4 opacity-60 hover:opacity-100" />
        </button>
      )}
    </div>
  );
};

// Toast API
export const toast = {
  success: (message: string, description?: string, options?: any) => {
    return sonnerToast.success(
      <CustomToast message={message} type="success" description={description} />,
      options
    );
  },
  error: (message: string, description?: string, options?: any) => {
    return sonnerToast.error(
      <CustomToast message={message} type="error" description={description} />,
      options
    );
  },
  warning: (message: string, description?: string, options?: any) => {
    return sonnerToast.warning(
      <CustomToast message={message} type="warning" description={description} />,
      options
    );
  },
  info: (message: string, description?: string, options?: any) => {
    return sonnerToast.info(
      <CustomToast message={message} type="info" description={description} />,
      options
    );
  },
  loading: (message: string, description?: string, options?: any) => {
    return sonnerToast.loading(
      <CustomToast message={message} type="loading" description={description} />,
      options
    );
  },
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom
};

// Main Toaster component
export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton={false}
      toastOptions={{
        style: {
          background: 'transparent',
          border: 'none',
          padding: '0',
          margin: '0',
          boxShadow: 'none',
        },
        className: 'p-0',
      }}
      theme="dark"
      gap={8}
      visibleToasts={5}
      duration={4000}
    />
  );
};

export default Toaster;
