import React, { useEffect, useState } from 'react';
import { FaBriefcase, FaMapMarkerAlt } from 'react-icons/fa';
import jobService from '../../services/jobs';
import { authService } from '../../services/auth';

interface Job {
  _id: string;
  title: string;
  company: string;
  location?: string;
  employmentType?: string;
  description?: string;
  postedBy?: any;
  applicants?: Array<{
    user: string | { _id: string };
    status: string;
    appliedAt: string;
  }>;
}

const JobTab: React.FC<{ onApplied?: () => void }> = ({ onApplied }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchJobs();
    getCurrentUserId();
  }, []);

  const getCurrentUserId = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId || payload.id || '');
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  };

  const hasUserApplied = (job: Job): boolean => {
    if (!currentUserId || !job.applicants) return false;
    return job.applicants.some(applicant => {
      const userId = typeof applicant.user === 'string' ? applicant.user : applicant.user._id;
      return userId === currentUserId;
    });
  };

  const getApplicationStatus = (job: Job): string => {
    if (!currentUserId || !job.applicants) return '';
    const application = job.applicants.find(applicant => {
      const userId = typeof applicant.user === 'string' ? applicant.user : applicant.user._id;
      return userId === currentUserId;
    });
    return application?.status || '';
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await jobService.getJobs({ page, limit: 12 });
      // API returns { data, total, page, limit } or array fallback
      if (res?.data) setJobs(res.data);
      else if (Array.isArray(res)) setJobs(res);
      else setJobs([]);
    } catch (err) {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!authService.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    // Find the job to check if already applied
    const job = jobs.find(j => j._id === jobId);
    if (hasUserApplied(job!)) {
      alert('You have already applied for this job');
      return;
    }

    try {
      await jobService.applyToJob(jobId, { resumeUrl: '' });
      if (onApplied) onApplied();
      alert('Application submitted');
      // Refresh jobs to update the application status
      fetchJobs();
    } catch (err: any) {
      alert(err?.message || 'Failed to apply');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FaBriefcase className="w-6 h-6 text-purple-400" />
          Job Opportunities
        </h2>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading jobs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.length === 0 && <div className="text-gray-400">No jobs found.</div>}
          {jobs.map((job) => (
            <div key={job._id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                  <p className="text-sm text-gray-400">{job.company}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                    {job.location && (
                      <span className="flex items-center gap-1"><FaMapMarkerAlt className="w-3 h-3" />{job.location}</span>
                    )}
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">{job.employmentType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasUserApplied(job) ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg text-sm cursor-not-allowed">
                        Applied
                      </span>
                      <span className="text-xs text-gray-400">
                        {getApplicationStatus(job) && `Status: ${getApplicationStatus(job)}`}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(job._id)}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
              {job.description && (
                <p className="text-sm text-gray-300 mt-3 line-clamp-3">{job.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobTab;
