import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save,
  X,
  Calendar,
  Clock,
  Users,
  Trophy,
  Target,
  Zap,
  Star,
  Plus,
  Minus,
  ChevronDown,
  Upload,
  Link,
  FileText,
  Gift,
  Award,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { challengeService } from '../../services/challengeService';
import { useAdminToast } from '../../utils/adminToast';

const CreateWeeklyContest: React.FC = () => {
  const navigate = useNavigate();
  const adminToast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Frontend',
    difficulty: 'Medium',
    tags: ['React', 'Frontend', 'UI/UX'],
    requirements: [
      'Use a modern frontend framework',
      'Implement responsive design',
      'Include proper error handling',
      'Write clean, maintainable code'
    ],
    deliverables: [
      'Source code repository (GitHub link)',
      'Live demo URL',
      'Brief documentation explaining your approach'
    ],
    resources: [
      {
        title: 'Frontend Framework Documentation',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks',
        type: 'documentation'
      },
      {
        title: 'Responsive Design Guide',
        url: 'https://web.dev/responsive-web-design-basics/',
        type: 'article'
      }
    ],
    startDate: '',
    endDate: '',
    maxParticipants: 100,
    prizePool: 500,
    winnerCount: 3,
    status: 'upcoming',
    isFeatured: true,
    judgingCriteria: [
      {
        name: 'Code Quality',
        description: 'Clean, maintainable, and well-structured code',
        maxScore: 30,
        weight: 30
      },
      {
        name: 'UI/UX Design',
        description: 'User interface and user experience quality',
        maxScore: 25,
        weight: 25
      },
      {
        name: 'Functionality',
        description: 'Implementation of required features',
        maxScore: 25,
        weight: 25
      },
      {
        name: 'Innovation',
        description: 'Creative and unique solutions',
        maxScore: 20,
        weight: 20
      }
    ] as Array<{name: string, description: string, maxScore: number, weight: number}>
  });

  const [tagInput, setTagInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');
  const [resourceInput, setResourceInput] = useState({ title: '', url: '', type: 'documentation' });

  const categories = [
    'Algorithms', 'Data Structures', 'Frontend', 'Backend', 
    'Full Stack', 'Mobile', 'DevOps', 'AI/ML', 'Security', 'Database'
  ];

  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
  const statuses = ['draft', 'upcoming', 'active', 'completed', 'cancelled'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate end date when start date changes
      if (field === 'startDate' && value) {
        const startDate = new Date(value);
        // Add 7 days for weekly contest
        const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        newData.endDate = endDate.toISOString().slice(0, 16);
      }
      
      return newData;
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const removeRequirement = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, index) => index !== indexToRemove)
    }));
  };

  const addDeliverable = () => {
    if (deliverableInput.trim()) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, deliverableInput.trim()]
      }));
      setDeliverableInput('');
    }
  };

  const removeDeliverable = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, index) => index !== indexToRemove)
    }));
  };

  const addResource = () => {
    if (resourceInput.title.trim() && resourceInput.url.trim()) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, { ...resourceInput }]
      }));
      setResourceInput({ title: '', url: '', type: 'documentation' });
    }
  };

  const removeResource = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Frontend Debug - Form submission started');
    console.log('🔍 Frontend Debug - Form data:', JSON.stringify(formData, null, 2));
    
    if (!formData.title.trim() || !formData.description.trim()) {
      console.log('❌ Frontend Debug - Validation failed: missing title or description');
      toast.error('Title and description are required');
      return;
    }

    console.log('✅ Frontend Debug - Basic validation passed');

    // Calculate year and weekNumber from startDate if not provided
    const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
    const year = startDate.getFullYear();
    const weekNumber = Math.ceil((startDate.getDate() + new Date(year, startDate.getMonth(), 1).getDay()) / 7);

    console.log('📅 Frontend Debug - Date calculations:', { startDate, year, weekNumber });

    // Use provided dates or calculate defaults
    const submissionData = {
      ...formData,
      year,
      weekNumber,
      startDate: formData.startDate || calculateDates().startDate,
      endDate: formData.endDate || calculateDates().endDate
    };

    console.log('📦 Frontend Debug - Final submission data:', JSON.stringify(submissionData, null, 2));

    try {
      console.log('🚀 Frontend Debug - Sending request to backend...');
      setLoading(true);
      const response = await challengeService.createWeeklyChallenge(submissionData);
      console.log('✅ Frontend Debug - Backend response:', response);
      adminToast.success('Weekly contest created successfully');
      navigate('/admin/weekly-challenges');
    } catch (error: any) {
      console.error('❌ Frontend Debug - Error details:', error);
      console.error('❌ Frontend Debug - Error response:', error.response);
      console.error('❌ Frontend Debug - Error status:', error.response?.status);
      console.error('❌ Frontend Debug - Error data:', error.response?.data);
      console.error('❌ Frontend Debug - Error message:', error.message);
      adminToast.error('create', 'weekly contest', error);
    } finally {
      console.log('🏁 Frontend Debug - Request completed');
      setLoading(false);
    }
  };

  const calculateDates = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      startDate: now.toISOString().slice(0, 16),
      endDate: nextWeek.toISOString().slice(0, 16)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Weekly Contest</h1>
          <p className="text-gray-400">Set up a new weekly coding competition</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/weekly-challenges')}
          className='cursor-pointer'
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contest Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  placeholder="Enter contest title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty *
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                placeholder="Describe the weekly contest requirements and objectives"
                required
              />
            </div>
          </div>

          {/* Contest Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Contest Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate || calculateDates().startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate || calculateDates().endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants || ''}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prize Pool ($)
                </label>
                <input
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) => handleInputChange('prizePool', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Winner Count
                </label>
                <input
                  type="number"
                  value={formData.winnerCount}
                  onChange={(e) => handleInputChange('winnerCount', parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  min="1"
                  max="10"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-300">
                  Featured Contest
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Tags
            </h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                placeholder="Add tags (press Enter)"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Requirements
            </h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                placeholder="Add requirements (press Enter)"
              />
              <Button
                type="button"
                onClick={addRequirement}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {formData.requirements.map((requirement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <span className="text-gray-300">{requirement}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Deliverables
            </h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={deliverableInput}
                onChange={(e) => setDeliverableInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                placeholder="Add deliverables (press Enter)"
              />
              <Button
                type="button"
                onClick={addDeliverable}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {formData.deliverables.map((deliverable, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <span className="text-gray-300">{deliverable}</span>
                  <button
                    type="button"
                    onClick={() => removeDeliverable(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Link className="w-5 h-5 mr-2" />
              Resources
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                value={resourceInput.title}
                onChange={(e) => setResourceInput(prev => ({ ...prev, title: e.target.value }))}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                placeholder="Resource title"
              />
              <input
                type="url"
                value={resourceInput.url}
                onChange={(e) => setResourceInput(prev => ({ ...prev, url: e.target.value }))}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                placeholder="Resource URL"
              />
              <select
                value={resourceInput.type}
                onChange={(e) => setResourceInput(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              >
                <option value="documentation">Documentation</option>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="github">GitHub</option>
                <option value="other">Other</option>
              </select>
              <Button
                type="button"
                onClick={addResource}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {formData.resources.map((resource, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">{resource.title}</div>
                    <div className="text-gray-400 text-sm">{resource.url}</div>
                    <div className="text-xs text-gray-500">{resource.type}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Weekly Contest
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateWeeklyContest;