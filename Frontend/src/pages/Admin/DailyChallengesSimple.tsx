import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';

const DailyChallengesSimple: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Daily Challenges</h2>
          <p className="text-gray-400">Manage daily coding challenges</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Daily Challenge
        </Button>
      </div>
      
      <div className="bg-gray-900 border-gray-800 rounded-xl p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-400 mb-2">Daily Challenges Management</h3>
        <p className="text-gray-500">Daily challenges interface coming soon</p>
      </div>
    </div>
  );
};

export default DailyChallengesSimple;
