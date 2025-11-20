import React from 'react';
import { Calendar, CheckCircle, Circle } from 'lucide-react';
import { Card } from './ui/card';

interface TimelineTrackerProps {
  isRegistered: boolean;
}

export function TimelineTracker({ isRegistered }: TimelineTrackerProps) {
  const timeline = [
    {
      day: 'Day 1-2',
      title: 'Planning & Setup',
      tasks: [
        'Setup project structure',
        'Configure WebSocket',
        'Design UI mockups',
      ],
      status: 'complete',
    },
    {
      day: 'Day 3-4',
      title: 'Core Development',
      tasks: [
        'Implement authentication',
        'Build chat interface',
        'Add real-time messaging',
      ],
      status: isRegistered ? 'current' : 'pending',
    },
    {
      day: 'Day 5-6',
      title: 'Features & Polish',
      tasks: ['Typing indicators', 'Message history', 'Online status'],
      status: 'pending',
    },
    {
      day: 'Day 7',
      title: 'Testing & Submit',
      tasks: ['Bug fixes', 'Performance optimization', 'Final submission'],
      status: 'pending',
    },
  ];

  return (
    <Card className="bg-slate-900/50 border-green-500/20 shadow-lg shadow-green-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          <h3 className="text-green-300">Project Timeline</h3>
        </div>

        {!isRegistered && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-300">
            Register to unlock your personalized timeline!
          </div>
        )}

        <div className="space-y-3">
          {timeline.map((phase, index) => (
            <div
              key={phase.day}
              className={`relative pl-6 pb-4 ${
                index !== timeline.length - 1 ? 'border-l-2 ml-2' : ''
              } ${
                phase.status === 'complete'
                  ? 'border-green-500/30'
                  : phase.status === 'current'
                    ? 'border-blue-500/30'
                    : 'border-slate-700/30'
              }`}
            >
              <div className="absolute -left-[9px] top-0">
                {phase.status === 'complete' ? (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                ) : phase.status === 'current' ? (
                  <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center">
                    <Circle className="w-2 h-2 text-slate-500" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <div
                    className={`text-xs ${
                      phase.status === 'complete'
                        ? 'text-green-400'
                        : phase.status === 'current'
                          ? 'text-blue-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {phase.day}
                  </div>
                  <div
                    className={`${
                      phase.status === 'complete'
                        ? 'text-slate-300'
                        : phase.status === 'current'
                          ? 'text-slate-200'
                          : 'text-slate-500'
                    }`}
                  >
                    {phase.title}
                  </div>
                </div>

                {(isRegistered || phase.status === 'complete') && (
                  <ul className="space-y-1">
                    {phase.tasks.map((task) => (
                      <li
                        key={task}
                        className="text-xs text-slate-500 flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        {task}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {isRegistered && (
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="text-green-400">Day 1-2 Complete</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
