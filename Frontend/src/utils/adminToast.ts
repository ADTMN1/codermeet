import { useToast } from '../context/ToastContext';

/**
 * Centralized toast notification utility for admin pages
 * Provides professional, consistent messaging across all admin operations
 */
export const useAdminToast = () => {
  const toast = useToast();

  return {
    // Success messages
    success: (action: string, entity?: string) => {
      const message = entity ? `${entity} ${action} successfully` : `${action} successful`;
      toast.success(message);
    },

    // Error messages
    error: (action: string, entity?: string, error?: any) => {
      const baseMessage = entity ? `Failed to ${action} ${entity}` : `Failed to ${action}`;
      const message = error?.response?.data?.message || error?.message || baseMessage;
      toast.error(message);
    },

    // Warning messages
    warning: (message: string) => {
      toast.warning(message);
    },

    // Info messages
    info: (message: string) => {
      toast.info(message);
    },

    // Loading messages
    loading: (action: string) => {
      toast.loading(`${action}...`);
    },

    // Specific admin operations
    userUpdated: (newRole: string) => {
      toast.success(`User role updated to ${newRole}`);
    },

    userDeleted: () => {
      toast.success('User deleted successfully');
    },

    challengeDeleted: () => {
      toast.success('Challenge deleted successfully');
    },

    dashboardRefreshed: () => {
      toast.info('Dashboard data refreshed');
    },

    systemDataLoaded: () => {
      toast.success('System data loaded successfully');
    },

    dataLoadError: (operation: string) => {
      toast.error(`Failed to load ${operation}`);
    },

    statsRefreshError: (type: string) => {
      toast.error(`Failed to refresh ${type} stats`);
    }
  };
};
