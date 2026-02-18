import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { authService } from '../../../services/auth';
import { useNotifications } from '../../../hooks/useNotifications';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Initialize notifications for real-time updates
  useNotifications();

  // Check authentication on mount and route change
  useEffect(() => {
    const checkAuth = () => {
      // Check if this is a payment success redirect
      const paymentSuccess = searchParams.get('payment');
      const txRef = searchParams.get('tx_ref');
      
      if (paymentSuccess === 'success' && txRef) {
        // Allow access to dashboard after payment success
        // The PaymentSuccess page will handle authentication
        return true;
      }
      
      if (!authService.isAuthenticated()) {
        // Redirect to login if not authenticated and no payment success
        navigate('/login', { 
          state: { from: location.pathname },
          replace: true 
        });
        return false;
      }
      return true;
    };

    checkAuth();
  }, [location.pathname, navigate, searchParams]);

  // Show "Back" button only if NOT on the main dashboard page
  const showBackButton = location.pathname !== '/dashboard';

  // Don't render if not authenticated (the useEffect will handle redirect)
  const paymentSuccess = searchParams.get('payment');
  const txRef = searchParams.get('tx_ref');
  
  if (!authService.isAuthenticated() && !(paymentSuccess === 'success' && txRef)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />

        
      </main>
    </div>
  );
};

export default DashboardLayout;
