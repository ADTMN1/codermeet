import { useToast } from '../context/ToastContext';
import type { ToastType } from '../components/ui/toast';

// Enhanced toast hook with additional utilities
export const useAppToast = () => {
  const toast = useToast();

  // Common toast messages for different scenarios
  const commonMessages = {
    // Auth related
    loginSuccess: 'Successfully logged in!',
    loginError: 'Login failed. Please check your credentials.',
    logoutSuccess: 'Successfully logged out.',
    registerSuccess: 'Account created successfully!',
    registerError: 'Registration failed. Please try again.',
    
    // Data operations
    saveSuccess: 'Changes saved successfully!',
    saveError: 'Failed to save changes.',
    deleteSuccess: 'Item deleted successfully.',
    deleteError: 'Failed to delete item.',
    updateSuccess: 'Item updated successfully!',
    updateError: 'Failed to update item.',
    
    // Network/API
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    notFound: 'Resource not found.',
    unauthorized: 'You are not authorized to perform this action.',
    
    // Form validation
    requiredField: 'Please fill in all required fields.',
    invalidEmail: 'Please enter a valid email address.',
    passwordMismatch: 'Passwords do not match.',
    
    // File operations
    uploadSuccess: 'File uploaded successfully!',
    uploadError: 'Failed to upload file.',
    fileTooLarge: 'File size exceeds the maximum limit.',
    invalidFileType: 'Invalid file type.',
    
    // Generic
    loading: 'Loading...',
    processing: 'Processing...',
    success: 'Operation completed successfully!',
    error: 'An error occurred. Please try again.',
    warning: 'Please review this action.',
    info: 'Information'
  };

  // Enhanced toast functions with predefined messages
  const enhancedToast = {
    ...toast,
    
    // Auth toasts
    loginSuccess: (description?: string) => toast.success(commonMessages.loginSuccess, description),
    loginError: (description?: string) => toast.error(commonMessages.loginError, description),
    logoutSuccess: (description?: string) => toast.success(commonMessages.logoutSuccess, description),
    registerSuccess: (description?: string) => toast.success(commonMessages.registerSuccess, description),
    registerError: (description?: string) => toast.error(commonMessages.registerError, description),
    
    // Data operation toasts
    saveSuccess: (description?: string) => toast.success(commonMessages.saveSuccess, description),
    saveError: (description?: string) => toast.error(commonMessages.saveError, description),
    deleteSuccess: (description?: string) => toast.success(commonMessages.deleteSuccess, description),
    deleteError: (description?: string) => toast.error(commonMessages.deleteError, description),
    updateSuccess: (description?: string) => toast.success(commonMessages.updateSuccess, description),
    updateError: (description?: string) => toast.error(commonMessages.updateError, description),
    
    // Network/API toasts
    networkError: (description?: string) => toast.error(commonMessages.networkError, description),
    serverError: (description?: string) => toast.error(commonMessages.serverError, description),
    notFound: (description?: string) => toast.error(commonMessages.notFound, description),
    unauthorized: (description?: string) => toast.error(commonMessages.unauthorized, description),
    
    // Form validation toasts
    requiredField: (description?: string) => toast.warning(commonMessages.requiredField, description),
    invalidEmail: (description?: string) => toast.error(commonMessages.invalidEmail, description),
    passwordMismatch: (description?: string) => toast.error(commonMessages.passwordMismatch, description),
    
    // File operation toasts
    uploadSuccess: (description?: string) => toast.success(commonMessages.uploadSuccess, description),
    uploadError: (description?: string) => toast.error(commonMessages.uploadError, description),
    fileTooLarge: (description?: string) => toast.error(commonMessages.fileTooLarge, description),
    invalidFileType: (description?: string) => toast.error(commonMessages.invalidFileType, description),
    
    // Generic toasts
    loading: (description?: string) => toast.loading(commonMessages.loading, description),
    processing: (description?: string) => toast.loading(commonMessages.processing, description),
    genericSuccess: (description?: string) => toast.success(commonMessages.success, description),
    genericError: (description?: string) => toast.error(commonMessages.error, description),
    genericWarning: (description?: string) => toast.warning(commonMessages.warning, description),
    genericInfo: (description?: string) => toast.info(commonMessages.info, description)
  };

  // Utility function for API calls with automatic toast handling
  const withToast = async <T>(
    promise: Promise<T>,
    options: {
      loading?: string;
      success?: string;
      error?: string;
      showSuccessToast?: boolean;
      showErrorToast?: boolean;
    } = {}
  ): Promise<T | null> => {
    const {
      loading = commonMessages.processing,
      success = commonMessages.success,
      error = commonMessages.error,
      showSuccessToast = true,
      showErrorToast = true
    } = options;

    const toastId = toast.loading(loading);

    try {
      const result = await promise;
      toast.dismiss(toastId);
      if (showSuccessToast) {
        toast.success(success);
      }
      return result;
    } catch (err: any) {
      toast.dismiss(toastId);
      if (showErrorToast) {
        toast.error(error, err.message || 'Unknown error occurred');
      }
      return null;
    }
  };

  // Utility function for form validation with toast messages
  const validateWithToast = (
    validation: () => { isValid: boolean; message?: string; field?: string }
  ): boolean => {
    const result = validation();
    if (!result.isValid) {
      toast.error(result.message || commonMessages.requiredField, result.field);
      return false;
    }
    return true;
  };

  return {
    ...enhancedToast,
    commonMessages,
    withToast,
    validateWithToast
  };
};

export default useAppToast;
