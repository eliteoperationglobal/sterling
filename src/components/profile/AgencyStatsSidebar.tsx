"use client";

import { useState } from "react";
import { LucideIcon, Circle, Clock, Bell, CheckCircle, XCircle } from "lucide-react";

interface StatItem {
    label: string;
    value: number;
    icon: LucideIcon;
    color?: string;
    isActive?: boolean;
    details?: { id: string; name: string }[];
}

interface AgencyStatsSidebarProps {
    stats: {
        totalPolicies: number;
        submittedApplications: number;
        approvedQuotes: number;
        newlyBound: number;
        canceled: number;
        boundPolicies?: { id: string; name: string }[];
        submittedDetails?: { id: string; name: string }[];
    };
}

export default function AgencyStatsSidebar({ stats }: AgencyStatsSidebarProps) {
    const [activeTab, setActiveTab] = useState("All Applications");

    const items: StatItem[] = [
        {
            label: "All Applications",
            value: stats.totalPolicies + stats.submittedApplications, // Or whatever defines "All"
            icon: Circle,
            isActive: activeTab === "All Applications",
            details: stats.submittedDetails
        },
        {
            label: "In Progress",
            value: stats.submittedApplications,
            icon: Clock,
            isActive: activeTab === "In Progress"
        },
        {
            label: "Approved Quote",
            value: stats.approvedQuotes,
            icon: Bell,
            isActive: activeTab === "Approved Quote"
        },
        {
            label: "Newly Bound",
            value: stats.newlyBound,
            icon: CheckCircle,
            isActive: activeTab === "Newly Bound",
            details: stats.boundPolicies
        },
        {
            label: "Cancelled",
            value: stats.canceled,
            icon: XCircle,
            isActive: activeTab === "Cancelled"
        }
    ];

    return (
        <div className="bg-white rounded-3xl p-8 border border-[#ECEAE7] shadow-sm max-w-[400px]">
            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div key={idx}>
                        <button
                            onClick={() => setActiveTab(item.label)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${item.isActive
                                ? "border-2 border-[#9A8B7A] bg-[#F9F8F6]"
                                : "hover:bg-gray-50 border-2 border-transparent"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={`w-5 h-5 ${item.isActive ? "text-[#9A8B7A]" : "text-gray-400"}`} />
                                <span className={`font-bold text-sm ${item.isActive ? "text-[#2D2D2D]" : "text-gray-500"}`}>
                                    {item.label}
                                </span>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-500 min-w-[32px] text-center">
                                {item.value}
                            </span>
                        </button>

                        {/* Details List (Application Number and Name) */}
                        {item.isActive && item.details && item.details.length > 0 && (
                            <div className="mt-4 ml-12 space-y-3 pb-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar border-l-2 border-[#ECEAE7] pl-4">
                                {item.details.map((detail, dIdx) => (
                                    <div key={dIdx} className="flex flex-col">
                                        <span className="text-[10px] font-black text-[#9A8B7A] uppercase">#{detail.id}</span>
                                        <span className="text-xs font-bold text-[#2D2D2D] truncate">{detail.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
