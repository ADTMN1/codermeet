import React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ChallengeOverviewCardProps {
  isRegistered: boolean;
  onJoinClick: () => void;
}

export function ChallengeOverviewCard({
  isRegistered,
  onJoinClick,
}: ChallengeOverviewCardProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 34,
    seconds: 22,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="bg-slate-900/50 border-purple-500/20 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h3 className="text-blue-300">Challenge Overview</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Build a fully functional real-time chat application with user
              authentication, message history, typing indicators, and online
              status. Demonstrate your skills in WebSocket communication, modern
              UI design, and state management.
            </p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Calendar className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-xs text-slate-500">Start Date</div>
              <div className="text-slate-300">Nov 18, 2025</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Calendar className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-xs text-slate-500">End Date</div>
              <div className="text-slate-300">Nov 25, 2025</div>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-cyan-900/30 border border-purple-500/30 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 animate-pulse" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-300">Time Remaining</span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-2 border border-purple-500/20">
                    <div className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
                      {item.value.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          {isRegistered ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-300">
                Registration Successful! You're all set.
              </span>
            </div>
          ) : (
            <Button
              onClick={onJoinClick}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:shadow-purple-500/50 hover:scale-[1.02]"
              size="lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Challenge
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
