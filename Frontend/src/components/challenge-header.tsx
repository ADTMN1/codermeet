import React, { useState, useEffect, useRef } from 'react';

import { Code2, Trophy, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';

interface ChallengeHeaderProps {
  challengeTitle?: string;
  challengeDifficulty?: string;
  challengePoints?: number;
}

export function ChallengeHeader({ 
  challengeTitle = "Build a Real-Time Chat App",
  challengeDifficulty = "Intermediate",
  challengePoints = 500
}: ChallengeHeaderProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const fullText = "Weekly Coding Challenge";
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startTyping = () => {
      let currentIndex = 0;
      setDisplayText('');
      setIsTyping(true);

      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
          // Stop typing - don't restart
        }
      }, 100);
      
      intervalRef.current = interval;
    };

    startTyping();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="text-center pt-2">
     
     <div className="mt-2">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight relative">
          {displayText}
          {isTyping && (
            <span className="animate-pulse text-purple-400 ml-1">|</span>
          )}
        </h1>

        <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
          <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-orange-300 border border-orange-500/30 px-4 py-1">
            <Sparkles className="w-4 h-4 mr-1" />
            {challengeDifficulty}
          </Badge>
          <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-1">
            <Trophy className="w-4 h-4 mr-1" />
            {challengePoints} Points + Spotlight Feature
          </Badge>
        </div>
      </div>

      <p className="text-slate-400 text-lg">
        Improving your skills one challenge at a time.
      </p>

      {/* Challenge Title and Badges */}
      
       <div className="flex items-center justify-center gap-3 mb-2">
        <Code2 className="w-10 h-10 text-purple-400" />
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
          {challengeTitle}
        </h1>
      </div>
    </div>
  );
}
