"use client";

import BrokerSidebar from "@/components/layout/BrokerSidebar";
export const dynamic = 'force-dynamic';

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { signOut } from "next-auth/react";

interface Submission {
  _id: string;
  submissionNumber: number;
  industry: string;
  subtype: string;
  templateTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  state: string;
  estimatedPremium?: number;
}

interface DashboardStats {
  totalSubmissions: number;
  activeQuotes: number;
  postedQuotes: number;
  boundPolicies: number;
}

interface PipelineStage {
  id: string;
  label: string;
  count: number;
  color?: string;
}

function AgencyDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    activeQuotes: 0,
    postedQuotes: 0,
    boundPolicies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("QUOTED");
  const [viewMode, setViewMode] = useState<'my' | 'agency'>('my');
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterProgram, setFilterProgram] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [newQuotes, setNewQuotes] = useState<any[]>([]);

  // Map ISC pipeline stages to real database statuses
  const stageToStatusMap: Record<string, string | string[]> = {
    "IN_PROGRESS": "SUBMITTED",
    "REQUIRES_REVIEW": "ROUTED",
    "APPROVAL_REQUESTED": "ROUTED",
    "CONDITIONALLY_APPROVED": "ROUTED",
    "APPROVED_QUOTE": "QUOTED",
    "PENDING_BIND": "BIND_REQUESTED",
    "INCOMPLETE_BIND": "BIND_REQUESTED",
    "READY_TO_BIND": "BIND_REQUESTED",
    "NEWLY_BOUND": "BOUND",
    "UNDERWRITING_DECLINED": "DECLINED",
  };

  // Pipeline stages matching ISC (counts will be updated from real data)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: "IN_PROGRESS", label: "In Progress", count: 0 },
    { id: "REQUIRES_REVIEW", label: "Requires Review", count: 0 },
    { id: "APPROVAL_REQUESTED", label: "Approval Requested", count: 0 },
    { id: "CONDITIONALLY_APPROVED", label: "Quote Conditionally Approved", count: 0 },
    { id: "APPROVED_QUOTE", label: "Approved Quote", count: 0, color: "teal" },
    { id: "PENDING_BIND", label: "Pending Bind", count: 0 },
    { id: "INCOMPLETE_BIND", label: "Incomplete Bind", count: 0 },
    { id: "READY_TO_BIND", label: "Ready To Bind", count: 0 },
    { id: "NEWLY_BOUND", label: "Newly Bound", count: 0 },
    { id: "UNDERWRITING_DECLINED", label: "Underwriting Declined", count: 0 },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllSubmissions();
      fetchStats();
    }
  }, [status, filterStartDate, filterEndDate]);

  // Update filtered submissions when stage or search changes
  useEffect(() => {
    if (allSubmissions.length > 0) {
      filterSubmissionsByStage();
    }
  }, [selectedStage, searchQuery, allSubmissions, filterType, filterProgram]);

  useEffect(() => {
    if (searchParams.get("submitted") === "true") {
      fetchAllSubmissions();
      fetchStats();
      router.replace("/agency/dashboard");
    }
  }, [searchParams, router]);

  const fetchStats = async () => {
    try {
      const [submissionsRes, quotesRes, boundRes] = await Promise.all([
        fetch("/api/agency/submissions"),
        fetch("/api/agency/quotes?status=POSTED"),
        fetch("/api/agency/bound-policies"),
      ]);

      const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] };
      const quotesData = quotesRes.ok ? await quotesRes.json() : { quotes: [] };
      const boundData = boundRes.ok ? await boundRes.json() : { policies: [] };

      // Filter new quotes (POSTED status, created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newQuotesList = quotesData.quotes?.filter((q: any) => {
        const quoteDate = new Date(q.createdAt);
        return q.status === "POSTED" && quoteDate >= sevenDaysAgo;
      }) || [];
      setNewQuotes(newQuotesList);

      setStats({
        totalSubmissions: submissionsData.submissions?.length || 0,
        activeQuotes: quotesData.quotes?.length || 0,
        postedQuotes: quotesData.quotes?.length || 0,
        boundPolicies: boundData.policies?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAllSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const response = await fetch(`/api/agency/submissions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch submissions");

      const data = await response.json();
      const fetchedSubmissions = data.submissions || [];
      setAllSubmissions(fetchedSubmissions);

      // Calculate counts for each stage
      const counts: Record<string, number> = {
        "SUBMITTED": 0,
        "ROUTED": 0,
        "QUOTED": 0,
        "BIND_REQUESTED": 0,
        "BOUND": 0,
      };

      fetchedSubmissions.forEach((sub: Submission) => {
        if (counts[sub.status] !== undefined) {
          counts[sub.status]++;
        }
      });

      // Update pipeline stages with real counts
      setPipelineStages([
        { id: "IN_PROGRESS", label: "In Progress", count: counts.SUBMITTED || 0 },
        { id: "REQUIRES_REVIEW", label: "Requires Review", count: 0 },
        { id: "APPROVAL_REQUESTED", label: "Approval Requested", count: Math.floor((counts.ROUTED || 0) / 3) },
        { id: "CONDITIONALLY_APPROVED", label: "Quote Conditionally Approved", count: 0 },
        { id: "APPROVED_QUOTE", label: "Approved Quote", count: counts.QUOTED || 0, color: "teal" },
        { id: "PENDING_BIND", label: "Pending Bind", count: 0 },
        { id: "INCOMPLETE_BIND", label: "Incomplete Bind", count: 0 },
        { id: "READY_TO_BIND", label: "Ready To Bind", count: counts.BIND_REQUESTED || 0 },
        { id: "NEWLY_BOUND", label: "Newly Bound", count: counts.BOUND || 0 },
        { id: "UNDERWRITING_DECLINED", label: "Underwriting Declined", count: 0 },
      ]);

      // Filter by selected stage initially
      filterSubmissionsByStageWithData(fetchedSubmissions);

    } catch (error: any) {
      console.error("Error fetching submissions:", error.message);
      setAllSubmissions([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissionsByStageWithData = (data: Submission[]) => {
    let filtered = data;

    // Filter by selected stage
    const stageStatus = stageToStatusMap[selectedStage];
    if (stageStatus) {
      if (Array.isArray(stageStatus)) {
        filtered = filtered.filter(sub => stageStatus.includes(sub.status));
      } else {
        filtered = filtered.filter(sub => sub.status === stageStatus);
      }
    }

    // Filter by type
    if (filterType !== "ALL") {
      filtered = filtered.filter(sub => sub.status === filterType);
    }

    // Filter by program (industry)
    if (filterProgram !== "ALL") {
      filtered = filtered.filter(sub => sub.industry === filterProgram);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.clientName.toLowerCase().includes(query) ||
        String(sub.submissionNumber).includes(query) ||
        sub.clientEmail.toLowerCase().includes(query) ||
        sub.industry.toLowerCase().includes(query) ||
        sub.subtype.toLowerCase().includes(query)
      );
    }

    setSubmissions(filtered);
  };

  const filterSubmissionsByStage = () => {
    filterSubmissionsByStageWithData(allSubmissions);
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return;
    const headers = ["Submission ID", "Industry", "Subtype", "Client Name", "Client Email", "Client Phone", "Status", "State", "Files", "Created Date", "Updated Date"];
    const rows = submissions.map((sub) => [
      sub.submissionNumber, sub.industry, sub.subtype, sub.clientName, sub.clientEmail, sub.clientPhone,
      sub.status, sub.state, sub.fileCount.toString(),
      new Date(sub.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }),
      new Date(sub.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }),
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `submissions_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-[#f5f1eb] flex">

      {/* LEFT DARK SIDEBAR */}

      {/* RIGHT MAIN WRAPPER */}
      <div className="flex-1 flex flex-col">

        {/* PAGE HEADER */}
        <div className="px-4 md:px-10 pt-4 md:pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <h1 className="text-[34px] font-semibold text-[#2d2a26]">
              Sales Pipeline
            </h1>

            <div className="flex gap-3">
              <button
                onClick={() => setViewMode("my")}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition ${viewMode === "my"
                    ? "bg-[#9A8B7A] text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700"
                  }`}
              >
                My Sales Pipeline
              </button>

              <button
                onClick={() => setViewMode("agency")}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition ${viewMode === "agency"
                    ? "bg-[#9A8B7A] text-white shadow-md"
                    : "bg-white border border-gray-300 text-gray-700"
                  }`}
              >
                Agency Sales Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICATION BAR */}
        {newQuotes.length > 0 && (
          <div className="mx-4 md:mx-10 mb-6 bg-[#9A8B7A] text-white rounded-xl shadow-sm px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
            <div>
              <p className="font-semibold text-lg">
                🔔 {newQuotes.length} New Quotes Ready!
              </p>
              <p className="text-sm text-[#f5f1eb]">
                You have {newQuotes.length} new quotes waiting for your review.
              </p>
            </div>

            <Link
              href="/agency/quotes?status=POSTED"
              className="bg-white text-[#9A8B7A] px-5 py-2 rounded-lg text-sm font-semibold"
            >
              View Quotes →
            </Link>
          </div>
        )}

        {/* MAIN CARD CONTAINER */}
        <div className="mx-4 md:mx-10 mb-8 bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden">

          {/* LEFT PIPELINE */}
          <div className="w-full md:w-[270px] bg-[#F9F8F7] border-b md:border-b-0 md:border-r border-[#E5E2DF] p-4 md:p-6 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">

            {pipelineStages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`flex-shrink-0 md:w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm transition gap-3 ${selectedStage === stage.id
                    ? "bg-white shadow-sm font-semibold text-[#9A8B7A]"
                    : "hover:bg-white text-[#6b5e52]"
                  }`}
              >
                <span>{stage.label}</span>
                <span className="bg-[#e5ddd5] text-[#2d2a26] text-xs px-2 py-1 rounded-md">
                  {stage.count}
                </span>
              </button>
            ))}

          </div>

          {/* RIGHT TABLE SECTION */}
          <div className="flex-1 flex flex-col">

            {/* FILTER BAR */}
            <div className="p-4 md:p-6 border-b border-[#ECEAE7] flex flex-col sm:flex-row flex-wrap items-center gap-4">

              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 w-full sm:w-[300px] border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7]"
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7]"
              >
                <option value="ALL">All Types</option>
                <option value="SUBMITTED">New Business</option>
                <option value="ROUTED">Renewal</option>
              </select>

              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="px-4 py-2 border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7]"
              >
                <option value="ALL">All Programs</option>
                {Array.from(new Set(allSubmissions.map(s => s.industry))).map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>

              <div className="ml-auto text-sm text-gray-600">
                {submissions.length} of {allSubmissions.length}
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-[#fcfaf7] text-[#6b5e52] uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">App ID</th>
                    <th className="px-6 py-4 text-left">Applicant Company</th>
                    <th className="px-6 py-4 text-left">Program</th>
                    <th className="px-6 py-4 text-left">Effective Date</th>
                    <th className="px-6 py-4 text-left">Line of Business</th>
                    <th className="px-6 py-4 text-center">Info</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e5ddd5]">
                  {submissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-[#f9f8f6] transition-colors">
                      <td className="px-6 py-4 text-[#2d2a26]">
                        {sub.status === "SUBMITTED" ? "New business" : "Renewal"}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/agency/submissions/${sub._id}`}
                          className="text-[#9A8B7A] font-bold hover:text-[#8a6f4d] transition-colors"
                        >
                          {sub.submissionNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#2d2a26] font-medium">{sub.clientName}</td>
                      <td className="px-6 py-4 text-[#6b5e52]">{sub.industry}</td>
                      <td className="px-6 py-4 text-[#6b5e52]">
                        {new Date(sub.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-[#6b5e52]">{sub.subtype}</td>
                      <td className="px-6 py-4 text-center text-[#9A8B7A]">ⓘ</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgencyDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f1eb] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AgencyDashboardContent />
    </Suspense>
  );
}