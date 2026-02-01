import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Trophy } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { challengeService, Challenge } from '../services/challengeService';
import { toast } from 'sonner';

interface ChallengeOverviewCardProps {
  isRegistered: boolean;
  onJoinClick: () => void;
  challengeId?: string;
  onChallengeLoaded?: (challenge: Challenge | null) => void; // Add callback
}

export function ChallengeOverviewCard({
  isRegistered,
  onJoinClick,
  challengeId,
  onChallengeLoaded
}: ChallengeOverviewCardProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        // If challengeId is provided, fetch that specific challenge
        // Otherwise, fetch the first active challenge
        let challengeData;
        if (challengeId) {
          // Use public challenges endpoint for regular users
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/challenges/${challengeId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
            }
          });
          const data = await response.json();
          challengeData = data.data || null;
        } else {
          // Use public challenges endpoint for regular users
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/challenges?status=active&limit=1`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
            }
          });
          const data = await response.json();
          challengeData = data.data?.[0] || null;
        }
        setChallenge(challengeData);
        
        // Call the callback to pass challenge data to parent
        if (onChallengeLoaded) {
          onChallengeLoaded(challengeData);
        }
      } catch (error) {
        toast.error('Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId]);

  useEffect(() => {
    if (!challenge) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(challenge.endDate).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-purple-500/20 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
            <div className="h-3 bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className="bg-slate-900/50 border-purple-500/20 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
        <div className="p-6 text-center">
          <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No active challenges available</p>
        </div>
      </Card>
    );
  }

  const startDate = new Date(challenge.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const endDate = new Date(challenge.endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className="bg-slate-900/50 border-purple-500/20 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-blue-300">Challenge Overview</h3>
              {challenge.featured && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                  Featured
                </span>
              )}
            </div>
            <h4 className="text-xl font-semibold text-white">{challenge.title}</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              {challenge.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                {challenge.category}
              </span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                {challenge.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Calendar className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-xs text-slate-500">Start Date</div>
              <div className="text-slate-300">{startDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Calendar className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-xs text-slate-500">End Date</div>
              <div className="text-slate-300">{endDate}</div>
            </div>
          </div>
        </div>

        {/* Participants Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300">
              {challenge.currentParticipants} participants
            </span>
          </div>
          {challenge.maxParticipants && (
            <span className="text-slate-400 text-sm">
              Max: {challenge.maxParticipants}
            </span>
          )}
        </div>

        {/* Prizes */}
        {challenge.prizes && challenge.prizes.length > 0 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-medium">Prizes</span>
            </div>
            <div className="space-y-1">
              {challenge.prizes.slice(0, 3).map((prize, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    {prize.position}{index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} Place
                  </span>
                  <span className="text-yellow-300 font-medium">
                    {prize.prize} {prize.value > 0 && `($${prize.value})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
          {!isRegistered ? (
            <Button
              onClick={onJoinClick}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:shadow-purple-500/50 hover:scale-[1.02]"
              size="lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Challenge
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
