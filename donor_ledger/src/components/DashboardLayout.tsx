// import { SidebarProvider } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/AppSidebar";
// import { Outlet } from "react-router-dom";

// // export function DashboardLayout() {
// //   // (role and fullName not needed here anymore)
// //   return (
// //     <SidebarProvider>
// //       <div className="flex min-h-screen w-full">
// //         <AppSidebar />   {/* ❌ no props, this is correct */}
// //         <main className="flex-1 p-6 bg-secondary/20">
// //           <Outlet />
// //         </main>
// //       </div>
// //     </SidebarProvider>
// //   );
// // }


// import { useState } from "react";
// import Chatbot from "@/components/Chatbot";

// export function DashboardLayout() {
//   const [showChatbot, setShowChatbot] = useState(false);
//   const [chatbotClosed, setChatbotClosed] = useState(false);

//   return (
//     <SidebarProvider>
//       <div className="flex min-h-screen w-full">
//         <AppSidebar setShowChatbot={setShowChatbot} />

//         <main className="flex-1 p-6 bg-secondary/20">
//           <Outlet />
//         </main>

//         {showChatbot && <Chatbot currentShipment={[]} />}
//       </div>
//     </SidebarProvider>
//   );
// }

// export default DashboardLayout;





// import { SidebarProvider } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/AppSidebar";
// import { Outlet } from "react-router-dom";
// import { useState } from "react";
// import Chatbot from "@/components/Chatbot";

// export function DashboardLayout() {
//   const [showChatbot, setShowChatbot] = useState(false);

//   return (
//     <SidebarProvider>
//       <div className="flex min-h-screen w-full">
        
//         {/* ✅ Sidebar (open chatbot) */}
//         <AppSidebar setShowChatbot={setShowChatbot} />

//         {/* ✅ Main Content */}
//         <main className="flex-1 p-6 bg-secondary/20">
//           <Outlet />
//         </main>

//         {/* ✅ Chatbot (IMPORTANT FIX HERE) */}
//         {showChatbot && (
//           <Chatbot
//             currentShipment={null}
//             setShowChatbot={setShowChatbot} 
//           />
//         )}

//       </div>
//     </SidebarProvider>
//   );
// }

// export default DashboardLayout;


import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Chatbot from "@/components/Chatbot";
import { Cpu } from "lucide-react";
import { toast } from "sonner";

export function DashboardLayout() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [showRobotIntro, setShowRobotIntro] = useState(true);

  const navigate = useNavigate();

  /* ===============================
     🔐 AUTH CHECK (ON LOAD)
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/signin");
    }
  }, [navigate]);

  /* ===============================
     ⏳ SESSION EXPIRY (5 MIN)
  =============================== */
  useEffect(() => {
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem("loginTime");

      if (!loginTime) return;

      const now = Date.now();
      const diff = now - Number(loginTime);

      // 10 minutes = 600000 ms
      if (diff > 10 * 60 * 1000) {
        localStorage.clear();

        toast.error("Session expired. Please login again.");

        navigate("/signin");
      }
    }, 5000); // check every 5 sec

    return () => clearInterval(interval);
  }, [navigate]);

  /* ===============================
     🤖 AUTO ROBOT INTRO (4 sec)
  =============================== */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRobotIntro(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">

        {/* ✅ Sidebar */}
        <AppSidebar setShowChatbot={setShowChatbot} />

        {/* ✅ Main Content */}
        <main className="flex-1 p-6 bg-secondary/20">
          <Outlet />
        </main>

        {/* ===============================
            🤖 FLOATING AI ROBOT INTRO
        =============================== */}
        {showRobotIntro && (
          <div className="fixed bottom-6 right-6 z-50 animate-robotEntry">
            <div className="relative">

              {/* Robot Button */}
              <div
                className="w-14 h-14 bg-red-500 text-white flex items-center justify-center rounded-full shadow-lg cursor-pointer animate-bounceSlow hover:scale-110 transition"
                onClick={() => {
                  setShowChatbot(true);
                  setShowRobotIntro(false);
                }}
              >
                <Cpu size={22} />
              </div>

              {/* Tooltip */}
              <div className="absolute right-16 bottom-2 bg-white text-gray-800 text-xs px-3 py-1 rounded shadow-md whitespace-nowrap animate-fadeIn">
                Ask OrganAI 🤖
              </div>

            </div>
          </div>
        )}

        {/* ===============================
            💬 CHATBOT
        =============================== */}
        {showChatbot && (
          <div className="fixed bottom-5 right-5 z-50 animate-slideIn">
            <Chatbot
              currentShipment={null}
              setShowChatbot={setShowChatbot}
            />
          </div>
        )}

      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;