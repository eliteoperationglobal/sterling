"use client";

import { SaveStatus } from "@/hooks/useAutoSave";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

/**
 * Save Status Indicator Component
 * 
 * Shows the current auto-save status to the user
 */
export default function SaveStatusIndicator({
  status,
  className = "",
}: SaveStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          text: "Saving...",
          icon: (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ),
          className: "text-blue-600",
        };
      case "saved":
        return {
          text: "Saved",
          icon: (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ),
          className: "text-green-600",
        };
      case "error":
        return {
          text: "Save failed",
          icon: (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ),
          className: "text-red-600",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config || status === "idle") {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium ${config.className} ${className}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}






