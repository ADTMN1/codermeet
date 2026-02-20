import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { challengeService, Challenge, ChallengeStats } from '../services/challengeService';
import { toast } from 'sonner';

// Query keys for consistency
export const challengeKeys = {
  all: ['challenges'] as const,
  lists: () => [...challengeKeys.all, 'list'] as const,
  list: (filters: any) => [...challengeKeys.lists(), filters] as const,
  details: () => [...challengeKeys.all, 'detail'] as const,
  detail: (id: string) => [...challengeKeys.details(), id] as const,
  stats: () => [...challengeKeys.all, 'stats'] as const,
};

// Hook for fetching all challenges
export const useChallenges = (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  difficulty?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: challengeKeys.list(filters || {}),
    queryFn: () => challengeService.getAllChallenges(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
};

// Hook for fetching challenge stats
export const useChallengeStats = () => {
  return useQuery({
    queryKey: challengeKeys.stats(),
    queryFn: () => challengeService.getChallengeStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching single challenge
export const useChallenge = (id: string, options?: UseQueryOptions<Challenge>) => {
  return useQuery({
    queryKey: challengeKeys.detail(id),
    queryFn: () => challengeService.getChallengeById(id),
    enabled: !!id,
    ...options,
  });
};

// Hook for creating challenges with optimistic updates
export const useCreateChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: challengeService.createChallenge,
    onMutate: async (newChallenge) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: challengeKeys.lists() });
      await queryClient.cancelQueries({ queryKey: challengeKeys.stats() });

      // Snapshot the previous value
      const previousChallenges = queryClient.getQueryData(challengeKeys.list({}));
      const previousStats = queryClient.getQueryData(challengeKeys.stats());

      // Optimistically update challenges
      queryClient.setQueryData(challengeKeys.list({}), (old: any) => {
        if (!old?.data?.challenges) return old;
        return {
          ...old,
          data: {
            ...old.data,
            challenges: [newChallenge, ...old.data.challenges],
            pagination: {
              ...old.data.pagination,
              total: old.data.pagination.total + 1
            }
          }
        };
      });

      // Optimistically update stats
      queryClient.setQueryData(challengeKeys.stats(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          totalGenerated: (old.totalGenerated || 0) + 1,
          overview: old.overview ? {
            ...old.overview,
            totalChallenges: old.overview.totalChallenges + 1,
            draftChallenges: old.overview.draftChallenges + 1
          } : undefined
        };
      });

      return { previousChallenges, previousStats };
    },
    onError: (err, newChallenge, context) => {
      // Rollback on error
      if (context?.previousChallenges) {
        queryClient.setQueryData(challengeKeys.list({}), context.previousChallenges);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(challengeKeys.stats(), context.previousStats);
      }
      toast.error('Failed to create challenge');
    },
    onSuccess: () => {
      toast.success('Challenge created successfully');
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: challengeKeys.stats() });
    },
  });
};

// Hook for updating challenges with optimistic updates
export const useUpdateChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Challenge> }) =>
      challengeService.updateChallenge(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: challengeKeys.lists() });
      await queryClient.cancelQueries({ queryKey: challengeKeys.detail(id) });

      // Snapshot the previous value
      const previousChallenges = queryClient.getQueryData(challengeKeys.list({}));
      const previousChallenge = queryClient.getQueryData(challengeKeys.detail(id));

      // Optimistically update challenges list
      queryClient.setQueryData(challengeKeys.list({}), (old: any) => {
        if (!old?.data?.challenges) return old;
        return {
          ...old,
          data: {
            ...old.data,
            challenges: old.data.challenges.map((challenge: Challenge) =>
              challenge._id === id ? { ...challenge, ...data } : challenge
            )
          }
        };
      });

      // Optimistically update single challenge
      queryClient.setQueryData(challengeKeys.detail(id), (old: Challenge) => {
        return old ? { ...old, ...data } : old;
      });

      return { previousChallenges, previousChallenge };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousChallenges) {
        queryClient.setQueryData(challengeKeys.list({}), context.previousChallenges);
      }
      if (context?.previousChallenge) {
        queryClient.setQueryData(challengeKeys.detail(variables.id), context.previousChallenge);
      }
      toast.error('Failed to update challenge');
    },
    onSuccess: () => {
      toast.success('Challenge updated successfully');
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(id) });
    },
  });
};

// Hook for deleting challenges with optimistic updates
export const useDeleteChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: challengeService.deleteChallenge,
    onMutate: async (challengeId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: challengeKeys.lists() });
      await queryClient.cancelQueries({ queryKey: challengeKeys.stats() });

      // Snapshot the previous value
      const previousChallenges = queryClient.getQueryData(challengeKeys.list({}));
      const previousStats = queryClient.getQueryData(challengeKeys.stats());

      // Optimistically remove from challenges list
      queryClient.setQueryData(challengeKeys.list({}), (old: any) => {
        if (!old?.data?.challenges) return old;
        return {
          ...old,
          data: {
            ...old.data,
            challenges: old.data.challenges.filter((challenge: Challenge) => challenge._id !== challengeId),
            pagination: {
              ...old.data.pagination,
              total: old.data.pagination.total - 1
            }
          }
        };
      });

      // Optimistically update stats
      queryClient.setQueryData(challengeKeys.stats(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          totalGenerated: Math.max(0, (old.totalGenerated || 0) - 1),
          overview: old.overview ? {
            ...old.overview,
            totalChallenges: Math.max(0, old.overview.totalChallenges - 1)
          } : undefined
        };
      });

      return { previousChallenges, previousStats };
    },
    onError: (err, challengeId, context) => {
      // Rollback on error
      if (context?.previousChallenges) {
        queryClient.setQueryData(challengeKeys.list({}), context.previousChallenges);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(challengeKeys.stats(), context.previousStats);
      }
      toast.error('Failed to delete challenge');
    },
    onSuccess: () => {
      toast.success('Challenge deleted successfully');
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: challengeKeys.stats() });
    },
  });
};

// Hook for getting challenge submissions
export const useChallengeSubmissions = (challengeId: string, params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['challengeSubmissions', challengeId, params],
    queryFn: () => challengeService.getChallengeSubmissions(challengeId, params),
    enabled: !!challengeId,
  });
};

// Hook for reviewing submissions
export const useReviewSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, submissionId, reviewData }: {
      challengeId: string;
      submissionId: string;
      reviewData: { status: string; score: number; feedback: string };
    }) => challengeService.reviewSubmission(challengeId, submissionId, reviewData),
    onSuccess: () => {
      toast.success('Submission reviewed successfully');
    },
    onSettled: (_, __, { challengeId }) => {
      // Refetch challenge data and submissions
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      queryClient.invalidateQueries({ queryKey: ['challengeSubmissions', challengeId] });
    },
  });
};

// Hook for daily challenges stats (AI-generated only)
export const useDailyChallengeStats = () => {
  return useQuery({
    queryKey: ['dailyChallengeStats'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/daily-challenge/admin-stats`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch daily challenge stats');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching all daily challenges
export const useDailyChallenges = (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  difficulty?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['dailyChallenges', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/daily-challenge/all?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch daily challenges');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
