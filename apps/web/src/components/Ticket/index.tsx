"use client";

import React, { useRef, useEffect } from "react";
import { DownloadIcon, PrinterIcon } from "lucide-react";
import * as htmlToImage from "html-to-image";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { useGetTicket } from "@/hooks/ticket/useTicket";
import { notFound } from "next/navigation";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short", // Mon
    day: "numeric", // 23
    month: "short", // Dec
    hour: "numeric", // 11
    hour12: true, // AM/PM
  });
};

const Ticket = ({ ticketId }: { ticketId: string }) => {
  const { getTicket } = useGetTicket(ticketId);
  const { data: ticketData, isLoading: isTicketLoading, error } = getTicket;

  const ticketRef = useRef<HTMLDivElement>(null);

  const downloadTicket = async () => {
    if (ticketRef.current === null) return;

    try {
      const dataUrl = await htmlToImage.toPng(ticketRef.current, {
        quality: 1,
        backgroundColor: "white",
      });

      const link = document.createElement("a");
      link.download = `${ticketData!.user.fullName} - ${
        ticketData!.event.name
      } ticket.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Error downloading ticket");
    }
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #ticket-to-print,
        #ticket-to-print * {
          visibility: visible;
        }
        #ticket-to-print {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 2rem;
        }
        .no-print {
          display: none !important;
        }
        .ticket-gradient-text {
          background: none !important;
          -webkit-text-fill-color: initial !important;
          color: #3b82f6 !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (isTicketLoading) {
    return (
      <div className="relative max-w-[340px] mx-auto flex flex-col items-center justify-center sm:pt-4">
        <div className="relative bg-white rounded-xl p-10 shadow-md w-full">
          <div className="space-y-4">
            {/* Event Title */}
            <div className="text-center">
              <Skeleton className="h-8 w-48 mx-auto" />
            </div>

            {/* Date and Location */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 mx-auto" />
              <Skeleton className="h-4 w-56 mx-auto" />
            </div>

            {/* QR Code */}
            <div className="flex justify-center py-4">
              <Skeleton className="size-64 rounded-lg bg-gray-100" />
            </div>

            {/* Ticket Details */}
            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-4 flex gap-3">
          <Skeleton className="h-10 w-full lg:w-2/3" />
          <Skeleton className="h-10 w-1/3 hidden lg:block" />
        </div>
      </div>
    );
  }

  if (error || !ticketData) {
    notFound();
  }

  return (
    <div className="relative max-w-[340px] mx-auto flex flex-col items-center justify-center sm:pt-4 pb-12">
      <div
        ref={ticketRef}
        id="ticket-to-print"
        className="relative bg-white rounded-xl p-7 shadow-md w-full"
      >
        <div className="space-y-4">
          {/* Event Title */}
          <Link href={`/e/${ticketData.event.eventId}`}>
            <h2 className="text-center text-3xl font-semibold tracking-tight ticket-gradient-text">
              {ticketData.event.name}
            </h2>
          </Link>

          {/* Date and Location */}
          <div className="space-y-1 text-gray-600 text-center">
            <p className="text-sm">
              {formatDate(ticketData.event.startDate)} -{" "}
              {formatDate(ticketData.event.endDate)}
            </p>
            <p className="text-sm font-semibold">
              {ticketData.event.location?.mainText}
            </p>
          </div>

          {/* QR Code placeholder */}
          <div className="flex justify-center py-4">
            <div className="size-50 rounded-lg">
              <Image
                draggable={false}
                src={`https://generate-qr.atyam.workers.dev/api/v1/${ticketData.ticketCode}`}
                alt="QR Code"
                width={230}
                height={230}
                unoptimized={true}
              />
            </div>
          </div>

          {/* Ticket Logo */}
          <div className="space-y-4 pt-4 border-t border-dashed border-gray-300/90 ">
            <div>
              <p className="text-sm font-medium">Attendee</p>
              <p className="text-sm text-gray-600 break-all">
                {ticketData.user.fullName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-gray-600 break-all">
                {ticketData.user.email}
              </p>
            </div>
            <div className="flex justify-center pt-4 border-t border-dashed border-gray-300/90">
              <Image
                className="opacity-35"
                src="/Xeno.svg"
                alt="Ticket Background"
                draggable={false}
                width={85}
                height={120}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-4 flex gap-3 no-print">
        <Button
          className="w-full lg:w-2/3 font-bold rounded-lg"
          onClick={downloadTicket}
        >
          <DownloadIcon className="size-4 mr-2" />
          Download Ticket
        </Button>
        <Button
          variant="outline"
          className="hidden lg:flex w-1/3 font-bold rounded-lg"
          onClick={() => window.print()}
        >
          <PrinterIcon className="size-4 mr-2" />
          Print
        </Button>
      </div>
    </div>
  );
};

export default Ticket;
