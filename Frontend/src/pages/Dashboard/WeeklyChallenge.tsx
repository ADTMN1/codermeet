import React from 'react';

import { useState } from 'react';
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

export default function WeeklyChallenge() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'solo' | 'team'>(
    'solo'
  );

  // Challenge deadline passed (set to false initially, true to show winners)
  const [challengeEnded, setChallengeEnded] = useState(false);

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
            />

            {isRegistered && (
              <UploadSection registrationMode={registrationMode} />
            )}

            <ScoringCriteria />

            {challengeEnded && <WinnersSection />}

            <DiscussionSection />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <LiveStats />
            {/* <AIMentor /> */}
            <ResourcesCard />
            <TimelineTracker isRegistered={isRegistered} />
          </div>
        </div>
      </div>

      <RegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
