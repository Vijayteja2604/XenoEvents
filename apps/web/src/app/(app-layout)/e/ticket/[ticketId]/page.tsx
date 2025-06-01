import Ticket from "@/components/Ticket";

const TicketPage = ({ params }: { params: { ticketId: string } }) => {
  return <Ticket ticketId={params.ticketId} />;
};

export default TicketPage;
