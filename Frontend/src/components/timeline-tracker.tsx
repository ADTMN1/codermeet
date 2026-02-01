import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Circle, Clock } from 'lucide-react';
import { Card } from './ui/card';

interface TimelineTrackerProps {
  isRegistered: boolean;
  challenge?: any; // Challenge data with startDate and endDate
  submission?: any; // User's submission data
}

interface TimelinePhase {
  day: string;
  title: string;
  tasks: string[];
  status: 'complete' | 'current' | 'pending';
  startDate: Date;
  endDate: Date;
}

export function TimelineTracker({ isRegistered, challenge, submission }: TimelineTrackerProps) {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [timeline, setTimeline] = useState<TimelinePhase[]>([]);

  useEffect(() => {
    if (!challenge?.startDate || !challenge?.endDate) {
      // Fallback to static timeline if no dates provided
      setStaticTimeline();
      return;
    }

    const calculateDynamicTimeline = () => {
      const start = new Date(challenge.startDate);
      const end = new Date(challenge.endDate);
      const now = new Date();
      
      // Calculate total duration and phase durations
      const totalDuration = end.getTime() - start.getTime();
      const phaseDuration = totalDuration / 4; // 4 phases

      const phases: TimelinePhase[] = [
        {
          day: 'Phase 1',
          title: 'Planning & Setup',
          tasks: [
            'Setup project structure',
            'Configure development environment',
            'Design UI mockups',
          ],
          status: 'pending',
          startDate: new Date(start.getTime() + phaseDuration * 0),
          endDate: new Date(start.getTime() + phaseDuration * 1),
        },
        {
          day: 'Phase 2',
          title: 'Core Development',
          tasks: [
            'Implement authentication',
            'Build core functionality',
            'Add real-time features',
          ],
          status: 'pending',
          startDate: new Date(start.getTime() + phaseDuration * 1),
          endDate: new Date(start.getTime() + phaseDuration * 2),
        },
        {
          day: 'Phase 3',
          title: 'Features & Polish',
          tasks: [
            'Add advanced features',
            'UI/UX improvements',
            'Performance optimization',
          ],
          status: 'pending',
          startDate: new Date(start.getTime() + phaseDuration * 2),
          endDate: new Date(start.getTime() + phaseDuration * 3),
        },
        {
          day: 'Phase 4',
          title: 'Testing & Submit',
          tasks: [
            'Testing & debugging',
            'Final refinements',
            'Project submission',
          ],
          status: 'pending',
          startDate: new Date(start.getTime() + phaseDuration * 3),
          endDate: new Date(start.getTime() + phaseDuration * 4),
        },
      ];

      // Determine status of each phase
      phases.forEach((phase, index) => {
        if (submission) {
          // User has submitted
          const submissionDate = new Date(submission.submittedAt);
          const challengeEnd = new Date(challenge.endDate);
          
          if (submissionDate <= challengeEnd) {
            // Submitted before or on deadline - all phases are complete
            phase.status = 'complete';
          } else {
            // Submitted after deadline - mark phases up to submission as complete
            if (submissionDate >= phase.startDate && submissionDate <= phase.endDate) {
              // User submitted during this phase
              phase.status = 'complete';
              if (!currentPhase) setCurrentPhase(index);
            } else if (submissionDate > phase.endDate) {
              // User submitted after this phase
              phase.status = 'complete';
            } else {
              // This phase is after submission
              phase.status = 'pending';
            }
          }
        } else {
          // No submission yet - use date-based logic
          if (now < phase.startDate) {
            phase.status = 'pending';
          } else if (now >= phase.startDate && now <= phase.endDate) {
            phase.status = isRegistered ? 'current' : 'pending';
            setCurrentPhase(index);
          } else {
            phase.status = 'complete';
          }
        }
      });

      setTimeline(phases);
    };

    calculateDynamicTimeline();
    
    // Update every minute to keep current phase accurate
    const interval = setInterval(calculateDynamicTimeline, 60000);
    return () => clearInterval(interval);
  }, [challenge, isRegistered, submission]);

  const setStaticTimeline = () => {
    const staticPhases: TimelinePhase[] = [
      {
        day: 'Day 1-2',
        title: 'Planning & Setup',
        tasks: ['Setup project structure', 'Configure WebSocket', 'Design UI mockups'],
        status: 'complete',
        startDate: new Date(),
        endDate: new Date(),
      },
      {
        day: 'Day 3-4',
        title: 'Core Development',
        tasks: ['Implement authentication', 'Build chat interface', 'Add real-time messaging'],
        status: isRegistered ? 'current' : 'pending',
        startDate: new Date(),
        endDate: new Date(),
      },
      {
        day: 'Day 5-6',
        title: 'Features & Polish',
        tasks: ['Typing indicators', 'Message history', 'Online status'],
        status: 'pending',
        startDate: new Date(),
        endDate: new Date(),
      },
      {
        day: 'Day 7',
        title: 'Testing & Submit',
        tasks: ['Bug fixes', 'Performance optimization', 'Final submission'],
        status: 'pending',
        startDate: new Date(),
        endDate: new Date(),
      },
    ];
    setTimeline(staticPhases);
  };

  const getProgressPercentage = () => {
    if (!challenge?.startDate || !challenge?.endDate || timeline.length === 0) return 0;
    
    if (submission) {
      const submissionDate = new Date(submission.submittedAt);
      const challengeEnd = new Date(challenge.endDate);
      
      // If submitted before or on deadline, show 100% progress
      if (submissionDate <= challengeEnd) {
        return 100;
      }
      
      // If submitted after deadline (late submission), calculate based on submission date
      const start = new Date(challenge.startDate).getTime();
      const end = new Date(challenge.endDate).getTime();
      const submissionTime = submissionDate.getTime();
      
      const totalDuration = end - start;
      const elapsed = submissionTime - start;
      
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    } else {
      // For non-submitted users, calculate based on current time
      const start = new Date(challenge.startDate).getTime();
      const end = new Date(challenge.endDate).getTime();
      const now = new Date().getTime();
      
      const totalDuration = end - start;
      const elapsed = now - start;
      
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
  };

  const getCurrentPhaseInfo = () => {
    if (timeline.length === 0) return null;
    
    if (submission) {
      // For submitted users, show the phase they submitted in
      const submissionDate = new Date(submission.submittedAt);
      const submissionPhase = timeline.find(phase => 
        submissionDate >= phase.startDate && submissionDate <= phase.endDate
      );
      return submissionPhase || timeline[timeline.length - 1];
    } else {
      // For non-submitted users, show current active phase
      const activePhase = timeline.find(phase => phase.status === 'current');
      return activePhase || timeline[timeline.length - 1];
    }
  };

  const getSubmissionStatus = () => {
    if (!submission) return null;
    
    const submissionDate = new Date(submission.submittedAt);
    const challengeEnd = new Date(challenge.endDate);
    const daysEarly = Math.ceil((challengeEnd.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysEarly > 0) {
      return {
        text: `Submitted ${daysEarly} days early`,
        type: 'early',
        color: 'text-green-400'
      };
    } else if (daysEarly === 0) {
      return {
        text: 'Submitted on deadline day',
        type: 'ontime',
        color: 'text-blue-400'
      };
    } else {
      return {
        text: `Submitted ${Math.abs(daysEarly)} days late`,
        type: 'late',
        color: 'text-orange-400'
      };
    }
  };

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

        {/* Real-time Progress Bar */}
        {challenge?.startDate && challenge?.endDate && (
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">
                {submission ? (
                  new Date(submission.submittedAt) <= new Date(challenge.endDate)
                    ? 'Challenge Completed'
                    : 'Progress at Submission'
                ) : (
                  'Overall Progress'
                )}
              </span>
              <span className="text-green-400">{getProgressPercentage().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  submission && new Date(submission.submittedAt) <= new Date(challenge.endDate)
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : submission
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            {submission && (
              <div className="mt-2 text-xs text-slate-500">
                Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Submission Status */}
        {submission && getSubmissionStatus() && (
          <div className={`p-3 rounded-lg border ${
            getSubmissionStatus()?.type === 'early' 
              ? 'bg-green-900/20 border-green-500/30' 
              : getSubmissionStatus()?.type === 'ontime'
                ? 'bg-blue-900/20 border-blue-500/30'
                : 'bg-orange-900/20 border-orange-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className={`text-sm font-medium ${getSubmissionStatus()?.color}`}>
                {getSubmissionStatus()?.text}
              </span>
            </div>
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
                    {phase.status === 'current' && (
                      <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
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
                  {challenge?.startDate && challenge?.endDate && (
                    <div className="text-xs text-slate-600 mt-1">
                      {phase.startDate.toLocaleDateString()} - {phase.endDate.toLocaleDateString()}
                    </div>
                  )}
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
              <span className="text-slate-400">
                {submission ? 'Submitted in' : 'Current Phase'}
              </span>
              <span className="text-green-400">
                {getCurrentPhaseInfo()?.title || 'Loading...'}
              </span>
            </div>
            {challenge?.startDate && challenge?.endDate && (
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>
                  Challenge: {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {submission && (
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <CheckCircle className="w-3 h-3" />
                <span>
                  Status: {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
