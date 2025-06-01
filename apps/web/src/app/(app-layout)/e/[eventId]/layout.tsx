import { Metadata } from "next";

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { eventId: string };
}): Promise<Metadata> {
  // Fetch event data server-side
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/event/${params.eventId}`,
      { next: { revalidate: 1200 } } // Cache for 1200 seconds
    );

    if (!response.ok) {
      return {
        title: "Event Not Found",
      };
    }

    const event = await response.json();

    // Handle description - could be string or rich text
    let description = "Join this exciting event!";
    if (typeof event.description === "string") {
      try {
        // Try to parse if it's JSON string
        const parsed = JSON.parse(event.description);
        // Extract text from rich text content
        description = parsed.content?.[0]?.content?.[0]?.text || description;
      } catch {
        // If not JSON, use as is
        description = event.description;
      }
    }
    // Truncate description
    description = description.substring(0, 160);

    return {
      title: event.name,
      description: description,
      openGraph: {
        title: event.name,
        description: description,
        images: [
          {
            url: event.coverImage || "/event-placeholder-1.png",
            width: 1200,
            height: 630,
            alt: event.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: event.name,
        description: description,
        images: [event.coverImage || "/event-placeholder-1.png"],
      },
    };
  } catch (error) {
    console.error("Error fetching event metadata:", error);
    return {
      title: "Event",
      description: "View event details",
    };
  }
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
