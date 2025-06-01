"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Pie,
  PieChart,
} from "recharts";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const chartConfig = {
  visitors: {
    label: "Total Impressions",
    color: "#a6d0ff",
  },
  signups: {
    label: "Registered Users",
    color: "#60A8FB",
  },
  recurring: {
    label: "Amount Earned",
    color: "#2463EB",
  },
} satisfies ChartConfig;

const pieChartData = [
  { browser: "mobile", visitors: 275, fill: "#2463EB" },
  { browser: "desktop", visitors: 200, fill: "#a6d0ff" },
];

const locationData = [
  { location: "India", visitors: 4580, flag: "🇮🇳" },
  { location: "United States of America", visitors: 3200, flag: "🇺🇸" },
  { location: "United Kingdom", visitors: 2400, flag: "🇬🇧" },
  { location: "Germany", visitors: 1800, flag: "🇩🇪" },
  { location: "Canada", visitors: 1200, flag: "🇨🇦" },
];

const pieConfig = {
  visitors: {
    label: "Visitors",
  },
  mobile: {
    label: "Mobile",
    color: "#2463EB",
  },
  desktop: {
    label: "Desktop",
    color: "#a6d0ff",
  },
} satisfies ChartConfig;

// Toggle this to false when ready to launch analytics
const ANALYTICS_COMING_SOON = true;

export default function Analytics() {
  const [timeRange, setTimeRange] = React.useState("7d");
  const isPaid = false;

  const data = [
    { date: "2024-01-01", visitors: 555, signups: 150, recurring: 800 },
    { date: "2024-01-02", visitors: 492, signups: 180, recurring: 750 },
    { date: "2024-01-03", visitors: 417, signups: 120, recurring: 900 },
    { date: "2024-01-04", visitors: 605, signups: 260, recurring: 1100 },
    { date: "2024-01-05", visitors: 932, signups: 290, recurring: 1300 },
    { date: "2024-01-06", visitors: 752, signups: 340, recurring: 1200 },
    { date: "2024-01-07", visitors: 612, signups: 180, recurring: 950 },
    { date: "2024-01-08", visitors: 102, signups: 320, recurring: 1400 },
    { date: "2024-01-09", visitors: 397, signups: 110, recurring: 800 },
    { date: "2024-01-10", visitors: 652, signups: 190, recurring: 1000 },
    { date: "2024-01-11", visitors: 817, signups: 350, recurring: 1250 },
    { date: "2024-01-12", visitors: 730, signups: 210, recurring: 1150 },
    { date: "2024-01-13", visitors: 855, signups: 380, recurring: 1300 },
    { date: "2024-01-14", visitors: 342, signups: 220, recurring: 900 },
    { date: "2024-01-15", visitors: 300, signups: 170, recurring: 850 },
    { date: "2024-01-16", visitors: 345, signups: 190, recurring: 920 },
    { date: "2024-01-17", visitors: 1115, signups: 360, recurring: 1500 },
    { date: "2024-01-18", visitors: 910, signups: 410, recurring: 1400 },
    { date: "2024-01-19", visitors: 607, signups: 180, recurring: 1100 },
    { date: "2024-01-20", visitors: 472, signups: 150, recurring: 950 },
    { date: "2024-01-21", visitors: 342, signups: 200, recurring: 880 },
    { date: "2024-01-22", visitors: 560, signups: 170, recurring: 1050 },
    { date: "2024-01-23", visitors: 345, signups: 230, recurring: 900 },
    { date: "2024-01-24", visitors: 967, signups: 290, recurring: 1300 },
    { date: "2024-01-25", visitors: 537, signups: 250, recurring: 1100 },
    { date: "2024-01-26", visitors: 435, signups: 130, recurring: 850 },
    { date: "2024-01-27", visitors: 955, signups: 420, recurring: 1450 },
    { date: "2024-01-28", visitors: 305, signups: 180, recurring: 900 },
    { date: "2024-01-29", visitors: 785, signups: 240, recurring: 1200 },
    { date: "2024-01-30", visitors: 1135, signups: 380, recurring: 1500 },
    { date: "2024-02-01", visitors: 415, signups: 220, recurring: 950 },
    { date: "2024-02-02", visitors: 735, signups: 310, recurring: 1250 },
    { date: "2024-02-03", visitors: 617, signups: 190, recurring: 1100 },
    { date: "2024-02-04", visitors: 962, signups: 420, recurring: 1400 },
    { date: "2024-02-05", visitors: 1202, signups: 390, recurring: 1600 },
    { date: "2024-02-06", visitors: 1245, signups: 520, recurring: 1800 },
    { date: "2024-02-07", visitors: 970, signups: 300, recurring: 1400 },
    { date: "2024-02-08", visitors: 372, signups: 210, recurring: 950 },
    { date: "2024-02-09", visitors: 567, signups: 180, recurring: 1100 },
    { date: "2024-02-10", visitors: 732, signups: 330, recurring: 1300 },
  ];

  const metrics = [
    {
      label: "Total Impressions",
      value: "42.1k",
      color: "#a6d0ff",
      dataKey: "visitors",
    },
    {
      label: "Registered Users",
      value: "2.4k",
      color: "#60A8FB",
      dataKey: "signups",
    },
    ...(isPaid
      ? [
          {
            label: "Amount Earned",
            value: "6.3k",
            color: "#2463EB",
            dataKey: "recurring",
          },
        ]
      : []),
  ];

  const filteredData = data.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date(data[data.length - 1].date);
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <div className="relative">
      {ANALYTICS_COMING_SOON && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pb-[1200px] sm:pb-[600px] bg-background/5 backdrop-blur-sm">
          <p className="text-2xl font-semibold">Coming Soon</p>
        </div>
      )}
      <div className={ANALYTICS_COMING_SOON ? "opacity-50" : ""}>
        <div className="space-y-8 pb-14">
          <div
            className={`grid gap-4 ${
              metrics.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            {metrics.map((metric) => (
              <Card key={metric.label} className="shadow-none border-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="h-[80px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 10,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id={`gradient-${metric.dataKey}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={metric.color}
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor={metric.color}
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey={metric.dataKey}
                          stroke={metric.color}
                          fill={`url(#gradient-${metric.dataKey})`}
                          fillOpacity={0.4}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Chart */}
          <Card className="shadow-none border-none">
            <CardHeader className="flex items-center gap-2 space-y-0 py-5 sm:flex-row">
              <div className="grid flex-1 text-center sm:text-left">
                <CardTitle className="text-xl">Analytics Overview</CardTitle>
                <CardDescription>
                  Showing total activity for the selected period
                </CardDescription>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger
                  className="w-[160px] rounded-lg sm:ml-auto"
                  aria-label="Select time range"
                >
                  <SelectValue placeholder="Last 3 months" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="90d" className="rounded-lg">
                    Last 3 months
                  </SelectItem>
                  <SelectItem value="30d" className="rounded-lg">
                    Last 30 days
                  </SelectItem>
                  <SelectItem value="7d" className="rounded-lg">
                    Last 7 days
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[400px] w-full"
              >
                <AreaChart data={filteredData}>
                  <defs>
                    <linearGradient
                      id="fillVisitors"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#a6d0ff" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#a6d0ff"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillSignups"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#60A8FB" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#60A8FB"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillRecurring"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2463EB" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#2463EB"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="visitors"
                    type="natural"
                    fill="url(#fillVisitors)"
                    stroke="#a6d0ff"
                    fillOpacity={0.4}
                  />
                  <Area
                    dataKey="signups"
                    type="natural"
                    fill="url(#fillSignups)"
                    stroke="#60A8FB"
                    fillOpacity={0.4}
                  />
                  {isPaid && (
                    <Area
                      dataKey="recurring"
                      type="natural"
                      fill="url(#fillRecurring)"
                      stroke="#2463EB"
                      fillOpacity={0.4}
                    />
                  )}
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col shadow-none border-none">
              <CardHeader className="items-center pb-0">
                <CardTitle>Devices</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={pieConfig}
                  className="mx-auto aspect-square max-h-[300px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="w-[150px]"
                          indicator="line"
                        />
                      }
                    />
                    <Pie
                      data={pieChartData}
                      dataKey="visitors"
                      nameKey="browser"
                    />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="browser" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="flex flex-col shadow-none border-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Locations</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    Visitors
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locationData.map((item) => (
                    <div
                      key={item.location}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.flag}</span>
                        <span className="text-sm">{item.location}</span>
                      </div>
                      <span className="font-medium text-sm">
                        {item.visitors.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
