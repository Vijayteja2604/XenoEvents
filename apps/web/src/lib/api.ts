const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const api = {
  // Auth
  signin: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/signin`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }
    return res.json();
  },

  signup: async (data: {
    email: string;
    password: string;
    phoneNumber: string;
    fullName: string;
  }) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }
    return res.json();
  },

  signout: async () => {
    const res = await fetch(`${API_URL}/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }
    return res.json();
  },

  getUser: async () => {
    const res = await fetch(`${API_URL}/auth/user`, {
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }
    return res.json();
  },

  verifySession: async () => {
    const res = await fetch(`${API_URL}/auth/verify-session`, {
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }
    return res.json();
  },

  signInWithGoogle: async () => {
    window.location.href = `${API_URL}/auth/google`;
  },

  // User
  editAccount: async (data: {
    fullName: string;
    phoneNumber?: string | null;
    profilePicture?: string | null;
  }) => {
    const res = await fetch(`${API_URL}/user/edit`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to edit account");
    }
    return res.json();
  },

  deleteAccount: async () => {
    const res = await fetch(`${API_URL}/user/delete`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete account");
    }

    return res.json();
  },

  // Events
  createEvent: async (eventData: {
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
  }) => {
    const res = await fetch(`${API_URL}/event/create`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create event");
    }

    return res.json();
  },

  editEvent: async (
    eventId: string,
    eventData: {
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
  ) => {
    const res = await fetch(`${API_URL}/event/${eventId}/edit`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update event");
    }

    return res.json();
  },

  getEvent: async (eventId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to get event");
    }

    return res.json();
  },

  getPublicEvents: async (page: number = 1) => {
    const res = await fetch(`${API_URL}/event/events?page=${page}&limit=10`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch events");
    }

    return res.json();
  },

  getUserEventRole: async (eventId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/userRole`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to get user's event role");
    }

    return res.json();
  },

  registerUserForEvent: async (eventId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      // Handle specific error cases
      if (error.message === "Event has reached maximum capacity") {
        throw new Error("EVENT_FULL");
      }
      throw new Error(error.message || "Failed to register for event");
    }

    return res.json();
  },

  getRegistrationStatus: async (eventId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/registration-status`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to get registration status");
    }

    return res.json();
  },

  getUserEvents: async () => {
    const res = await fetch(`${API_URL}/event/user-events`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch user's events");
    }

    return res.json();
  },

  getTicket: async (ticketId: string) => {
    const res = await fetch(`${API_URL}/ticket/${ticketId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to get ticket");
    }

    return res.json();
  },

  // Settings API Methods
  getEventTeam: async (eventId: string) => {
    const res = await fetch(`${API_URL}/settings/${eventId}/more`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch event team");
    }

    return res.json();
  },

  addEventAdmin: async (eventId: string, userId: string) => {
    const res = await fetch(`${API_URL}/settings/${eventId}/more/addAdmin`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to add admin");
    }

    return res.json();
  },

  removeEventAdmin: async (eventId: string, userId: string) => {
    const res = await fetch(`${API_URL}/settings/${eventId}/more/removeAdmin`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to remove admin");
    }

    return res.json();
  },

  deleteEvent: async (eventId: string) => {
    const res = await fetch(`${API_URL}/settings/${eventId}/more/deleteEvent`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete event");
    }

    return res.json();
  },

  searchUsers: async (email: string) => {
    const res = await fetch(
      `${API_URL}/user/search?email=${encodeURIComponent(
        email
      )}&t=${Date.now()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to search users");
    }

    return res.json();
  },

  getEventOverview: async (eventId: string) => {
    const res = await fetch(`${API_URL}/settings/${eventId}/overview`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch event overview");
    }

    return res.json();
  },

  checkInAttendee: async (
    eventId: string,
    data: {
      ticketCode?: string;
      email?: string;
      attendeeId?: string;
    }
  ) => {
    const res = await fetch(`${API_URL}/event/${eventId}/check-in`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to check in attendee");
    }

    return res.json();
  },

  verifyTicket: async (ticketCode: string) => {
    const res = await fetch(`${API_URL}/ticket/verify/${ticketCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to verify ticket");
    }

    if (!data.valid) {
      throw new Error(data.message || "Invalid ticket");
    }

    return data;
  },

  getEventCheckIns: async (eventId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/check-ins`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch check-ins");
    }

    return res.json();
  },

  uncheckInAttendee: async (eventId: string, data: { ticketCode: string }) => {
    const res = await fetch(`${API_URL}/event/${eventId}/uncheck-in`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to uncheck in attendee");
    }

    return res.json();
  },

  getEventWithCounts: async (eventId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/counts`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch event counts");
    }

    return res.json();
  },

  getEventAttendees: async (eventId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/attendees`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch attendees");
    }

    return res.json();
  },

  uploadEventImage: async (formData: FormData) => {
    const response = await fetch(`${API_URL}/event/upload-image`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    return response.json();
  },

  uploadProfilePicture: async (formData: FormData) => {
    const response = await fetch(`${API_URL}/user/upload-profile-picture`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload profile picture");
    }

    return response.json();
  },

  searchEvents: async (query: string, page: number = 1) => {
    const res = await fetch(
      `${API_URL}/event/search?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=10`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to search events");
    }

    return res.json();
  },

  approveEventAttendees: async (eventId: string, attendeeIds: string[]) => {
    const res = await fetch(`${API_URL}/event/${eventId}/approve-attendees`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attendeeIds }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to approve attendees");
    }

    return res.json();
  },

  getAttendeeTicket: async (eventId: string, attendeeId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/attendee/${attendeeId}/ticket`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to get attendee ticket");
    }

    return res.json();
  },

  removeEventAttendees: async (eventId: string, attendeeIds: string[]) => {
    const res = await fetch(`${API_URL}/event/${eventId}/remove-attendees`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attendeeIds }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to remove attendees");
    }

    return res.json();
  },

  addEventAttendee: async (eventId: string, userId: string) => {
    const res = await fetch(`${API_URL}/event/${eventId}/attendees/add`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to add attendee");
    }

    return res.json();
  },
};
