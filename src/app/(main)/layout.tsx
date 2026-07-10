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
    <div className="flex flex-col md:flex-row justify-center md:gap-8 max-w-[1400px] mx-auto min-h-screen md:px-4">
      {!isZenMode && <MobileNavbar />}
      {!isZenMode && <LeftSidebar />}
      <main className={`flex-1 w-full max-w-2xl bg-transparent py-4 md:py-8 px-4 md:px-0 ${isZenMode ? 'mx-auto' : ''}`}>
        {children}
      </main>
      {!isZenMode && <RightSidebar />}
    </div>
  );
}
