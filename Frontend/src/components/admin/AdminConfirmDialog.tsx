import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isConfirming?: boolean;
}

const AdminConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isConfirming = false
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-red-100 border-red-200',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100 border-yellow-200',
    info: 'bg-blue-600 hover:bg-blue-700 text-blue-100 border-blue-200'
  };

  const iconColors = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className={`rounded-full p-3 ${typeStyles[type]}`}>
            <AlertTriangle className={`h-6 w-6 ${iconColors[type]}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-300 mt-2">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`${typeStyles[type]} text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
