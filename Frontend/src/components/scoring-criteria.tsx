import React from 'react';

import { Sparkles, Code, Palette, CheckSquare, Zap } from 'lucide-react';
import { Card } from './ui/card';
// import { Progress } from './ui/progress';

export function ScoringCriteria() {
  const criteria = [
    {
      name: 'Innovation & Creativity',
      points: 30,
      maxPoints: 30,
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
    },
    {
      name: 'Code Quality & Architecture',
      points: 25,
      maxPoints: 25,
      icon: Code,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
    },
    {
      name: 'UI/UX Quality',
      points: 20,
      maxPoints: 20,
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-500/30',
    },
    {
      name: 'Functionality & Completeness',
      points: 15,
      maxPoints: 15,
      icon: CheckSquare,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
    },
    {
      name: 'Performance & Optimization',
      points: 10,
      maxPoints: 10,
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
    },
  ];

  const totalPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

  return (
    <Card className="bg-slate-900/50 border-purple-500/20 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-purple-300">Scoring Criteria</h3>
          <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
            <span className="text-purple-300">Total: {totalPoints} pts</span>
          </div>
        </div>

        <div className="space-y-4">
          {criteria.map((item) => {
            const Icon = item.icon;
            const percentage = (item.points / item.maxPoints) * 100;

            return (
              <div
                key={item.name}
                className={`p-4 rounded-lg border ${item.borderColor} ${item.bgColor} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${item.color}`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-200">{item.name}</span>
                      <span
                        className={`text-transparent bg-clip-text bg-gradient-to-r ${item.color}`}
                      >
                        {item.points} / {item.maxPoints} pts
                      </span>
                    </div>
                    {/* <Progress 
                      value={percentage} 
                      className="h-2 bg-slate-800"
                    /> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50">
          <p className="text-sm text-slate-400 leading-relaxed">
            <span className="text-slate-300">Note:</span> Projects will be
            evaluated by our expert panel based on the criteria above. Make sure
            to focus on all aspects for the best score!
          </p>
        </div>
      </div>
    </Card>
  );
}
