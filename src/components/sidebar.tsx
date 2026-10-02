"use client";

import { cn } from "@/lib/utils";
import { Calendar, Clock, Cloud, Home, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Clock, label: "Availability", href: "/dashboard/availability" },
  { icon: Calendar, label: "My Bookings", href: "/dashboard/bookings" },
  { icon: Star, label: "Starred", href: "/dashboard/starred" },
  { icon: Trash2, label: "Trash", href: "/dashboard/trash" },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleUtilityClick = (name: string) => {
    toast.info(`${name} feature coming soon!`);
  };

  return (
    <aside className="w-[256px] h-[calc(100vh-64px)] fixed left-0 top-16 bg-[#f8f9fa] overflow-y-auto px-4 py-4 hidden md:flex flex-col">
      {/* New Button */}
      <div className="mb-6 px-2">
        <Link href="/dashboard/events/new">
          <Button className="h-14 px-5 rounded-2xl bg-white text-[#3c4043] shadow-md hover:shadow-lg transition-all border border-gray-100 flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <path fill="#34A853" d="M16 16v14h4V20z" />
              <path fill="#4285F4" d="M30 16H20l-4 4h14z" />
              <path fill="#FBBC05" d="M6 16v4h10l4-4z" />
              <path fill="#EA4335" d="M20 16V6h-4v14z" />
              <path fill="none" d="M0 0h36v36H0z" />
            </svg>
            <span className="text-base font-medium">New</span>
          </Button>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-r-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#e4d8ff] text-[#5120b8]"
                  : "text-[#444746] hover:bg-[#1f1f1f0a]",
              )}
            >
              <item.icon
                size={20}
                className={cn("transition-colors duration-200", isActive ? "text-[#5120b8]" : "text-[#444746]")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Storage Indicator */}
      <div className="mt-auto px-4 py-6">
        <div className="flex items-center gap-3 text-[#3c4043] mb-2">
          <Cloud size={18} />
          <span className="text-sm">Storage (12% full)</span>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="bg-[#6426d9] h-full w-[12%]" />
        </div>
        <p className="text-xs text-[#5f6368] mt-2">1.8 GB of 15 GB used</p>
        <Button
          variant="outline"
          onClick={() => handleUtilityClick("Storage plans")}
          className="mt-4 w-full rounded-full border-gray-300 text-[#6426d9] hover:bg-[#f3edff] h-9"
        >
          Get more storage
        </Button>
      </div>
    </aside>
  );
}
