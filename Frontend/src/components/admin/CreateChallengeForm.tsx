import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCreateChallenge, useUpdateChallenge } from '../../hooks/useChallenges';
import { resourceService } from '../../services/resourceService';
import { toast } from 'sonner';
import { Challenge } from '../../services/challengeService';

interface CreateChallengeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  challenge?: Challenge | null; // Add challenge prop for edit mode
}

const CreateChallengeForm: React.FC<CreateChallengeFormProps> = ({ onClose, onSuccess, challenge }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Frontend',
    difficulty: 'Beginner',
    tags: [] as string[],
    requirements: [''],
    deliverables: [''],
    resources: [{ title: '', url: '', type: 'article', icon: 'BookOpen' }] as Array<{ title: string; url: string; type: string; icon: string }>,
    startDate: '',
    endDate: '',
    maxParticipants: '',
    prizes: [{ position: 1, prize: '', value: 0, currency: 'USD' }] as Array<{ position: number; prize: string; value: number; currency: string }>,
    evaluationCriteria: [{ criterion: '', weight: 1, description: '' }] as Array<{ criterion: string; weight: number; description: string }>
  });
  const [loading, setLoading] = useState(false);

  // Professional React Query hooks
  const createChallenge = useCreateChallenge();
  const updateChallenge = useUpdateChallenge();

  // Populate form when editing a challenge
  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        category: challenge.category || 'Frontend',
        difficulty: challenge.difficulty || 'Beginner',
        tags: challenge.tags || [],
        requirements: challenge.requirements || [''],
        deliverables: challenge.deliverables || [''],
        resources: challenge.resources?.map(r => ({ ...r, icon: 'BookOpen' })) || [{ title: '', url: '', type: 'article', icon: 'BookOpen' }],
        startDate: challenge.startDate ? new Date(challenge.startDate).toISOString().split('T')[0] : '',
        endDate: challenge.endDate ? new Date(challenge.endDate).toISOString().split('T')[0] : '',
        maxParticipants: challenge.maxParticipants?.toString() || '',
        prizes: challenge.prizes || [{ position: 1, prize: '', value: 0, currency: 'USD' }],
        evaluationCriteria: challenge.evaluationCriteria || [{ criterion: '', weight: 1, description: '' }]
      });
    }
  }, [challenge]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof typeof formData, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item: any, i: number) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: keyof typeof formData, defaultItem: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), defaultItem]
    }));
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_: any, i: number) => i !== index)
    }));
  };

  // Resource-specific handlers
  const handleResourceChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { title: '', url: '', type: 'article', icon: 'BookOpen' }]
    }));
  };

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  // Helper functions for resource colors
  const getResourceColor = (type: string): string => {
    const colorMap: { [key: string]: string } = {
      'documentation': 'text-blue-400',
      'tutorial': 'text-green-400',
      'tool': 'text-purple-400',
      'library': 'text-yellow-400',
      'template': 'text-cyan-400',
      'ui': 'text-red-400'
    };
    return colorMap[type] || 'text-blue-400';
  };

  const getResourceBgColor = (type: string): string => {
    const bgColorMap: { [key: string]: string } = {
      'documentation': 'bg-blue-500/10',
      'tutorial': 'bg-green-500/10',
      'tool': 'bg-purple-500/10',
      'library': 'bg-yellow-500/10',
      'template': 'bg-cyan-500/10',
      'ui': 'bg-red-500/10'
    };
    return bgColorMap[type] || 'bg-blue-500/10';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const challengeData = {
        ...formData,
        tags: formData.tags.filter((tag: string) => tag.trim() !== ''),
        requirements: formData.requirements.filter((req: string) => req.trim() !== ''),
        deliverables: formData.deliverables.filter((del: string) => del.trim() !== ''),
        resources: formData.resources.filter((res: any) => res.title.trim() !== ''),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        prizes: formData.prizes.filter((prize: any) => prize.prize.trim() !== '').map((prize: any) => ({
          position: prize.position,
          prize: prize.prize,
          value: prize.value,
          currency: prize.currency
        })),
        evaluationCriteria: formData.evaluationCriteria.filter((criteria: any) => criteria.criterion.trim() !== ''),
        status: 'draft'
      };

      if (challenge) {
        // Update existing challenge
        await updateChallenge.mutateAsync({ id: challenge._id, data: challengeData as unknown as Partial<Challenge> });
      } else {
        // Create new challenge
        await createChallenge.mutateAsync(challengeData);
        
        // Create resources for challenge (only for new challenges)
        const validResources = formData.resources.filter(res => res.title.trim() !== '' && res.url.trim() !== '');
        if (validResources.length > 0) {
          for (const resource of validResources) {
            try {
              await resourceService.createResource({
                title: resource.title,
                description: `Learning resource for challenge: ${formData.title}`,
                link: resource.url,
                icon: resource.icon,
                color: getResourceColor(resource.type),
                bgColor: getResourceBgColor(resource.type),
                category: resource.type,
                isActive: true,
                order: 0
              });
            } catch (resourceError) {
              console.error('Failed to create resource:', resourceError);
              toast.warning(`Resource "${resource.title}" could not be created`);
            }
          }
          toast.success(`${validResources.length} resources created successfully!`);
        }
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      // Error handling is done in the hooks, but we'll add a fallback
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{challenge ? 'Edit Challenge' : 'Create New Challenge'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Challenge Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Full Stack">Full Stack</option>
                <option value="Mobile">Mobile</option>
                <option value="DevOps">DevOps</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Participants (optional)
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                placeholder="Unlimited if empty"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Requirements *
            </label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                  placeholder="Enter requirement"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('requirements', '')}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </button>
          </div>

          {/* Deliverables */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deliverables *
            </label>
            {formData.deliverables.map((del, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={del}
                  onChange={(e) => handleArrayChange('deliverables', index, e.target.value)}
                  placeholder="Enter deliverable"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                {formData.deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('deliverables', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('deliverables', '')}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Deliverable
            </button>
          </div>

          {/* Prizes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prizes *
            </label>
            {formData.prizes.map((prize, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <input
                  type="number"
                  value={prize.position}
                  onChange={(e) => handleArrayChange('prizes', index, { ...prize, position: parseInt(e.target.value) })}
                  placeholder="Position"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={prize.prize}
                  onChange={(e) => handleArrayChange('prizes', index, { ...prize, prize: e.target.value })}
                  placeholder="Prize description"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  value={prize.value}
                  onChange={(e) => handleArrayChange('prizes', index, { ...prize, value: parseFloat(e.target.value) })}
                  placeholder="Value"
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                {formData.prizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('prizes', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('prizes', { position: formData.prizes.length + 1, prize: '', value: 0, currency: 'USD' })}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prize
            </button>
          </div>

          {/* Resources Section */}
          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Learning Resources
            </label>
            <p className="text-sm text-gray-400 mb-4">
              Add learning resources that will help participants complete this challenge. These will be created as resources in the system.
            </p>
            {formData.resources.map((resource, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Resource Title *
                    </label>
                    <input
                      type="text"
                      value={resource.title}
                      onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                      placeholder="e.g., React Documentation"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL *
                    </label>
                    <input
                      type="url"
                      value={resource.url}
                      onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={resource.type}
                      onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="documentation">Documentation</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="tool">Tool</option>
                      <option value="library">Library</option>
                      <option value="template">Template</option>
                      <option value="ui">UI Component</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Icon
                    </label>
                    <select
                      value={resource.icon || 'BookOpen'}
                      onChange={(e) => handleResourceChange(index, 'icon', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="BookOpen">BookOpen</option>
                      <option value="FileText">FileText</option>
                      <option value="Github">Github</option>
                      <option value="Code">Code</option>
                      <option value="Database">Database</option>
                      <option value="Globe">Globe</option>
                      <option value="Package">Package</option>
                      <option value="Settings">Settings</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    {formData.resources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addResource}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (challenge ? 'Updating...' : 'Creating...') : (challenge ? 'Update Challenge' : 'Create Challenge')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateChallengeForm;
