import React from 'react';
import { Award, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';

const WeeklyContestsSimple: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Weekly Contests</h2>
          <p className="text-gray-400">Manage weekly coding competitions</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Weekly Contest
        </Button>
      </div>
      
      <div className="bg-gray-900 border-gray-800 rounded-xl p-12 text-center">
        <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-400 mb-2">Weekly Contests Management</h3>
        <p className="text-gray-500">Weekly contests interface coming soon</p>
      </div>
    </div>
  );
};

export default WeeklyContestsSimple;
