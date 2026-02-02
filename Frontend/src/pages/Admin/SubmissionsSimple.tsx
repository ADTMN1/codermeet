import React from 'react';
import { FileText } from 'lucide-react';

const SubmissionsSimple: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Code Review</h2>
        <p className="text-gray-400">Review and manage challenge submissions</p>
      </div>
      
      <div className="bg-gray-900 border-gray-800 rounded-xl p-12 text-center">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-400 mb-2">Submissions Review</h3>
        <p className="text-gray-500">Code review interface coming soon</p>
      </div>
    </div>
  );
};

export default SubmissionsSimple;
