"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "NEW_SUBMISSION" | "NEW_QUOTE" | "NEW_NOTE";
  title: string;
  description: string;
  submissionId?: string;
  submissionNumber?: number;
  timestamp: Date;
  read: boolean;
}

export default function NotificationWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  // Determine if user is admin or agency
  const isAdmin = pathname.startsWith("/admin");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs.slice(0, 5)); // Show top 5
        setUnreadCount(notifs.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case "NEW_QUOTE":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "NEW_NOTE":
        return <MessageSquare className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#9A8B7A]" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return "bg-blue-50 border-blue-200";
      case "NEW_QUOTE":
        return "bg-green-50 border-green-200";
      case "NEW_NOTE":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    try {
      // Dismiss the notification on the server
      const response = await fetch(`/api/notifications?id=${notif.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();

        // Remove from local state immediately for instant UI feedback
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Refetch to ensure consistency with server
        setTimeout(fetchNotifications, 500);
        toast.success("Notification cleared");
      } else {
        const error = await response.json();
        console.error("❌ Failed to dismiss notification:", error);
        toast.error(`Could not clear notification: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Exception dismissing notification:", error);
      toast.error("Error clearing notification");
    }

    // Navigate to submission page
    if (notif.submissionId) {
      console.log(`📍 Navigating to submission: ${notif.submissionId}`);
      const basePath = isAdmin ? "/admin/submissions" : "/agency/submissions";
      const targetPath = `${basePath}/${notif.submissionId}`;
      console.log(`🔗 Complete URL: ${basePath}/${notif.submissionId}`);
      
      // Small delay to ensure dismiss completes before navigation
      setTimeout(() => {
        router.push(targetPath);
      }, 100);
    } else {
      console.warn("⚠️ No submissionId in notification:", notif);
      toast.error("Submission ID not found");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5ddd5] shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e5ddd5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#9A8B7A]" />
          <h2 className="text-lg font-bold text-[#2d2a26]">Recent Notifications</h2>
        </div>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      {loading && !notifications.length ? (
        <div className="px-6 py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9A8B7A]"></div>
          <p className="text-sm text-[#6b5e52] mt-3">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Bell className="w-12 h-12 text-[#e5ddd5] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#2d2a26]">No new notifications</p>
          <p className="text-xs text-[#6b5e52] mt-1">Activity will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-[#e5ddd5]">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`w-full text-left px-6 py-4 hover:bg-[#f5f1eb] transition-colors border-l-4 ${getBgColor(
                notif.type
              )}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#2d2a26]">
                    {notif.title}
                  </p>
                  <p className="text-xs text-[#6b5e52] mt-1 line-clamp-2">
                    {notif.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e5ddd5]/30">
                    <span className="text-xs text-[#9A8B7A] font-medium">
                      {notif.submissionNumber && (
                        <>Submission #{notif.submissionNumber}</>
                      )}
                    </span>
                    <span className="text-xs text-[#9A8B7A]">
                      {notif.timestamp &&
                        new Date(notif.timestamp).toLocaleDateString()} at{" "}
                      {notif.timestamp &&
                        new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* Refresh Link */}
          <div className="px-6 py-3 text-center border-t border-[#e5ddd5]">
            <button
              onClick={fetchNotifications}
              className="text-sm font-semibold text-[#9A8B7A] hover:text-[#8a6f4d] transition-colors"
            >
              Refresh Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
