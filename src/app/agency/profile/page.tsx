"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    LogOut,
    Loader2,
    LayoutDashboard,
    ShieldCheck,
    Building
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AgencyInfo from "@/components/profile/AgencyInfo";
import StatsCard from "@/components/profile/StatsCard";
import AgentList from "@/components/profile/AgentList";
import ChangePassword from "@/components/profile/ChangePassword";

function ProfilePageContent() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [agency, setAgency] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [agencyRes, statsRes, agentsRes] = await Promise.all([
                fetch("/api/agency/me"),
                fetch("/api/dashboard/stats"),
                fetch("/api/agents")
            ]);

            const agencyData = await agencyRes.json();
            const statsData = await statsRes.json();
            const agentsData = await agentsRes.json();

            if (!agencyRes.ok) throw new Error(agencyData.error || "Failed to fetch agency");
            if (!statsRes.ok) throw new Error(statsData.error || "Failed to fetch stats");
            if (!agentsRes.ok) throw new Error(agentsData.error || "Failed to fetch agents");

            setAgency(agencyData.agency);
            setStats(statsData.stats);
            setAgents(agentsData.agents);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin");
        } else if (status === "authenticated") {
            fetchData();
        }
    }, [status, router]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#F3F0ED]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#9A8B7A] mx-auto mb-4" />
                    <p className="text-sm text-gray-600 font-medium">Loading profile details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#F3F0ED]">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-6 py-2 bg-[#9A8B7A] text-white rounded-lg font-semibold hover:bg-[#837667] transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const isAdmin = (session?.user as any)?.role === "agency_admin";

    return (
        <div className="flex-1 overflow-y-auto bg-[#F3F0ED]">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2 text-[#9A8B7A] font-bold text-xs uppercase tracking-widest">
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Workspace / Settings</span>
                        </div>
                        <h1 className="text-4xl font-black text-[#2D2D2D] tracking-tight">Agency Profile</h1>
                    </div>

                    <div className="self-start md:self-auto">
                        <button
                            onClick={() => signOut({ callbackUrl: "/signin" })}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-red-100 text-red-500 font-bold hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95 text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* SECTION 2: STATS *
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                    <StatsCard label="Total Policies" value={stats?.totalPolicies || 0} icon={ShieldCheck} />
                    <StatsCard label="Applications" value={stats?.submittedApplications || 0} icon={FileText} color="#3B82F6" />
                    <StatsCard label="Approved Quote" value={stats?.approvedQuotes || 0} icon={CheckCircle} color="#10B981" />
                    <StatsCard label="Newly Bound" value={stats?.newlyBound || 0} icon={Clock} color="#8B5CF6" />
                    <StatsCard label="Canceled" value={stats?.canceled || 0} icon={AlertCircle} color="#EF4444" />
                </div>*/}

                <div className="grid grid-cols-1 gap-10">
                    {/* SECTION 1: AGENCY INFO */}
                    <AgencyInfo agency={agency} />

                    {/* SECTION 3: AGENTS */}
                    <AgentList agents={agents} isAdmin={isAdmin} onAgentAdded={fetchData} />

                    {/* SECTION 4: SECURITY */}
                    <ChangePassword />
                </div>

                {/* FOOTER FOOTNOTE */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-gray-400 font-medium flex items-center justify-center gap-2">
                        <Building className="w-4 h-4" />
                        {agency?.name} • Authorized Agency Workspace
                    </p>
                </div>

            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <DashboardLayout>
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center bg-[#F3F0ED]">
                    <Loader2 className="w-10 h-10 animate-spin text-[#9A8B7A]" />
                </div>
            }>
                <ProfilePageContent />
            </Suspense>
        </DashboardLayout>
    );
}
