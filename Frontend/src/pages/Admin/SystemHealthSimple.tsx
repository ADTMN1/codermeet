import React from 'react';
import { Server } from 'lucide-react';

const SystemHealthSimple: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">System Health</h2>
        <p className="text-gray-400">Monitor system performance and infrastructure</p>
      </div>
      
      <div className="bg-gray-900 border-gray-800 rounded-xl p-12 text-center">
        <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-400 mb-2">System Health Monitoring</h3>
        <p className="text-gray-500">System health interface coming soon</p>
      </div>
    </div>
  );
};

export default SystemHealthSimple;
