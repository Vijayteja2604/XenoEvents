/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo } from "react";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import {
  CalendarIcon,
  MapPinIcon,
  PresentationIcon,
  SearchIcon,
  CalendarDaysIcon,
  PlusIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useGetPublicEvents, useSearchEvents } from "@/hooks/event/useEvent";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Create a debounced function to update the search query
  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value);
        setCurrentPage(1); // Reset to first page on new search
      }, 800),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetQuery(value);
  };

  // Use search results when there's a query, otherwise use regular public events
  const {
    events: searchResults,
    pagination: searchPagination,
    isLoading: isSearching,
  } = useSearchEvents(debouncedQuery, currentPage);

  const {
    events: publicEvents,
    pagination: publicPagination,
    isLoading: isLoadingEvents,
  } = useGetPublicEvents(currentPage);

  const events = debouncedQuery ? searchResults : publicEvents;
  const pagination = debouncedQuery ? searchPagination : publicPagination;
  const isLoading = debouncedQuery ? isSearching : isLoadingEvents;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPaginationItems = () => {
    if (!pagination) return null;
    const { pages: totalPages } = pagination;

    // Always show first page, last page, current page, and one page before and after current
    const showPages = new Set([
      1, // First page
      totalPages, // Last page
      currentPage, // Current page
      currentPage - 1, // One before current
      currentPage + 1, // One after current
    ]);

    const items = [];
    let lastShownPage = 0;

    for (let page = 1; page <= totalPages; page++) {
      if (showPages.has(page)) {
        // Add ellipsis if there's a gap
        if (page - lastShownPage > 1) {
          items.push(
            <PaginationItem key={`ellipsis-${page}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        }

        // Add the page number
        items.push(
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(page);
              }}
              isActive={currentPage === page}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        );

        lastShownPage = page;
      }
    }

    return items;
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Explore Events
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-10 pl-12 pr-4 rounded-full bg-white shadow-sm border-0 text-base placeholder:text-gray-400 placeholder:text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 pt-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : events && events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-gray-50/80 p-14 rounded-full">
              <CalendarDaysIcon className="size-40 text-gray-300" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">
              {debouncedQuery ? "No events found" : "No public events"}
            </h3>
            <p className="text-gray-500 max-w-[400px]">
              {debouncedQuery
                ? `No events found matching "${debouncedQuery}"`
                : "There are no public events at the moment. Why not create your own?"}
            </p>
          </div>

          {!debouncedQuery && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/create">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">
                  <PlusIcon />
                  Create an event
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 pt-2">
            {events?.map((event) => (
              <Link
                href={`/e/${event.eventId}`}
                key={event.eventId}
                className="group"
              >
                <div className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={event.coverImage as string}
                      alt={event.name}
                      fill
                      className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/event-placeholder-1.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 w-full p-6 text-white">
                    <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                    <div className="space-y-1 text-sm opacity-90">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(parseISO(event.startDate), "PPP")}
                      </div>
                      {event.locationType === "VENUE" && (
                        <div className="flex items-center">
                          <MapPinIcon className="mr-2 h-4 w-4" />
                          {event.location.mainText}
                        </div>
                      )}
                      {event.locationType === "ONLINE" && (
                        <div className="flex items-center">
                          <PresentationIcon className="mr-2 h-4 w-4" />
                          Online
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {renderPaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < pagination.pages)
                          handlePageChange(currentPage + 1);
                      }}
                      className={
                        currentPage === pagination.pages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SkeletonCard = () => {
  return (
    <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className="aspect-[4/3] relative">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="absolute bottom-0 w-full p-6">
        <Skeleton className="h-7 w-3/4 mb-2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
