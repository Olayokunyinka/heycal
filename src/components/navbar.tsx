"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, HelpCircle, Settings, Grid, SlidersHorizontal, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useOffline } from "@/hooks/use-offline";

export function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const { isOfflineMode, toggleOfflineMode } = useOffline();

  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (searchQuery === currentQ) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("q", searchQuery);
      } else {
        params.delete("q");
      }
      router.push(`/dashboard?${params.toString()}`);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, router, searchParams]);

  const handleUtilityClick = (name: string) => {
    toast.info(`${name} feature coming soon!`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#f8f9fa]">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side: Logo and App Name */}
        <div className="flex items-center gap-2 min-w-[232px]">
          <Link href="/dashboard" className="flex items-center gap-3 group p-2 hover:bg-[#1f1f1f0a] rounded-lg transition-all duration-200">
            <Image src="/heycal-mark.png" alt="" width={36} height={36} className="size-9 object-contain" />
            <span className="text-[22px] font-normal text-[#444746] tracking-tight">
              Heycal
            </span>
          </Link>
        </div>

        {/* Middle: Search Bar (Google Style) */}
        <div className="hidden md:flex flex-1 max-w-[720px]">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#444746]" />
            </div>
            <input
              type="text"
              placeholder="Search in Heycal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search events and bookings"
              className="block w-full pl-12 pr-12 py-3 bg-[#f3edff] border-transparent rounded-full focus:bg-white focus:shadow-[0_1px_1px_0_rgba(65,69,73,0.3),0_1px_3px_1px_rgba(65,69,73,0.15)] transition-all duration-200 text-base outline-none"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="p-1.5 hover:bg-gray-200 rounded-full text-[#5f6368]"
                >
                  <X size={20} />
                </button>
              )}
              <button 
                onClick={() => handleUtilityClick("Search filters")}
                aria-label="Search filters"
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#5f6368]"
              >
                <SlidersHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Utilities and Profile */}
        <div className="flex items-center gap-1 md:gap-2">
          <Popover>
            <PopoverTrigger render={
              <button 
                aria-label="Offline status"
                className="p-2.5 hover:bg-gray-100 rounded-full text-[#5f6368] hidden sm:block outline-none"
              >
                <CheckCircle2 size={24} />
              </button>
            } />
            <PopoverContent align="end" className="w-[320px] p-0 overflow-hidden border-none shadow-xl rounded-lg">
              <div className="bg-[#f1f3f4] px-6 py-4 flex items-center justify-between">
                <span className="text-lg font-normal text-[#1f1f1f]">Offline preview</span>
                <Switch 
                  checked={isOfflineMode}
                  onCheckedChange={toggleOfflineMode}
                />
              </div>
            </PopoverContent>
          </Popover>
          <button 
            onClick={() => handleUtilityClick("Support")}
            aria-label="Support"
            className="p-2.5 hover:bg-gray-100 rounded-full text-[#5f6368] hidden sm:block"
          >
            <HelpCircle size={24} />
          </button>
          <button 
            onClick={() => handleUtilityClick("Settings")}
            aria-label="Settings"
            className="p-2.5 hover:bg-gray-100 rounded-full text-[#5f6368] hidden sm:block"
          >
            <Settings size={24} />
          </button>
          <a 
            href="https://about.google/products/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 hover:bg-gray-100 rounded-full text-[#5f6368] hidden sm:block"
            title="Google Apps"
            aria-label="Google Apps"
          >
            <Grid size={24} />
          </a>
          
          <div className="ml-2">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 border border-gray-200"
                }
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
