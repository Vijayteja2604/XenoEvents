import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "../auth/useAuth";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "creator" | "admin";
}

interface EventOverview {
  eventId: string;
  name: string;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  locationType: "ONLINE" | "VENUE";
  meetingLink: string | null;
  location: {
    mainText: string | null;
    secondaryText: string | null;
    locationAdditionalDetails: string | null;
  } | null;
}

export const useEventTeam = (eventId: string) => {
  const { data: userData } = useUser();

  const eventTeamQuery = useQuery<TeamMember[], Error>({
    queryKey: ["event-team", eventId],
    queryFn: () => api.getEventTeam(eventId),
    enabled: !!eventId && !!userData, // Only fetch if we have eventId and user is logged in
  });

  return {
    eventTeam: eventTeamQuery.data ?? [],
    isLoading: eventTeamQuery.isLoading,
    error: eventTeamQuery.error,
  };
};

export const useAddAdmin = (eventId: string) => {
  const queryClient = useQueryClient();

  const addAdminMutation = useMutation<TeamMember, Error, string>({
    mutationFn: (userId: string) => api.addEventAdmin(eventId, userId),
    onSuccess: () => {
      // Invalidate and refetch event team data
      queryClient.invalidateQueries({ queryKey: ["event-team", eventId] });
    },
  });

  return {
    addAdmin: addAdminMutation.mutateAsync,
    isAdding: addAdminMutation.isPending,
    error: addAdminMutation.error,
  };
};

export const useRemoveAdmin = (eventId: string) => {
  const queryClient = useQueryClient();

  const removeAdminMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => api.removeEventAdmin(eventId, userId),
    onSuccess: () => {
      // Invalidate and refetch event team data
      queryClient.invalidateQueries({ queryKey: ["event-team", eventId] });
    },
  });

  return {
    removeAdmin: removeAdminMutation.mutateAsync,
    isRemoving: removeAdminMutation.isPending,
    error: removeAdminMutation.error,
  };
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  const deleteEventMutation = useMutation<void, Error, string>({
    mutationFn: (eventId: string) => api.deleteEvent(eventId),
    onSuccess: () => {
      // Invalidate user's events list after deletion
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
    },
  });

  return {
    deleteEvent: deleteEventMutation.mutateAsync,
    isDeleting: deleteEventMutation.isPending,
    error: deleteEventMutation.error,
  };
};

export const useEventOverview = (eventId: string) => {
  const { data: userData } = useUser();

  const eventOverviewQuery = useQuery<EventOverview, Error>({
    queryKey: ["event-overview", eventId],
    queryFn: () => api.getEventOverview(eventId),
    enabled: !!eventId && !!userData, // Only fetch if we have eventId and user is logged in
  });

  return {
    data: eventOverviewQuery.data,
    isLoading: eventOverviewQuery.isLoading,
    error: eventOverviewQuery.error,
  };
};
