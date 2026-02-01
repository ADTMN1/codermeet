import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Github, ExternalLink, Code, Database, Globe, Package, Settings } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { resourceService, Resource } from '../services/resourceService';
import { useNavigate } from 'react-router-dom';

export function ResourcesCard() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Icon mapping
  const iconMap = {
    BookOpen,
    FileText,
    Github,
    Code,
    Database,
    Globe,
    Package,
    Settings
  };

  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resourceService.getActiveResources();
      setResources(data);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, []);

  // Handle resource click
  const handleResourceClick = (link: string) => {
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle browse all resources
  const handleBrowseAll = () => {
    navigate('/resources');
  };

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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
              <span className="ml-3 text-cyan-400 text-sm">Loading resources...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={fetchResources}
                className="text-cyan-400 hover:text-cyan-300 text-sm underline"
              >
                Retry
              </button>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No resources available</p>
            </div>
          ) : (
            resources.map((resource) => {
              const Icon = iconMap[resource.icon as keyof typeof iconMap] || Package;
              return (
                <button
                  key={resource._id}
                  onClick={() => handleResourceClick(resource.link)}
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
            })
          )}
        </div>

        <Button
          variant="outline"
          className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          onClick={handleBrowseAll}
        >
          Browse All Resources
        </Button>
      </div>
    </Card>
  );
}
