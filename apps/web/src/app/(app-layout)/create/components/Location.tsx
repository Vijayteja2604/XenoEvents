/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Globe,
  Search,
  XIcon,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLoadScript } from "@react-google-maps/api";
import { Label } from "@/components/ui/label";
import { debounce } from "lodash";

interface Location {
  place_id: string;
  description: string;
  isCustom?: boolean;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

declare global {
  interface Window {
    google: any;
  }
}

interface LocationProps {
  locationType: "venue" | "online" | null;
  location: {
    place_id?: string;
    description: string;
    isCustom?: boolean;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
    latitude?: number;
    longitude?: number;
  } | null;
  onLocationTypeChange: (type: "venue" | "online" | null) => void;
  onLocationChange: (
    location: {
      place_id?: string;
      description: string;
      isCustom?: boolean;
      structured_formatting?: {
        main_text: string;
        secondary_text: string;
      };
      latitude?: number;
      longitude?: number;
    } | null
  ) => void;
  meetingLink?: string;
  onMeetingLinkChange?: (link: string) => void;
  additionalDetails?: string;
  onAdditionalDetailsChange?: (details: string) => void;
}

interface LocationState {
  place_id?: string;
  description: string;
  isCustom?: boolean;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// Define libraries array as a static constant outside the component
const GOOGLE_MAPS_LIBRARIES: ("places" | "marker")[] = ["places", "marker"];

interface RecentLocation {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  latitude?: number;
  longitude?: number;
  timestamp: number;
}

const RECENT_LOCATIONS_KEY = "recentLocations";
const MAX_RECENT_LOCATIONS = 3;

export default function Location({
  locationType,
  location,
  onLocationTypeChange,
  onLocationChange,
  meetingLink = "",
  onMeetingLinkChange = () => {},
  additionalDetails = "",
  onAdditionalDetailsChange = () => {},
}: LocationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<Location[]>([]);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [internalLocation, setInternalLocation] =
    useState<LocationState | null>(null);
  const [showAdditionalDetailsInput, setShowAdditionalDetailsInput] =
    useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES, // Use the static constant here
  });

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
    }
  }, [isLoaded]);

  const handlePredictionRequest = useCallback((query: string) => {
    if (query && autocompleteService.current) {
      setIsSearching(true);
      autocompleteService.current.getPlacePredictions(
        { input: query },
        (predictions: Location[], status: string) => {
          setIsSearching(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(predictions);
          } else {
            console.error("Autocomplete prediction failed:", status);
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
      setIsSearching(false);
    }
  }, []);

  const debouncedPredictionRequest = useRef(
    debounce(handlePredictionRequest, 1000)
  ).current;

  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      debouncedPredictionRequest(searchQuery);
    } else {
      setPredictions([]);
      setIsSearching(false);
    }

    return () => {
      debouncedPredictionRequest.cancel();
      setIsSearching(false);
    };
  }, [searchQuery, debouncedPredictionRequest]);

  useEffect(() => {
    setInternalLocation(location);
  }, [location]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RecentLocation[];
      setRecentLocations(parsed);
    }
  }, []);

  const handleLocationSelect = (loc: Location | RecentLocation) => {
    if (loc.place_id === "custom") {
      const customLocation = {
        place_id: "custom",
        description: searchQuery,
        isCustom: true,
        structured_formatting: {
          main_text: searchQuery,
          secondary_text: "Custom Location",
        },
      };
      onLocationChange(customLocation);
      setInternalLocation(customLocation);
      saveToRecentLocations({
        place_id: "custom",
        description: searchQuery,
        structured_formatting: {
          main_text: searchQuery,
          secondary_text: "Custom Location",
        },
        timestamp: Date.now(),
      });
    } else {
      placesService.current.getDetails(
        {
          placeId: loc.place_id,
          fields: ["place_id", "name", "geometry", "formatted_address"],
        },
        (place: any, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            const newLocation = {
              place_id: loc.place_id,
              description: place.name,
              isCustom: false,
              structured_formatting: {
                main_text: place.name,
                secondary_text: place.formatted_address,
              },
              latitude: lat,
              longitude: lng,
            };

            saveToRecentLocations({
              ...newLocation,
              timestamp: Date.now(),
            });

            setInternalLocation({
              ...newLocation,
              geometry: {
                location: {
                  lat,
                  lng,
                },
              },
            });
            onLocationChange(newLocation);
          }
        }
      );
    }
    setSearchQuery("");
    setPredictions([]);
    setIsLocationPopoverOpen(false);
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsLocationPopoverOpen(open);
    if (!open && !internalLocation) {
      onLocationTypeChange(null);
    }
  };

  useEffect(() => {
    if (
      isLoaded &&
      internalLocation?.geometry &&
      !mapRef.current &&
      !internalLocation.isCustom
    ) {
      const mapElement = document.getElementById("map");
      if (mapElement) {
        const map = new window.google.maps.Map(mapElement, {
          center: internalLocation.geometry.location,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || "",
        });

        if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID) {
          new window.google.maps.marker.AdvancedMarkerElement({
            position: internalLocation.geometry.location,
            map: map,
          });
        } else {
          new window.google.maps.Marker({
            position: internalLocation.geometry.location,
            map: map,
          });
        }

        mapRef.current = map;
      }
    }
  }, [isLoaded, internalLocation]);

  const handleLocationTypeChange = (type: "venue" | "online") => {
    if (type === locationType && !internalLocation) {
      onLocationTypeChange(null);
      onLocationChange(null);
      setInternalLocation(null);
      mapRef.current = null;
      if (type === "online") {
        onMeetingLinkChange("");
      }
    } else {
      onLocationTypeChange(type);
      if (type === "online") {
        onLocationChange(null);
        setInternalLocation(null);
        mapRef.current = null;
      } else {
        onMeetingLinkChange("");
      }
    }
  };

  const handleClearLocation = () => {
    onLocationChange(null);
    onLocationTypeChange(null);
    setInternalLocation(null);
    mapRef.current = null;
  };

  const handleAdditionalDetailsToggle = () => {
    if (!showAdditionalDetailsInput) {
      setShowAdditionalDetailsInput(true);
    } else {
      setShowAdditionalDetailsInput(false);
      onAdditionalDetailsChange(""); // Clear the text when closing
    }
  };

  const saveToRecentLocations = (location: RecentLocation) => {
    const stored = localStorage.getItem(RECENT_LOCATIONS_KEY);
    let recent = stored ? (JSON.parse(stored) as RecentLocation[]) : [];

    // Remove if already exists
    recent = recent.filter((loc) => loc.place_id !== location.place_id);

    // Add new location at the beginning
    recent.unshift(location);

    // Keep only the most recent locations
    recent = recent.slice(0, MAX_RECENT_LOCATIONS);

    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(recent));
    setRecentLocations(recent);
  };

  if (loadError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-destructive">
        Error loading maps. Please check your connection and try again.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Location
      </label>
      <div className="flex flex-wrap gap-2 pb-2">
        <Popover
          open={isLocationPopoverOpen}
          onOpenChange={handlePopoverOpenChange}
        >
          <PopoverTrigger asChild>
            <Button
              variant="xenoSecondary"
              className={`flex-none ${
                locationType === "venue"
                  ? "bg-blue-500 text-primary-foreground hover:bg-blue-600"
                  : ""
              }`}
              onClick={() => handleLocationTypeChange("venue")}
            >
              <MapPin className="h-4 w-4" />
              Location
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 border-none p-0 shadow-md"
            align="start"
          >
            <div className="relative flex items-center gap-2 border-b border-gray-200 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <Input
                placeholder="Search locations..."
                className="h-8 w-full border-none bg-transparent p-0 text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[300px] overflow-auto p-1.5">
              {!searchQuery && recentLocations.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-2.5 py-1">
                    <div className="text-xs font-medium text-muted-foreground/80">
                      Recent Locations
                    </div>
                  </div>
                  {recentLocations.map((location) => (
                    <button
                      key={`${location.place_id}-${location.timestamp}`}
                      className="flex w-full items-start gap-2.5 rounded-md p-2.5 text-left transition-colors hover:bg-gray-50/90 active:bg-gray-100/90"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50">
                        <MapPin className="h-4 w-4 text-muted-foreground/70" />
                      </div>
                      <div className="flex flex-col py-0.5">
                        <span className="line-clamp-1 text-sm font-medium text-gray-900">
                          {location.structured_formatting.main_text}
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground/70">
                          {location.structured_formatting.secondary_text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/70" />
                </div>
              ) : (
                <>
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      className="flex w-full items-start gap-2.5 rounded-md p-2.5 text-left transition-colors hover:bg-gray-50/90 active:bg-gray-100/90"
                      onClick={() => handleLocationSelect(prediction)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50">
                        <MapPin className="h-4 w-4 text-muted-foreground/70" />
                      </div>
                      <div className="flex flex-col py-0.5">
                        <span className="line-clamp-1 text-sm font-medium text-gray-900">
                          {prediction.structured_formatting?.main_text ||
                            prediction.description}
                        </span>
                        {prediction.structured_formatting?.secondary_text && (
                          <span className="line-clamp-1 text-xs text-muted-foreground/70">
                            {prediction.structured_formatting.secondary_text}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {searchQuery && (
                    <button
                      className="flex w-full items-start gap-2.5 rounded-md p-2.5 text-left transition-colors hover:bg-gray-50/90 active:bg-gray-100/90"
                      onClick={() =>
                        handleLocationSelect({
                          place_id: "custom",
                          description: searchQuery,
                          isCustom: true,
                          structured_formatting: {
                            main_text: searchQuery,
                            secondary_text: "Custom Location",
                          },
                        })
                      }
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50">
                        <Plus className="h-4 w-4 text-muted-foreground/70" />
                      </div>
                      <div className="flex flex-col py-0.5">
                        <span className="line-clamp-1 text-sm font-medium text-gray-900">
                          Use &quot;{searchQuery}&quot;
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground/70">
                          Add as custom location
                        </span>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="xenoSecondary"
          className={`flex-none ${
            locationType === "online"
              ? "bg-blue-500 text-primary-foreground hover:bg-blue-600"
              : ""
          }`}
          onClick={() => handleLocationTypeChange("online")}
        >
          <Globe className="h-4 w-4" />
          Online
        </Button>
        {locationType === "online" && (
          <div className="mt-2 w-full sm:mt-0 sm:w-auto sm:flex-1">
            <Input
              placeholder="Paste meeting link (optional)"
              value={meetingLink}
              onChange={(e) => onMeetingLinkChange(e.target.value)}
              className="h-9 sm:h-10  w-full rounded-md border-none bg-gray-50/90 text-xs shadow-none placeholder:text-xs hover:bg-gray-50/90 sm:text-sm sm:placeholder:text-sm"
            />
          </div>
        )}
      </div>
      {locationType === "venue" && internalLocation && (
        <div className="space-y-2">
          <div className="relative rounded-lg bg-gray-50/90 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">
                    {internalLocation.structured_formatting?.main_text ||
                      internalLocation.description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {internalLocation.structured_formatting?.secondary_text}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClearLocation}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            {!internalLocation.isCustom && (
              <>
                <div id="map" className="h-[200px] w-full rounded-md" />
                <div className="mt-4">
                  {!showAdditionalDetailsInput && !additionalDetails ? (
                    <Button
                      variant="ghost"
                      className="h-9 sm:h-10 justify-start rounded-md bg-white/80 px-3 text-xs text-muted-foreground hover:bg-white/90 sm:text-sm"
                      onClick={() => setShowAdditionalDetailsInput(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add additional details
                    </Button>
                  ) : (
                    <>
                      <div className="flex flex-row items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-xs text-muted-foreground sm:text-sm"
                          onClick={handleAdditionalDetailsToggle}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Label className="ml-1">Additional details</Label>
                      </div>
                      <Input
                        placeholder="Apt no, room no, etc."
                        value={additionalDetails}
                        onChange={(e) =>
                          onAdditionalDetailsChange(e.target.value)
                        }
                        className="h-9 w-full bg-none rounded-md border-none text-xs shadow-none placeholder:text-xs sm:text-sm sm:placeholder:text-sm"
                        autoFocus={showAdditionalDetailsInput}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
