import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUser } from "../auth/useAuth";

interface RichTextContent {
  type: string;
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{
        type: string;
      }>;
    }>;
  }>;
}

interface CreateEventData {
  name: string;
  description: string;
  organizer: string;
  startDate: string;
  endDate: string;
  locationType: string;
  location?: {
    placeId?: string;
    description: string;
    mainText?: string;
    secondaryText?: string;
    locationAdditionalDetails?: string;
    latitude?: number;
    longitude?: number;
    isCustom?: boolean;
  };
  meetingLink?: string | null;
  coverImage?: string;
  capacity?: number | null;
  price?: number;
  priceType: string;
  visibility: string;
  requireApproval: boolean;
  websiteUrl?: string | null;
  contactPersons: Array<{
    name: string;
    email: string;
    phone?: string | null;
  }>;
}

interface EventResponse {
  id: number;
  eventId: string;
  name: string;
  description: RichTextContent;
  organizer: string;
  startDate: string;
  endDate: string;
  locationType: "VENUE" | "ONLINE";
  locationId: string;
  meetingLink: string | null;
  coverImage: string | null;
  capacity: number | null;
  price: number | null;
  priceType: "FREE" | "PAID";
  visibility: "PUBLIC" | "PRIVATE";
  requireApproval: boolean;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
  contactPersons: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  location: {
    id: string;
    placeId: string | null;
    description: string;
    mainText: string | null;
    secondaryText: string | null;
    locationAdditionalDetails: string | null;
    latitude: number | null;
    longitude: number | null;
    isCustom: boolean;
    createdAt: string;
    updatedAt: string;
  };
  team: Array<{
    id: string;
    role: "CREATOR" | "ADMIN";
    user: {
      id: string;
      email: string;
      fullName: string | null;
    };
  }>;
  spotsLeft: number | null;
}

interface UserEventRoleResponse {
  role: "CREATOR" | "ADMIN" | null;
}

interface EventRegistrationResponse {
  id: string;
  eventId: string;
  userId: string;
  isApproved: boolean;
  ticketCode: string | null;
  registrationDate: string;
  checkInDate: string | null;
  updatedAt: string;
  event: {
    requireApproval: boolean;
  };
}

interface RegistrationStatusResponse {
  isRegistered: boolean;
  registration: {
    id: string;
    isApproved: boolean;
    ticketId: string | null;
  } | null;
}

interface UserEventResponse {
  id: number;
  eventId: string;
  name: string;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  locationType: "VENUE" | "ONLINE";
  meetingLink: string | null;
  location: {
    mainText: string | null;
    secondaryText: string | null;
    locationAdditionalDetails: string | null;
  } | null;
  userRole: "CREATOR" | "ADMIN" | null;
  registration: {
    isApproved: boolean;
    ticketId: string | null;
  } | null;
  approvedAttendeesCount: number;
}

interface CheckInResponse {
  user: {
    fullName: string;
    email: string;
    profilePicture: string | null;
  };
  ticketCode: string | null;
  checkInDate: string;
}

interface CheckInHistoryResponse {
  id: string;
  checkInDate: string;
  user: {
    fullName: string;
    email: string;
  };
}

interface EventCountsResponse {
  name: string;
  eventId: string;
  totalAttendees: number;
  checkedInCount: number;
  locationType: "VENUE" | "ONLINE";
}

interface EventAttendeesResponse {
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    imageUrl?: string | null;
    dateAdded: string;
    checkInTime?: string | null;
    isApproved: boolean;
  }>;
  requiresApproval: boolean;
}

interface ApproveAttendeesResponse {
  attendees: Array<{
    id: string;
    isApproved: boolean;
    ticketCode: string | null;
    user: {
      fullName: string;
      email: string;
    };
  }>;
}

interface PublicEventsResponse {
  events: EventResponse[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

interface AddEventAttendeeResponse {
  message: string;
  attendee: {
    id: string;
    eventId: string;
    userId: string;
    isApproved: boolean;
    ticketCode: string | null;
    ticketId: string | null;
    registrationDate: string;
    checkInDate: string | null;
    updatedAt: string;
  };
}

export const useCreateEvent = () => {
  const createEventMutation = useMutation<
    EventResponse,
    Error,
    CreateEventData
  >({
    mutationFn: (data) => api.createEvent(data),
  });

  return {
    createEvent: createEventMutation,
  };
};

export const useEditEvent = (eventId: string) => {
  const editEventMutation = useMutation<EventResponse, Error, CreateEventData>({
    mutationFn: (data) => api.editEvent(eventId, data),
  });

  return {
    editEvent: editEventMutation,
    isEditing: editEventMutation.isPending,
    editError: editEventMutation.error,
  };
};

export const useGetEvent = (eventId: string) => {
  const getEventQuery = useQuery<EventResponse, Error, EventResponse>({
    queryKey: ["event", eventId],
    queryFn: () => api.getEvent(eventId),
    retry: false,
  });

  return {
    getEvent: getEventQuery,
  };
};

export const useGetPublicEvents = (page: number = 1) => {
  const getPublicEventsQuery = useQuery<
    PublicEventsResponse,
    Error,
    PublicEventsResponse
  >({
    queryKey: ["public-events", page],
    queryFn: () => api.getPublicEvents(page),
  });

  return {
    getPublicEvents: getPublicEventsQuery,
    events: getPublicEventsQuery.data?.events ?? [],
    pagination: getPublicEventsQuery.data?.pagination,
    isLoading: getPublicEventsQuery.isLoading,
  };
};

export const useEventRole = (eventId: string) => {
  const { data: userData } = useUser();

  const roleQuery = useQuery<UserEventRoleResponse, Error>({
    queryKey: ["event-role", eventId],
    queryFn: () => api.getUserEventRole(eventId),
    enabled: !!eventId && !!userData,
  });

  return {
    role: roleQuery.data?.role ?? null,
    isLoading: roleQuery.isPending,
    error: roleQuery.error,
  };
};

export const useRegisterForEvent = (eventId: string) => {
  const { data: userData } = useUser();

  const registerForEventMutation = useMutation<
    EventRegistrationResponse,
    Error,
    void
  >({
    mutationFn: () => api.registerUserForEvent(eventId),
    // Only allow registration if user is logged in
    onMutate: () => {
      if (!userData) {
        throw new Error("You must be logged in to register for events");
      }
    },
    // Add custom error handling for specific error messages
    onError: (error) => {
      if (error.message === "You are already registered for this event") {
        // You could handle this specific error differently if needed
        console.warn(
          "User attempted to register for an event they're already registered for"
        );
      }
      // Let the error propagate to the component for handling
    },
  });

  return {
    registerForEvent: registerForEventMutation,
    isRegistering: registerForEventMutation.isPending,
    registrationError: registerForEventMutation.error,
    registrationData: registerForEventMutation.data,
    isAlreadyRegistered:
      registerForEventMutation.error?.message ===
      "You are already registered for this event",
  };
};

export const useRegistrationStatus = (eventId: string) => {
  const { data: userData } = useUser();

  const registrationStatusQuery = useQuery<
    RegistrationStatusResponse,
    Error,
    RegistrationStatusResponse
  >({
    queryKey: ["registration-status", eventId],
    queryFn: () => api.getRegistrationStatus(eventId),
    enabled: !!eventId && !!userData,
  });

  return {
    registrationStatus: registrationStatusQuery,
    isRegistered: registrationStatusQuery.data?.isRegistered ?? false,
    registration: registrationStatusQuery.data?.registration ?? null,
  };
};

export const useGetUserEvents = () => {
  const { data: userData } = useUser();

  const getUserEventsQuery = useQuery<UserEventResponse[], Error>({
    queryKey: ["user-events"],
    queryFn: () => api.getUserEvents(),
    enabled: !!userData, // Only fetch if user is logged in
  });

  return {
    getUserEvents: getUserEventsQuery,
    events: getUserEventsQuery.data ?? [],
    isLoading: getUserEventsQuery.isLoading,
    error: getUserEventsQuery.error,
  };
};

export const useCheckInAttendee = (eventId: string) => {
  const queryClient = useQueryClient();

  const checkInMutation = useMutation<
    CheckInResponse,
    Error,
    {
      ticketCode?: string;
      email?: string;
      attendeeId?: string;
    }
  >({
    mutationFn: (data) => api.checkInAttendee(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-check-ins", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-counts", eventId] });
    },
  });

  return {
    checkInAttendee: checkInMutation.mutateAsync,
    isCheckingIn: checkInMutation.isPending,
    reset: checkInMutation.reset,
  };
};

export const useEventCheckIns = (eventId: string) => {
  const checkInsQuery = useQuery<CheckInHistoryResponse[], Error>({
    queryKey: ["event-check-ins", eventId],
    queryFn: () => api.getEventCheckIns(eventId),
  });

  return {
    checkIns: checkInsQuery.data ?? [],
    isLoading: checkInsQuery.isLoading,
    error: checkInsQuery.error,
    refetch: checkInsQuery.refetch,
  };
};

export const useEventCounts = (eventId: string) => {
  const countsQuery = useQuery<EventCountsResponse, Error>({
    queryKey: ["event-counts", eventId],
    queryFn: () => api.getEventWithCounts(eventId),
  });

  return {
    eventName: countsQuery.data?.name,
    eventId: countsQuery.data?.eventId,
    totalAttendees: countsQuery.data?.totalAttendees ?? 0,
    checkedInCount: countsQuery.data?.checkedInCount ?? 0,
    isLoading: countsQuery.isLoading,
    error: countsQuery.error,
    locationType: countsQuery.data?.locationType,
    refetch: countsQuery.refetch,
  };
};

export const useEventAttendees = (eventId: string) => {
  const attendeesQuery = useQuery<EventAttendeesResponse, Error>({
    queryKey: ["event-attendees", eventId],
    queryFn: () => api.getEventAttendees(eventId),
  });

  return {
    attendees: attendeesQuery.data?.attendees ?? [],
    requiresApproval: attendeesQuery.data?.requiresApproval ?? false,
    isLoading: attendeesQuery.isLoading,
    error: attendeesQuery.error,
  };
};

export const useUncheckInAttendee = (eventId: string) => {
  const uncheckInMutation = useMutation<
    CheckInResponse,
    Error,
    { ticketCode: string }
  >({
    mutationFn: (data) => api.uncheckInAttendee(eventId, data),
  });

  return {
    uncheckInAttendee: uncheckInMutation.mutateAsync,
    isUncheckingIn: uncheckInMutation.isPending,
    uncheckInError: uncheckInMutation.error,
    reset: uncheckInMutation.reset,
  };
};

export const useSearchEvents = (query: string, page: number = 1) => {
  const searchEventsQuery = useQuery<
    PublicEventsResponse,
    Error,
    PublicEventsResponse
  >({
    queryKey: ["search-events", query, page],
    queryFn: () => api.searchEvents(query, page),
    enabled: query.length >= 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    searchEvents: searchEventsQuery,
    events: searchEventsQuery.data?.events ?? [],
    pagination: searchEventsQuery.data?.pagination,
    isLoading: searchEventsQuery.isLoading,
  };
};

export const useApproveEventAttendees = (eventId: string) => {
  const queryClient = useQueryClient();

  const approveAttendeesMutation = useMutation<
    ApproveAttendeesResponse,
    Error,
    string[]
  >({
    mutationFn: (attendeeIds) => api.approveEventAttendees(eventId, attendeeIds),
    onSuccess: () => {
      // Invalidate the event attendees query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
    },
  });

  return {
    approveAttendees: approveAttendeesMutation.mutateAsync,
    isApproving: approveAttendeesMutation.isPending,
    approvalError: approveAttendeesMutation.error,
  };
};

export const useRemoveEventAttendees = (eventId: string) => {
  const queryClient = useQueryClient();

  const { mutate: removeAttendees, isPending: isRemoving } = useMutation({
    mutationFn: async (attendeeIds: string[]) => {
      return api.removeEventAttendees(eventId, attendeeIds);
    },
    onSuccess: () => {
      // Invalidate and refetch the attendees list
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
      // Also invalidate event counts since total attendees will change
      queryClient.invalidateQueries({ queryKey: ["event-counts", eventId] });
    },
  });

  return {
    removeAttendees,
    isRemoving,
  };
};

export const useAddEventAttendee = (eventId: string) => {
  const queryClient = useQueryClient();

  const addAttendeeMutation = useMutation<
    AddEventAttendeeResponse,
    Error,
    { userId: string }
  >({
    mutationFn: ({ userId }) => api.addEventAttendee(eventId, userId),
    onSuccess: () => {
      // Invalidate the event attendees query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
    },
  });

  return {
    addAttendee: addAttendeeMutation.mutateAsync,
    isAdding: addAttendeeMutation.isPending,
    error: addAttendeeMutation.error,
  };
};
