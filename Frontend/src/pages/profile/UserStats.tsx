import React from 'react';

import { Card, CardContent } from '../../components/ui/card';
import { Trophy, Code2, Clock } from 'lucide-react';

export default function UserStats() {
  const stats = [
    { label: 'Challenges Completed', value: 12, icon: Trophy },
    { label: 'Total Points', value: 850, icon: Code2 },
    { label: 'Hours Coded', value: 140, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((item) => (
        <Card
          key={item.label}
          className="bg-slate-900/40 border-slate-700/50 shadow-lg"
        >
          <CardContent className="p-5 text-center space-y-3">
            <item.icon className="w-6 h-6 mx-auto text-purple-400" />
            <div className="text-3xl font-bold text-white">{item.value}</div>
            <div className="text-slate-400 text-sm">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
