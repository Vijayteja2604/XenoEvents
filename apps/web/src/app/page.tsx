"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  useEffect(() => {
    fetch(`${apiBaseUrl}/test`)
      .then((res) => res.json())
      .then((data) => setData(data));
    setLoading(false);
  }, [apiBaseUrl]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div>{data}</div>
    </div>
  );
}
