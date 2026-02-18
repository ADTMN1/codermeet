import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Github, ExternalLink, Code, Database, Globe, Package, Settings, Search, Filter, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { resourceService, Resource } from '../services/resourceService';
import { useNavigate } from 'react-router-dom';
import { useAppToast } from '../hooks/useToast';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();
  const toast = useAppToast();

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
      toast.success('Resources loaded successfully', `Found ${data.length} resources`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load resources';
      setError(errorMessage);
      toast.error('Failed to load resources', errorMessage);
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
  const handleResourceClick = (link: string, title: string) => {
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
      toast.info('Opening resource', `Now opening ${title} in a new tab`);
    } else {
      toast.warning('Resource not available', 'This resource does not have a valid link');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
           
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Resources Library</h1>
            </div>
          </div>

          <p className="text-gray-400 max-w-3xl">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:!border-purple-400 focus:!ring-0 focus:!ring-offset-0"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <span className="ml-3 text-purple-400">Loading resources...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              onClick={() => {
                toast.info('Retrying', 'Attempting to reload resources...');
                fetchResources();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Retry
            </Button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No resources found</p>
            <p className="text-gray-600">
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
                  className="bg-gray-800 border-gray-700 hover:border-purple-500/50 hover:bg-gray-700/70 transition-all cursor-pointer group"
                  onClick={() => handleResourceClick(resource.link, resource.title)}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${resource.bgColor}`}>
                        <Icon className={`w-6 h-6 ${resource.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="text-white font-semibold group-hover:text-purple-300 transition-colors">
                            {resource.title}
                          </h3>
                          <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                        </div>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {resource.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
                            {resource.category}
                          </span>
                          <span className="text-xs text-gray-600">
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
           
          </div>
        )}
      </div>
    </div>
  );
}
