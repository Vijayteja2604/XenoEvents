import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xeno Events",
  description: "Xeno Events. Stop taking registrations on google forms.",
};
export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${inter.className} antialiased bg-[#ebf8ff] min-h-screen`}
    >
      <Header />
      <div className="container mx-auto px-6 pt-20">
        <div className="mx-auto max-w-[50rem] border-none shadow-none">
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
