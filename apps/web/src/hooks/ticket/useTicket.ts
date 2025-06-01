import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface TicketResponse {
  ticketCode: string;
  event: EventResponse;
  user: UserResponse;
}

interface EventResponse {
  eventId: string;
  name: string;
  startDate: string;
  endDate: string;
  location: LocationResponse;
}

interface UserResponse {
  fullName: string;
  email: string;
}

interface LocationResponse {
  mainText: string;
}

export const useGetTicket = (ticketId: string) => {
  const getTicketQuery = useQuery<TicketResponse, Error, TicketResponse>({
    queryKey: ["ticket", ticketId],
    queryFn: () => api.getTicket(ticketId),
    retry: false,
  });

  return {
    getTicket: getTicketQuery,
  };
};
