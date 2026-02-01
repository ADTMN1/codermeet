import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Github, ExternalLink, Code, Database, Globe, Package, Settings, Search, Filter, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { resourceService, Resource } from '../services/resourceService';
import { useNavigate } from 'react-router-dom';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  // Fetch all resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resourceService.getActiveResources();
      setResources(data);
      setFilteredResources(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, []);

  // Filter resources based on search and category
  useEffect(() => {
    let filtered = resources;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(resources.map(resource => resource.category)))];

  // Handle resource click
  const handleResourceClick = (link: string) => {
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Resources Library</h1>
            </div>
          </div>

          <p className="text-slate-400 max-w-3xl">
            Explore our comprehensive collection of resources designed to accelerate your development journey. 
            From documentation to tools, find everything you need to build amazing projects.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-500" />
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                      : "border-slate-700 text-slate-400 hover:border-cyan-500 hover:text-cyan-400"
                  }
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <span className="ml-3 text-cyan-400">Loading resources...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              onClick={fetchResources}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Retry
            </Button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">No resources found</p>
            <p className="text-slate-600">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Check back later for new resources'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const Icon = iconMap[resource.icon as keyof typeof iconMap] || Package;
              return (
                <Card
                  key={resource._id}
                  className="bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-900/70 transition-all cursor-pointer group"
                  onClick={() => handleResourceClick(resource.link)}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${resource.bgColor}`}>
                        <Icon className={`w-6 h-6 ${resource.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="text-white font-semibold group-hover:text-cyan-300 transition-colors">
                            {resource.title}
                          </h3>
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                        </div>
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                          {resource.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                            {resource.category}
                          </span>
                          <span className="text-xs text-slate-600">
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {!loading && !error && (
          <div className="mt-12 text-center">
            <p className="text-slate-500">
              Showing {filteredResources.length} of {resources.length} resources
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
