import React, { useState, useEffect } from 'react';

import { ChallengeHeader } from '../../components/challenge-header';
// import { ChallengeOverviewCard } from './components/challenge-overview-card';
import { RegistrationModal } from '../../components/registration-modal';
// import { UploadSection } from './components/upload-section';
// import { LiveStats } from './components/live-stats';
import { ScoringCriteria } from '../../components/scoring-criteria';
// import { WinnersSection } from './components/winners-section';
// import { AIMentor } from './components/ai-mentor';
import { DiscussionSection } from '../../components/discussion-section';
import { ChallengeOverviewCard } from '../../components/challenge-overview-card';
import { LiveStats } from '../../components/live-state';
import { TimelineTracker } from '../../components/timeline-tracker';
// import { ResourcesCard } from './components/resources-card';
// import { TimelineTracker } from './components/timeline-tracker';
import { Toaster } from '../../components/ui/sonner';
import { UploadSection } from '../../components/upload-section';
import { ResourcesCard } from '../../components/resources-card';
import { WinnersSection } from '../../components/winners-section';
import { useUser } from '../../context/UserContext';
import { authService } from '../../services/auth';

export default function WeeklyChallenge() {
  const { user } = useUser();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'solo' | 'team'>(
    'solo'
  );
  const [challenge, setChallenge] = useState<any>(null); // Add challenge state
  const [submission, setSubmission] = useState<any>(null); // Add submission state

  // Challenge deadline passed (set to false initially, true to show winners)
  const [challengeEnded, setChallengeEnded] = useState(false);

  // Check if user is registered for the current challenge
  useEffect(() => {
    const checkRegistration = async () => {
      if (!user || !challenge?._id) return;
      
      try {
        const token = authService.getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/challenges/${challenge._id}/check-registration`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        const data = await response.json();
        if (data.success) {
          setIsRegistered(data.isRegistered);
        }
      } catch (error) {
        // Error checking registration - assume not registered
      }
    };

    checkRegistration();
  }, [user, challenge]);

  // Fetch user's submission
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user || !challenge?._id) return;
      
      try {
        const token = authService.getToken();
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/challenges/${challenge._id}/my-submission`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setSubmission(data.data);
        }
      } catch (error) {
        console.error('❌ Submission fetch error:', error);
        // No submission found or error
        setSubmission(null);
      }
    };

    fetchSubmission();
  }, [user, challenge]);

  const handleJoinClick = () => {
    setRegistrationModalOpen(true);
  };

  const handleRegistrationSuccess = (mode: 'solo' | 'team') => {
    setIsRegistered(true);
    setRegistrationMode(mode);
    setRegistrationModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <Toaster />

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ChallengeHeader />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ChallengeOverviewCard
              isRegistered={isRegistered}
              onJoinClick={handleJoinClick}
              onChallengeLoaded={setChallenge} // Set challenge when loaded
            />

            {isRegistered && (
              <UploadSection registrationMode={registrationMode} challengeId={challenge?._id} />
            )}

            <ScoringCriteria />

            {challengeEnded && <WinnersSection />}

            <DiscussionSection challengeId={challenge?._id} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <LiveStats challengeId={challenge?._id} />
            {/* <AIMentor /> */}
            <ResourcesCard />
            <TimelineTracker isRegistered={isRegistered} challenge={challenge} submission={submission} />
          </div>
        </div>
      </div>

      <RegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        onSuccess={handleRegistrationSuccess}
        challengeId={challenge?._id} // Pass the challenge ID
      />
    </div>
  );
}
