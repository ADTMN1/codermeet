import React from 'react';

import { Trophy, Medal, Award, ExternalLink } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function WinnersSection() {
  const winners = [
    {
      rank: 1,
      name: 'CodeNinjas',
      type: 'Team',
      members: ['Alex Chen', 'Sarah Kim', 'Mike Johnson'],
      score: 98,
      breakdown: {
        innovation: 29,
        codeQuality: 24,
        uiux: 19,
        functionality: 15,
        performance: 11,
      },
      thumbnail: '🏆',
      medal: 'Gold',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    {
      rank: 2,
      name: 'DevMasters',
      type: 'Team',
      members: ['Emily Rodriguez', 'James Park'],
      score: 95,
      breakdown: {
        innovation: 28,
        codeQuality: 25,
        uiux: 18,
        functionality: 14,
        performance: 10,
      },
      thumbnail: '🥈',
      medal: 'Silver',
      color: 'from-slate-400 to-slate-500',
      bgColor: 'bg-slate-400/10',
      borderColor: 'border-slate-400/30',
    },
    {
      rank: 3,
      name: 'ByteBuilders',
      type: 'Solo',
      members: ['David Kumar'],
      score: 92,
      breakdown: {
        innovation: 27,
        codeQuality: 23,
        uiux: 19,
        functionality: 14,
        performance: 9,
      },
      thumbnail: '🥉',
      medal: 'Bronze',
      color: 'from-orange-700 to-orange-800',
      bgColor: 'bg-orange-700/10',
      borderColor: 'border-orange-700/30',
    },
  ];

  const honorableMentions = [
    { name: 'PixelPerfect', score: 89 },
    { name: 'CloudCrafters', score: 87 },
    { name: 'FullStackHeroes', score: 85 },
  ];

  return (
    <Card className="bg-slate-900/50 border-yellow-500/20 shadow-lg shadow-yellow-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Challenge Winners
            </h3>
          </div>
          <p className="text-slate-400 text-sm">
            Congratulations to all participants! Here are the top performers.
          </p>
        </div>

        {/* Winners */}
        <div className="space-y-4">
          {winners.map((winner) => (
            <div
              key={winner.rank}
              className={`p-5 rounded-xl border-2 ${winner.borderColor} ${winner.bgColor} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div className="text-5xl">{winner.thumbnail}</div>

                {/* Winner Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-slate-100">{winner.name}</h4>
                        <Badge
                          className={`bg-gradient-to-r ${winner.color} text-white border-0`}
                        >
                          {winner.medal}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400">
                        {winner.type} • {winner.members.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl text-transparent bg-clip-text bg-gradient-to-r ${winner.color}`}
                      >
                        {winner.score}
                      </div>
                      <div className="text-xs text-slate-500">/ 100 points</div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300 list-none">
                      <span className="inline-flex items-center gap-1">
                        View Score Breakdown
                        <Award className="w-4 h-4" />
                      </span>
                    </summary>
                    <div className="mt-3 p-3 rounded-lg bg-slate-800/50 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Innovation:</span>
                          <span className="text-purple-300">
                            {winner.breakdown.innovation}/30
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Code Quality:</span>
                          <span className="text-blue-300">
                            {winner.breakdown.codeQuality}/25
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">UI/UX:</span>
                          <span className="text-pink-300">
                            {winner.breakdown.uiux}/20
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Functionality:</span>
                          <span className="text-green-300">
                            {winner.breakdown.functionality}/15
                          </span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-slate-400">Performance:</span>
                          <span className="text-yellow-300">
                            {winner.breakdown.performance}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Honorable Mentions */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Medal className="w-5 h-5 text-cyan-400" />
            <h4 className="text-cyan-300">Honorable Mentions</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {honorableMentions.map((mention) => (
              <div
                key={mention.name}
                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center"
              >
                <div className="text-slate-200">{mention.name}</div>
                <div className="text-cyan-400">{mention.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* View Full Leaderboard Button */}
        <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white">
          <Trophy className="w-4 h-4 mr-2" />
          View Full Leaderboard
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}
