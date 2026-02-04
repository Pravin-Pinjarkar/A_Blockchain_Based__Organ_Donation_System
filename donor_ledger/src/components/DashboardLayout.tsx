import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  // (role and fullName not needed here anymore)
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />   {/* ❌ no props, this is correct */}
        <main className="flex-1 p-6 bg-secondary/20">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
