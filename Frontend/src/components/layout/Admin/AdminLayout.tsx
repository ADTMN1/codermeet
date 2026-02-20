import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, RefreshCw } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import NotificationSidebar from '../../NotificationSidebar';

const AdminLayout: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // React Query handles data refresh automatically
    // No need for global events anymore
  };

  const handleBellClick = () => {
    setShowNotifications(true);
  };

  const handleUnreadCountUpdate = (count: number) => {
    console.log('🔔 AdminLayout received unread count update:', count);
    setUnreadCount(count);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          {/* Simple Professional Header */}
          <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div>
                  <button
                    onClick={handleBellClick}
                    className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-red-400" />
                    {(() => {
                      console.log('🔔 Bell rendering - unreadCount:', unreadCount);
                      return unreadCount > 0;
                    })() && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-white">{lastRefresh.toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Real Notification Sidebar */}
      <NotificationSidebar 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
        onUnreadCountChange={handleUnreadCountUpdate}
      />
    </div>
  );
};

export default AdminLayout;
