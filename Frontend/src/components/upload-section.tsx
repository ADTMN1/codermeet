import React from 'react';

import { useState, useEffect } from 'react';
import {
  Upload,
  Github,
  FileArchive,
  Clock,
  CheckCircle,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

interface UploadSectionProps {
  registrationMode: 'solo' | 'team';
}

export function UploadSection({ registrationMode }: UploadSectionProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 34,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        }
        return prev;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl && !fileName) {
      toast.error('Please provide either a GitHub URL or upload a file');
      return;
    }
    setSubmitted(true);
    toast.success('Project submitted successfully!', {
      description: 'Your submission has been received and will be evaluated.',
    });
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

        {/* Submission Deadline Timer */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-red-400" />
            <span className="text-red-300">Submission Deadline</span>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl text-red-300">{timeLeft.days}</div>
              <div className="text-xs text-slate-400">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-red-300">{timeLeft.hours}</div>
              <div className="text-xs text-slate-400">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-red-300">{timeLeft.minutes}</div>
              <div className="text-xs text-slate-400">Minutes</div>
            </div>
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
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Submit Project
            </Button>
          </form>
        ) : (
          <div className="p-6 rounded-lg bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-green-300">Project submitted successfully!</p>
            <p className="text-sm text-slate-400 mt-2">
              Your submission is being evaluated by our team.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
