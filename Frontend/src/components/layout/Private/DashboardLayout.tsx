import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
  const location = useLocation();

  // Show "Back" button only if NOT on the main dashboard page
  const showBackButton = location.pathname !== '/dashboard';

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />

        {showBackButton && (
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition cursor-pointer"
          >
            Back
          </button>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;
