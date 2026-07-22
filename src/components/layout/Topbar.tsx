"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Home, Search, ArrowLeft, Bell, Menu } from "lucide-react";
import MobileNav from "./MobileNav";

export default function Topbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notificationChannel = useRef<BroadcastChannel | null>(null);

  const getNotificationTag = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return { label: "New", className: "inline-flex text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "APPROVAL_REQUESTED":
        return { label: "Approval", className: "inline-flex text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "BIND_REQUESTED":
        return { label: "Bind", className: "inline-flex text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "POLICY_BOUND":
        return { label: "Bound", className: "inline-flex text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "NEW_QUOTE":
        return { label: "Quote", className: "inline-flex text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "NEW_NOTE":
        return { label: "Note", className: "inline-flex text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      default:
        return { label: "Info", className: "inline-flex text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      notificationChannel.current = new BroadcastChannel("notification-events");
      notificationChannel.current.onmessage = (event) => {
        if (event.data?.type === "notification-dismissed") {
          setNotifications((prev) => prev.filter((n) => n.id !== event.data.id));
        } else if (event.data?.type === "notifications-refreshed") {
          fetchNotifications();
        }
      };
    }

    return () => {
      notificationChannel.current?.close();
      notificationChannel.current = null;
    };
  }, [session]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session?.user) {
      console.debug("No session available for notifications");
      return;
    }
    
    try {
      setNotifLoading(true);
      console.debug("Fetching notifications...");
      const res = await fetch(`/api/notifications?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!res.ok) {
        console.warn(`Notifications API error: ${res.status} ${res.statusText}`);
        const errorData = await res.json();
        console.warn("Error details:", errorData);
        return;
      }
      
      const data = await res.json();
      console.debug("Notifications fetched:", data);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotifLoading(false);
    }
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (session?.user) {
      fetchNotifications(); // Initial fetch
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Handle notification click: dismiss and navigate
  const handleNotificationClick = async (notif: any) => {
    let dismissed = false;

    try {
      const response = await fetch(`/api/notifications?id=${notif.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await response.json();
        dismissed = true;
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        setNotifOpen(false);

        if (notificationChannel.current) {
          notificationChannel.current.postMessage({
            type: "notification-dismissed",
            id: notif.id,
          });
        }
      } else {
        console.error("Failed to dismiss notification:", response.status);
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }

    // Navigate to submission page only if dismissed
    if (dismissed && notif.submissionId) {
      console.log(`📍 Navigating to submission: ${notif.submissionId}`);
      if (pathname.startsWith("/admin")) {
        router.push(`/admin/submissions/${notif.submissionId}`);
      } else {
        router.push(`/agency/submissions/${notif.submissionId}`);
      }
    }
  };

  // Hide Topbar on dashboard routes (agency/admin) because dashboard has its own header
  if (pathname.startsWith("/agency/dashboard") || pathname.startsWith("/admin/dashboard")) {
    return null;
  }

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-[#e5ddd5] flex items-center justify-between px-4 md:px-8 shadow-sm">
      {pathname.startsWith("/admin") && (
        <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      )}
      {/* ================= LEFT ================= */}
      <div className="flex items-center gap-3 w-full max-w-[650px]">
        {/* ⭐ HAMBURGER MENU (MOBILE ONLY) */}
        {pathname.startsWith("/admin") && (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#f5f1eb] transition-colors"
          >
            <Menu className="w-6 h-6 text-[#9A8B7A]" />
          </button>
        )}

        {/* ⭐ BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[#f5f1eb] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#9A8B7A]" />
        </button>

        {/* ⭐ SEARCH */}
        {/* <div className="flex items-center border border-[#e5ddd5] rounded-xl px-3 py-2 flex-1 bg-[#f5f1eb] min-w-0 focus-within:ring-2 focus-within:ring-[#9A8B7A]/20 focus-within:border-[#9A8B7A] transition-all">

          <Search className="w-4 h-4 text-[#9A8B7A] mr-2 shrink-0" />

          <input
            placeholder="Search"
            className="flex-1 outline-none text-sm text-[#2d2a26] placeholder-[#6b5e52] bg-transparent min-w-0"
          />
        </div> */}

        {/* ⭐ ADVANCED */}
        {/* <button className="hidden md:block text-sm font-semibold text-[#9A8B7A] hover:text-[#8a6f4d] transition-colors whitespace-nowrap">
          Advanced
        </button> */}
      </div>

      {/* ================= RIGHT ================= */}
      <div className="flex items-center gap-4 md:gap-6 relative ml-4" ref={dropdownRef}>

        {/* ⭐⭐⭐ NEW ATTRACTIVE HOME BUTTON ⭐⭐⭐ */}
        <button
          type="button"
          onClick={() => {
            if (pathname.startsWith("/admin")) {
              router.push("/admin/dashboard");
            } else {
              router.push("/agency/dashboard");
            }
          }}
          className="
            h-11 w-11
            rounded-full
            bg-[#9A8B7A]
            flex items-center justify-center
            shadow-sm
            hover:bg-[#8a6f4d]
            hover:shadow-md
            hover:-translate-y-[1px]
            active:scale-95
            transition-all duration-200
          "
        >
          <Home className="w-5 h-5 text-white" />
        </button>

        {/* ⭐ NOTIFICATIONS BELL */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(prev => !prev)}
            className="relative h-11 w-11 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center hover:bg-[#8a6f4d] hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications && notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {/* NOTIFICATIONS DROPDOWN */}
          <div
            className={`absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-lg border border-[#e5ddd5] z-50
            transition-all duration-200 ease-out
            ${
              notifOpen
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-2 pointer-events-none"
            }`}
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            <div className="px-5 py-4 border-b border-[#e5ddd5] bg-[#f5f1eb] sticky top-0">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-[#2d2a26]">Notifications</p>
                {notifications && notifications.length > 0 && (
                  <span className="text-xs font-semibold text-white bg-[#9A8B7A] px-2.5 py-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
            </div>

            {notifLoading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[#6b5e52]">Loading...</p>
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[#6b5e52]">No new notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e5ddd5]">
                {notifications.map((notif: any) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="w-full text-left px-4 py-3 hover:bg-[#f5f1eb] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#2d2a26]">
                          {notif.title}
                        </p>
                        <p className="text-xs text-[#6b5e52] mt-1 line-clamp-2">
                          {notif.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {(() => {
                          const tag = getNotificationTag(notif.type);
                          return tag ? (
                            <span className={tag.className}>{tag.label}</span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    {notif.timestamp && (
                      <p className="text-xs text-[#9A8B7A] mt-2">
                        {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ⭐ PROFILE */}
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="h-11 w-11 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-bold hover:bg-[#8a6f4d] hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
        >
          {session?.user?.name?.[0] || "U"}
        </button>

        {/* ⭐ DROPDOWN */}
        <div
          className={`absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-premium border border-[#e5ddd5] z-50 overflow-hidden
          transition-all duration-200 ease-out
          ${
            open
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="px-5 py-4 border-b border-[#e5ddd5] bg-[#f5f1eb]/50">
            <p className="font-bold text-sm text-[#2d2a26]">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs font-medium text-[#6b5e52] mt-0.5">
              {session?.user?.email || "email@example.com"}
            </p>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="w-full text-left px-3 py-2 text-sm font-medium text-[#2d2a26] hover:bg-[#f5f1eb] hover:text-[#9A8B7A] rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}