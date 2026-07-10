"use client";

import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNavbar from "@/components/MobileNavbar";
import { useZenMode } from "@/context/ZenContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isZenMode } = useZenMode();

  return (
    <div className="flex flex-col md:flex-row justify-between w-full min-h-screen">
      {!isZenMode && <MobileNavbar />}
      {!isZenMode && <LeftSidebar />}
      <main className={`flex-1 w-full max-w-6xl mx-auto bg-transparent py-4 md:py-8 px-4 md:px-8`}>
        {children}
      </main>
      {!isZenMode && <RightSidebar />}
    </div>
  );
}
