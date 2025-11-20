import React from 'react';

import { useState } from 'react';
import { User, Users, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
// import { Label } from './ui/label';
import { toast } from 'sonner';
import { Label } from './ui/label';

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (mode: 'solo' | 'team') => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function RegistrationModal({
  open,
  onOpenChange,
  onSuccess,
}: RegistrationModalProps) {
  const [mode, setMode] = useState<'solo' | 'team'>('solo');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: '', email: '', role: '' },
  ]);

  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { id: Date.now().toString(), name: '', email: '', role: '' },
    ]);
  };

  const removeTeamMember = (id: string) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter((m) => m.id !== id));
    }
  };

  const updateTeamMember = (
    id: string,
    field: keyof TeamMember,
    value: string
  ) => {
    setTeamMembers(
      teamMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (mode === 'team') {
      const hasEmptyFields = teamMembers.some(
        (m) => !m.name || !m.email || !m.role
      );
      if (hasEmptyFields) {
        toast.error('Please fill in all team member details');
        return;
      }
    }

    toast.success('Registration successful!', {
      description:
        mode === 'solo'
          ? 'Good luck with the challenge!'
          : `Team registered with ${teamMembers.length} members!`,
    });

    onSuccess(mode);

    // Reset form
    setMode('solo');
    setTeamMembers([{ id: '1', name: '', email: '', role: '' }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-purple-500/30 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Join Weekly Challenge
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your participation mode and register for the challenge
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            {/* <Label>Participation Mode</Label> */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('solo')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  mode === 'solo'
                    ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <User
                  className={`w-8 h-8 mx-auto mb-2 ${mode === 'solo' ? 'text-purple-400' : 'text-slate-400'}`}
                />
                <div
                  className={
                    mode === 'solo' ? 'text-purple-300' : 'text-slate-300'
                  }
                >
                  Solo
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Compete individually
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('team')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  mode === 'team'
                    ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Users
                  className={`w-8 h-8 mx-auto mb-2 ${mode === 'team' ? 'text-blue-400' : 'text-slate-400'}`}
                />
                <div
                  className={
                    mode === 'team' ? 'text-blue-300' : 'text-slate-300'
                  }
                >
                  Team
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Collaborate with others
                </div>
              </button>
            </div>
          </div>

          {/* Team Members Section */}
          {mode === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Team Members</Label>
                <Button
                  type="button"
                  onClick={addTeamMember}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        Member {index + 1}
                      </span>
                      {teamMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(member.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Name</Label>
                        <Input
                          value={member.name}
                          onChange={(e) =>
                            updateTeamMember(member.id, 'name', e.target.value)
                          }
                          placeholder="John Doe"
                          className="bg-slate-900 border-slate-700 text-slate-100"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Email</Label>
                        <Input
                          type="email"
                          value={member.email}
                          onChange={(e) =>
                            updateTeamMember(member.id, 'email', e.target.value)
                          }
                          placeholder="john@example.com"
                          className="bg-slate-900 border-slate-700 text-slate-100"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Role</Label>
                        <Input
                          value={member.role}
                          onChange={(e) =>
                            updateTeamMember(member.id, 'role', e.target.value)
                          }
                          placeholder="Frontend Dev"
                          className="bg-slate-900 border-slate-700 text-slate-100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
            >
              Confirm Registration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
