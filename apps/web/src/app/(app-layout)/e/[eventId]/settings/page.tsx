"use client";

import { useState } from "react";
import Overview from "./components/Overview";
import Attendees from "./components/Attendees";
// import Analytics from "./components/Analytics";
import More from "./components/More";
import { LayoutDashboard, Users, Settings, Loader2Icon } from "lucide-react";
import { useEventRole } from "@/hooks/event/useEvent";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { role, isLoading, error } = useEventRole(eventId);
  const [activeTab, setActiveTab] = useState("overview");

  if (error || (!isLoading && !["ADMIN", "CREATOR"].includes(role || ""))) {
    notFound();
  }

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      component: Overview,
      icon: LayoutDashboard,
    },
    {
      id: "attendees",
      label: "Attendees",
      component: Attendees,
      icon: Users,
    },
    // {
    //   id: "analytics",
    //   label: "Analytics",
    //   component: Analytics,
    //   icon: LineChart,
    // },
    {
      id: "more",
      label: "More",
      component: More,
      icon: Settings,
    },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || Overview;

  if (isLoading) {
    return (
      <div className="space-y-4 flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Event Settings
          </h2>
        </div>
        <div className="flex justify-center pb-80 items-center h-screen">
          <Loader2Icon className="size-10 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Event Settings
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 rounded-none border-b border-blue-200 bg-transparent px-0 py-1 text-foreground">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative text-base after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-blue-200 hover:text-foreground data-[state=active]:text-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-blue-500 data-[state=active]:hover:bg-blue-200"
              >
                <tab.icon
                  className="-ms-0.5 me-1.5 opacity-60 data-[state=active]:text-blue-500"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <ActiveComponent />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
