import React from 'react';

import { BookOpen, FileText, Github, ExternalLink } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

export function ResourcesCard() {
  const resources = [
    {
      title: 'Starter Template',
      description: 'React + TypeScript boilerplate',
      icon: Github,
      link: '#',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Documentation',
      description: 'Socket.io & WebSocket guide',
      icon: BookOpen,
      link: '#',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'UI Components',
      description: 'Pre-built chat UI library',
      icon: FileText,
      link: '#',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <Card className="bg-slate-900/50 border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h3 className="text-cyan-300">Resource Pack</h3>
        </div>

        <p className="text-sm text-slate-400">
          Essential resources to help you build your project faster and better.
        </p>

        <div className="space-y-2">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <button
                key={resource.title}
                className="w-full p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${resource.bgColor}`}>
                    <Icon className={`w-4 h-4 ${resource.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {resource.title}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
        >
          Browse All Resources
        </Button>
      </div>
    </Card>
  );
}
