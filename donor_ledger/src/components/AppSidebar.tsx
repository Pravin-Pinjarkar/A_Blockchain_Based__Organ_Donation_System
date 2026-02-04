import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Building2,
  FileText,
  Blocks,
  GitCompare,
  Heart,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

export function AppSidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load user info
  const accountType = (localStorage.getItem("accountType") ?? "").toLowerCase();
  const fullName = localStorage.getItem("fullName") || "User";

  const firstLetter = fullName.charAt(0).toUpperCase();

  // ================= MENU ITEMS (ROLE-BASED RENDERING) =================
const items = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Donors", url: "/dashboard/donors", icon: Users },
  { title: "Recipients", url: "/dashboard/recipients", icon: HeartPulse },
  { title: "Hospitals", url: "/dashboard/hospitals", icon: Building2 },
];

// 👉 Append extra menu only for hospital admin
if (accountType === "hospital admin") {
  items.push(
    { title: "Organ Requests", url: "/dashboard/requests", icon: FileText },
    { title: "Blockchain", url: "/dashboard/blockchain", icon: Blocks },
    { title: "Matching", url: "/dashboard/matching", icon: GitCompare }
  );
}


  // ================= LOGOUT HANDLERS =================
  const handleLogout = () => setShowDialog(true);

  const confirmLogout = () => {
    setIsLoggingOut(true);
    setShowDialog(false);
    localStorage.clear();
    sessionStorage.clear();

    toast({ title: "Logged out successfully", duration: 1200 });

    setTimeout(() => {
      navigate("/", { replace: true });
      setIsLoggingOut(false);
    }, 1000);
  };

  const cancelLogout = () => {
    setShowDialog(false);
    toast({ title: "Logout cancelled", duration: 1500 });
  };

  return (
    <>
      {/* Logout Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-red-600">
              ⚠ Logout Confirmation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to logout from your dashboard?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="secondary" onClick={cancelLogout}>
              No
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}
              disabled={isLoggingOut}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar UI */}
      <Sidebar collapsible="icon">
        {/* HEADER + USER BADGE */}
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-bold text-lg hidden data-[state=open]:block">
              LifeLink
            </span>
          </div>

          {/* User Info */}
          <div className="mt-4 flex items-center gap-2 bg-muted/30 p-2 rounded-md">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {firstLetter}
            </div>
            <div className="hidden data-[state=open]:block">
              <p className="text-sm font-semibold">{fullName}</p>
              <p className="text-xs text-muted-foreground capitalize">{accountType}</p>
            </div>
          </div>
        </SidebarHeader>

        {/* MENU */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={({ isActive }) =>
                          isActive ? "bg-primary/10 text-primary font-medium" : ""
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {/* Logout Button */}
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <div className="mt-auto p-4 border-t">
          <SidebarTrigger />
        </div>
      </Sidebar>
    </>
  );
}
