import React from 'react';

import { useState, useEffect } from 'react';
import {
  Upload,
  Github,
  FileArchive,
  CheckCircle,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { submissionService, SubmissionData } from '../services/submissionService';
import LoadingSpinner from './ui/loading-spinner';

interface UploadSectionProps {
  registrationMode: 'solo' | 'team';
  challengeId?: string;
}

export function UploadSection({ registrationMode, challengeId }: UploadSectionProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  // Check if user has already submitted
  useEffect(() => {
    const checkSubmission = async () => {
      if (!challengeId) return;
      
      try {
        const userSubmission = await submissionService.getUserSubmission(challengeId);
        if (userSubmission) {
          setSubmission(userSubmission);
          setSubmitted(true);
          setGithubUrl(userSubmission.githubUrl || '');
        }
      } catch (error) {
        // Expected error when no submission exists - silently handle
      }
    };

    checkSubmission();
  }, [challengeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!challengeId) {
      toast.error('Challenge ID is required for submission');
      return;
    }
    
    if (!githubUrl && !fileName) {
      toast.error('Please provide either a GitHub URL or upload a file');
      return;
    }

    setLoading(true);
    
    try {
      const submissionData: SubmissionData = {
        githubUrl: githubUrl,
        liveUrl: '', // Optional field for weekly challenges
        description: `Project submitted by ${registrationMode === 'solo' ? 'individual' : 'team'} participant`,
        screenshots: fileName ? [{
          filename: fileName,
          url: '', // Will be populated when file upload is implemented
          size: 0
        }] : []
      };

      const result = await submissionService.submitProject(challengeId, submissionData);
      
      setSubmitted(true);
      setSubmission(result.data);
      
      toast.success('🚀 Project submitted successfully!', {
        description: 'Your project has been submitted and will be reviewed by our team.',
        duration: 5000,
      });
    } catch (error: any) {
      if (error.message && error.message.includes('already submitted')) {
        toast.error('🚫 Resubmission not allowed', {
          description: 'You have already submitted a project for this challenge.',
          duration: 5000,
        });
      } else {
        toast.error(error.message || 'Failed to submit project');
      }
    } finally {
      setLoading(false);
    }
  };

  const progressSteps = [
    { label: 'Registered', icon: CheckCircle, status: 'complete' },
    {
      label: 'Building',
      icon: submitted ? CheckCircle : Circle,
      status: submitted ? 'complete' : 'current',
    },
    {
      label: 'Submit Project',
      icon: submitted ? CheckCircle : Circle,
      status: submitted ? 'complete' : 'pending',
    },
    { label: 'Evaluation', icon: Circle, status: 'pending' },
  ];

  return (
    <Card className="bg-slate-900/50 border-blue-500/20 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-blue-300">Project Submission</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm ${
              submitted
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
            }`}
          >
            {submitted ? 'Submitted' : 'Not Submitted'}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            {progressSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      step.status === 'complete'
                        ? 'bg-green-500/20 border-2 border-green-500'
                        : step.status === 'current'
                          ? 'bg-blue-500/20 border-2 border-blue-500 animate-pulse'
                          : 'bg-slate-800 border-2 border-slate-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        step.status === 'complete'
                          ? 'text-green-400'
                          : step.status === 'current'
                            ? 'text-blue-400'
                            : 'text-slate-600'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs text-center ${
                      step.status === 'complete' || step.status === 'current'
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < progressSteps.length - 1 && (
                    <ArrowRight
                      className="absolute top-5 w-4 h-4 text-slate-700"
                      style={{ left: `${(index + 0.5) * 25}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">GitHub Repository URL</Label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-slate-900 text-slate-500">OR</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Upload Project (ZIP)</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-all"
                >
                  <FileArchive className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400">
                    {fileName || 'Click to upload ZIP file'}
                  </span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Project
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="p-6 rounded-lg bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30">
            <div className="text-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-green-300 font-semibold">Project submitted successfully!</p>
              <p className="text-sm text-slate-400 mt-2">
                Your submission is being evaluated by our team.
              </p>
            </div>
            
            {/* Submission Details */}
            {submission && (
              <div className="space-y-3 mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Submission Details</h4>
                
                {submission.githubUrl && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-slate-400" />
                    <a 
                      href={submission.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 truncate"
                    >
                      {submission.githubUrl}
                    </a>
                  </div>
                )}
                
                {submission.files && submission.files.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileArchive className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {submission.files[0].filename}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <span className="text-xs text-slate-500">
                    Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    submission.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
                    submission.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300' :
                    submission.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
                
                {submission.feedback && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Feedback:</p>
                    <p className="text-sm text-slate-300">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                You cannot edit or resubmit your project. Contact support if you need assistance.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
