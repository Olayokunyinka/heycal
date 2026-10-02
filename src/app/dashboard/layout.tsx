import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { Suspense } from "react";
import { isAdminUser } from "@/lib/admin-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAdminUser();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Suspense fallback={<div className="h-16 bg-[#f8f9fa] border-b" />}>
        <Navbar />
      </Suspense>
      <div className="flex">
        <Sidebar isAdmin={isAdmin} />
        <main className="flex-1 md:ml-[256px] lg:mr-[56px] min-h-[calc(100vh-64px)] p-2">
          <div className="bg-white rounded-[24px] min-h-[calc(100vh-80px)] shadow-sm overflow-hidden">
            {children}
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
