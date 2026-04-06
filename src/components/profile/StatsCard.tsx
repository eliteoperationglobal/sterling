import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
    color?: string;
}

export default function StatsCard({ label, value, icon: Icon, color = "#9A8B7A" }: StatsCardProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-[#ECEAE7] shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
            </div>

            <div className="px-3 py-1 bg-[#F4F2F0] rounded-lg text-sm font-black text-gray-600 min-w-[36px] text-center border border-gray-100 shadow-sm">
                {value}
            </div>
        </div>
    );
}
