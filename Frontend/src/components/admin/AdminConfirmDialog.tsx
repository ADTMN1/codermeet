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
}

const AdminConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
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
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className={`rounded-full p-3 ${typeStyles[type]}`}>
            <AlertTriangle className={`h-6 w-6 ${iconColors[type]}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-2">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`${typeStyles[type]} text-white`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
