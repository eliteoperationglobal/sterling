"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Menu, Users, UserPlus, CheckCircle, ArrowLeft, 
  FileText, Calendar, DollarSign, Search, Filter, MoreHorizontal
} from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";
import { toast } from "sonner";

export default function AuditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // "queue" | "options" | "existing" | "new"
  const [view, setView] = useState<"queue" | "options" | "existing" | "new">("queue");
  
  // Submissions state for existing users
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Record<string, boolean>>({});
  const [submissionSearch, setSubmissionSearch] = useState("");
  
  // Create New User state
  const [newClientName, setNewClientName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAgency, setNewAgency] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  
  const formatPhoneNumber = (value: string) => {
    const cleaned = ('' + value).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return value;
    if (!match[2]) return match[1];
    if (!match[3]) return `(${match[1]}) ${match[2]}`;
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  };

  // Audits state for the queue
  const [audits, setAudits] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [carrierFilter, setCarrierFilter] = useState("All Carriers");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [dueDateStart, setDueDateStart] = useState("");
  const [dueDateEnd, setDueDateEnd] = useState("");

  // Format program names like in Submission page
  const getDisplayProgramName = (rawName: string) => {
    if (!rawName) return "General Liability";
    const lowerName = rawName.toLowerCase();
    if (lowerName === "advantage contractor gl" || lowerName === "construction") return "Construction";
    if (lowerName === "construction equipment") return "Contractors Equipment";
    if (lowerName.includes("manufacturer") || lowerName === "manufacturing") return "Manufacturing";
    
    // Capitalize first letter of each word as fallback
    return lowerName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredAudits = audits.filter(audit => {
    if (statusFilter !== "All Statuses" && audit.status !== statusFilter) return false;
    if (carrierFilter !== "All Carriers" && audit.carrier !== carrierFilter && audit.carrier !== "Unknown") return false;
    if (typeFilter !== "All Types" && getDisplayProgramName(audit.program) !== typeFilter) return false;
    
    if (sourceFilter !== "All Sources") {
      const isManual = audit.submissionId?.payload?.source === "MANUAL_AUDIT";
      if (sourceFilter === "Manual" && !isManual) return false;
      if (sourceFilter === "Portal" && isManual) return false;
    }
    
    if (dueDateStart) {
      if (new Date(audit.dueDate) < new Date(dueDateStart)) return false;
    }
    if (dueDateEnd) {
      const end = new Date(dueDateEnd);
      end.setHours(23, 59, 59, 999);
      if (new Date(audit.dueDate) > end) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = audit.namedInsured?.toLowerCase().includes(query);
      const matchPolicy = audit.policyNumber?.toLowerCase().includes(query);
      const matchAuditId = audit.auditId?.toLowerCase().includes(query);
      if (!matchName && !matchPolicy && !matchAuditId) return false;
    }
    return true;
  });

  // Extract unique carriers and types for dropdowns
  const uniqueCarriers = Array.from(new Set(audits.map(a => a.carrier).filter(Boolean)));
  
  const rawUniqueTypes = Array.from(new Set(audits.map(a => a.program).filter(Boolean)));
  // Extract unique formatted types for the dropdown
  const uniqueTypes = Array.from(new Set(rawUniqueTypes.map(getDisplayProgramName)));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      } else {
        fetchAudits();
      }
    }
  }, [status, router]);

  const fetchAudits = async () => {
    setLoadingAudits(true);
    try {
      const res = await fetch("/api/admin/audits");
      const data = await res.json();
      if (data.success) {
        setAudits(data.audits);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audits");
    } finally {
      setLoadingAudits(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/submissions");
      const data = await res.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
      } else {
        console.warn("API returned no submissions:", data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleExistingUserClick = () => {
    setView("existing");
    fetchSubmissions();
  };

  const toggleSelection = (id: string) => {
    setSelectedSubmissions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDone = async () => {
    const selectedIds = Object.keys(selectedSubmissions).filter(id => selectedSubmissions[id]);
    if (selectedIds.length === 0) {
      toast.error("Please select at least one policy to audit.");
      return;
    }
    
    try {
      const res = await fetch("/api/admin/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionIds: selectedIds })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Successfully created ${data.count} audits!`);
        setView("queue");
        setSelectedSubmissions({});
        fetchAudits(); // Refresh queue
      } else {
        toast.error(data.error || "Failed to create audits");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while creating audits");
    }
  };

  const handleCreateProfile = async () => {
    if (!newClientName || !newEmail || !newPhone || !newAgency || !newIndustry) {
      toast.error("Please fill in all the fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/manual-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: newClientName,
          email: newEmail,
          phone: newPhone,
          agencyName: newAgency,
          industry: newIndustry
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Manual audit profile created successfully!");
        sessionStorage.setItem("returnToAudit", "true");
        router.push(`/admin/submissions/${data.submissionId}?tab=Audits`);
      } else {
        toast.error(data.error || "Failed to create profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Computations for Audit Queue Dashboard
  const openAudits = audits.filter(a => a.status !== "COMPLETE" && a.status !== "CANCELLED");
  const dueIn14Days = openAudits.filter(a => {
    const dueDate = new Date(a.dueDate);
    const in14Days = new Date();
    in14Days.setDate(in14Days.getDate() + 14);
    return dueDate <= in14Days;
  }).length;
  
  let docsTotal = 0;
  let docsReceived = 0;
  openAudits.forEach(a => {
    if (a.documents && a.documents.length > 0) {
      docsTotal += a.documents.length;
      docsReceived += a.documents.filter((d: any) => d.status === "RECEIVED" || d.status === "VERIFIED").length;
    }
  });
  const docsReceivedPercent = docsTotal > 0 ? Math.round((docsReceived / docsTotal) * 100) : 0;
  
  const additionalPremiumIssued = audits.reduce((acc, a) => {
    return acc + (a.netChange > 0 ? a.netChange : 0); // Simplified logic
  }, 0);

  const getStatusPillColor = (status: string) => {
    switch(status) {
      case "REQUESTED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "DOCS_RECEIVED": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "UNDERWRITER_REVIEW": return "bg-amber-100 text-amber-700 border-amber-200";
      case "APPROVED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "FINALIZED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "INVOICE_DUE": return "bg-red-100 text-red-700 border-red-200";
      case "COMPLETE": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4 md:gap-10">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-[#9A8B7A]" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <h1 className="px-4 py-1.5 rounded-2xl bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 text-[18px] font-semibold inline-block cursor-pointer">
                  Sterling Insurance Services
                </h1>
              </div>

              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Dashboard
                </Link>
                <Link href="/admin/things-to-do" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Things To Do
                </Link>
                <Link href="/admin/quotes" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Quotes
                </Link>
                <Link href="/admin/quote-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Quote Requests
                </Link>
                <Link href="/admin/bind-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Bind Requests
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Tool Requests
                </Link>
                <Link href="/admin/cancel-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Cancel Requests
                </Link>
                <button onClick={() => setView("queue")} className="relative px-4 py-2 text-sm font-semibold text-[#9A8B7A]">
                  Audit
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A8B7A] rounded-full"></div>
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-[#2d2a26]">{session?.user?.name || "Administrator"}</p>
                <p className="text-xs text-[#6b5e52]">System Admin</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-10 h-10 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  {session?.user?.name?.[0] || "U"}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-[#e5ddd5] overflow-hidden animate-[fadeIn_.2s_ease] z-50">
                    <div className="px-4 py-3 border-b bg-[#f5f1eb]/50 border-[#e5ddd5]">
                      <p className="text-sm font-semibold text-[#2d2a26]">Sterling Insurance</p>
                      <p className="text-xs text-[#6b5e52] mt-0.5">Admin Panel</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/signin" })}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-[#2d2a26] hover:bg-[#f5f1eb] hover:text-[#9A8B7A] transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        
        {/* ===================== AUDIT QUEUE VIEW ===================== */}
        {view === "queue" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Queue</h1>
                <p className="text-gray-500 mt-1">Manage and track policy audits, required documents, and final invoicing.</p>
              </div>
              <button
                onClick={() => setView("options")}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span> Start Manual Audit
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Open Audits</p>
                  <p className="text-2xl font-bold text-gray-900">{openAudits.length}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Due in Next 14 Days</p>
                  <p className="text-2xl font-bold text-gray-900">{dueIn14Days}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Documents Received</p>
                  <p className="text-2xl font-bold text-gray-900">{docsReceivedPercent}%</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">Additional Premium Issued</p>
                  <p className="text-2xl font-bold text-gray-900">${additionalPremiumIssued.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-t-2xl border border-[#e5ddd5] border-b-0 flex flex-wrap gap-4 items-center">
              <div className="w-48">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Status</label>
                <select 
                  className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-rose-500 bg-gray-50 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="REQUESTED">Requested</option>
                  <option value="DOCS_RECEIVED">Docs Received</option>
                  <option value="UNDERWRITER_REVIEW">Underwriter Review</option>
                  <option value="FINALIZED">Finalized</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="w-48">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Carrier</label>
                <select 
                  className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-rose-500 bg-gray-50 outline-none"
                  value={carrierFilter}
                  onChange={(e) => setCarrierFilter(e.target.value)}
                >
                  <option value="All Carriers">All Carriers</option>
                  {uniqueCarriers.map((c: any) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Source</label>
                <select 
                  className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-rose-500 bg-gray-50 outline-none"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="All Sources">All Sources</option>
                  <option value="Portal">Portal Submissions</option>
                  <option value="Manual">Manual Audits</option>
                </select>
              </div>
              <div className="w-40">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Audit Type</label>
                <select 
                  className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-rose-500 bg-gray-50 outline-none"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All Types">All Types</option>
                  {uniqueTypes.map((t: any) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="w-64">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Due Date Range</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={dueDateStart}
                    onChange={(e) => setDueDateStart(e.target.value)}
                    className="w-full text-xs border-gray-200 rounded-lg p-2 focus:ring-rose-500 bg-gray-50 outline-none" 
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="date" 
                    value={dueDateEnd}
                    onChange={(e) => setDueDateEnd(e.target.value)}
                    className="w-full text-xs border-gray-200 rounded-lg p-2 focus:ring-rose-500 bg-gray-50 outline-none" 
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Search by insured name, policy number..." 
                    className="w-full pl-9 text-sm border-gray-200 rounded-lg p-2 focus:ring-rose-500 bg-gray-50 outline-none" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-end h-[52px]">
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All Statuses");
                    setCarrierFilter("All Carriers");
                    setTypeFilter("All Types");
                    setSourceFilter("All Sources");
                    setDueDateStart("");
                    setDueDateEnd("");
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#e5ddd5] rounded-b-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#fcfaf8] border-b border-[#e5ddd5]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Audit / Policy</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Named Insured</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Audit Period</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Exposure / Estimate</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Documents</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ddd5]">
                  {loadingAudits ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-500">Loading audits...</td></tr>
                  ) : filteredAudits.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-500">No audits match your filters.</td></tr>
                  ) : (
                    filteredAudits.map((audit) => {
                      const docsTotal = audit.documents?.length || 0;
                      const docsReceived = audit.documents?.filter((d: any) => d.status === "RECEIVED" || d.status === "VERIFIED").length || 0;
                      
                      const dueDateObj = new Date(audit.dueDate);
                      const daysLeft = Math.ceil((dueDateObj.getTime() - Date.now()) / (1000 * 3600 * 24));
                      const isOverdue = daysLeft < 0;

                      return (
                        <tr key={audit._id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-gray-900">{audit.auditId}</p>
                              {audit.submissionId?.payload?.source === "MANUAL_AUDIT" && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-sm border border-gray-200 uppercase tracking-wider" title="Created Manually">Manual</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{audit.policyNumber}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-gray-900">{audit.namedInsured}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{audit.agencyId?.name || "No Agency"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700 whitespace-nowrap">
                              {new Date(audit.auditPeriodStart).toLocaleDateString("en-US")} - {new Date(audit.auditPeriodEnd).toLocaleDateString("en-US")}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-gray-900">
                              {audit.auditedExposure > 0 ? `$${audit.auditedExposure.toLocaleString()}` : "Pending"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Est. ${audit.estimatedExposure?.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>{docsReceived} of {docsTotal}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full ${docsReceived === docsTotal && docsTotal > 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                style={{ width: `${docsTotal > 0 ? (docsReceived / docsTotal) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusPillColor(audit.status)}`}>
                              {getStatusLabel(audit.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{dueDateObj.toLocaleDateString("en-US")}</p>
                            <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `in ${daysLeft} days`}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  if (typeof window !== "undefined") {
                                    sessionStorage.setItem("sterling_admin_back_url", "/admin/audit");
                                  }
                                  router.push(`/admin/submissions/${audit.submissionId}?tab=Audits`);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition inline-block text-center"
                              >
                                View
                              </button>
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="p-4 border-t border-[#e5ddd5] text-sm text-gray-500 text-right">
                Showing {filteredAudits.length} audits
              </div>
            </div>
          </div>
        )}

        {/* ===================== OPTIONS VIEW ===================== */}
        {view === "options" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center max-w-2xl mx-auto">
              <button
                onClick={() => setView("queue")}
                className="flex items-center gap-2 text-[#9A8B7A] hover:text-[#7A6F64] font-medium text-sm mb-6 transition-colors justify-center mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Audit Queue
              </button>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Audit Center</h1>
              <p className="text-lg text-gray-600">Select an option to begin the auditing process</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
              <button
                onClick={handleExistingUserClick}
                className="group relative bg-white rounded-3xl border border-[#e5ddd5] p-10 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-300 text-left overflow-hidden flex flex-col items-center justify-center text-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 opacity-[0.05] group-hover:opacity-[0.1] rounded-full -mr-8 -mt-8 transition-opacity"></div>
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Existing User</h3>
                <p className="text-gray-500 font-medium">Audit existing policies and submissions currently active in the platform.</p>
              </button>

              <button
                onClick={() => setView("new")}
                className="group relative bg-white rounded-3xl border border-[#e5ddd5] p-10 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-300 text-left overflow-hidden flex flex-col items-center justify-center text-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-[0.05] group-hover:opacity-[0.1] rounded-full -mr-8 -mt-8 transition-opacity"></div>
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Create New User</h3>
                <p className="text-gray-500 font-medium">Setup a brand new user profile specifically for auditing purposes.</p>
              </button>
            </div>
          </div>
        )}

        {/* ===================== EXISTING USER (SUBMISSION SELECTION) ===================== */}
        {view === "existing" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <button
                  onClick={() => setView("options")}
                  className="flex items-center gap-2 text-[#9A8B7A] hover:text-[#7A6F64] font-medium text-sm mb-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Audit Options
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Select Policies for Audit</h1>
                <p className="text-gray-500 mt-1">Select the existing submissions you want to add to the audit section</p>
              </div>
              <button
                onClick={handleDone}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
              >
                <CheckCircle className="w-5 h-5" />
                Done Selecting
              </button>
            </div>

            <div className="mb-6 relative max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client name, policy number, or agency..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5ddd5] rounded-xl focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent outline-none transition shadow-sm text-sm"
              />
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <div className="relative w-10 h-10 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-[#6b5e52]">Loading submissions...</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[#f5f1eb] text-left text-sm text-[#6b5e52]">
                    <tr>
                      <th className="p-4 font-bold w-12 text-center">Select</th>
                      <th className="p-4 font-bold">Client / Company Name</th>
                      <th className="p-4 font-bold">Agency</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5ddd5]">
                    {(() => {
                      const filteredSubs = submissions.filter((sub: any) => {
                        // Only show BOUND (or IN_FORCE)
                        if (sub.status !== "BOUND" && sub.status !== "IN_FORCE") return false;
                        // Match search text
                        if (submissionSearch) {
                          const q = submissionSearch.toLowerCase();
                          const client = String(sub.clientName || "").toLowerCase();
                          const num = String(sub.submissionNumber || "").toLowerCase();
                          const agency = String(sub.agencyName || "").toLowerCase();
                          if (!client.includes(q) && !num.includes(q) && !agency.includes(q)) return false;
                        }
                        return true;
                      });

                      if (filteredSubs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">No matching bound submissions found.</td>
                          </tr>
                        );
                      }

                      return filteredSubs.map((sub: any) => (
                        <tr 
                          key={sub._id} 
                          className={`hover:bg-[#fcfaf8] transition-colors cursor-pointer ${selectedSubmissions[sub._id] ? 'bg-amber-50/50' : ''}`}
                          onClick={() => toggleSelection(sub._id)}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={!!selectedSubmissions[sub._id]}
                              onChange={() => {}}
                              className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{sub.clientName || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{sub.submissionNumber || "No Number"}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-gray-700 font-medium">{sub.agencyName || "N/A"}</p>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold uppercase tracking-wide">
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== CREATE NEW USER VIEW ===================== */}
        {view === "new" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <button
                  onClick={() => setView("options")}
                  className="flex items-center gap-2 text-[#9A8B7A] hover:text-[#7A6F64] font-medium text-sm mb-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Audit Options
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
                <p className="text-gray-500 mt-1">Setup a new manual audit profile for a client.</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-[#e5ddd5] p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client / Company Name</label>
                  <input 
                    type="text" 
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Enter company or client name" 
                    className="w-full px-4 py-3 border border-[#e5ddd5] rounded-xl bg-[#fcfaf8] focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="client@example.com" 
                    className="w-full px-4 py-3 border border-[#e5ddd5] rounded-xl bg-[#fcfaf8] focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    value={newPhone}
                    onChange={(e) => setNewPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(555) 000-0000" 
                    maxLength={14}
                    className="w-full px-4 py-3 border border-[#e5ddd5] rounded-xl bg-[#fcfaf8] focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Associated Agency</label>
                  <select 
                    value={newAgency}
                    onChange={(e) => setNewAgency(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e5ddd5] rounded-xl bg-[#fcfaf8] focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                  >
                    <option value="">Select agency name</option>
                    <option value="Blue Angel Insurance">Blue Angel Insurance</option>
                    <option value="Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services">Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services</option>
                    <option value="Patrick Arias Insurance">Patrick Arias Insurance</option>
                    <option value="SJJ Insurance Services">SJJ Insurance Services</option>
                    <option value="Texas Commercial Liability Services">Texas Commercial Liability Services</option>
                    <option value="Titan Commercial Insurance Solutions">Titan Commercial Insurance Solutions</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Industry / Program</label>
                  <select 
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e5ddd5] rounded-xl bg-[#fcfaf8] focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                  >
                    <option value="">Select Industry</option>
                    <option value="construction">Construction</option>
                    <option value="manufacturing">Manufacturing</option>
                  </select>
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-4 border-t border-[#e5ddd5] pt-8">
                <button 
                  onClick={() => setView("options")} 
                  className="px-8 py-3.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={loading}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#2d2a26] to-[#1a1815] hover:from-black hover:to-black text-white font-semibold text-sm rounded-xl shadow-lg shadow-gray-300 transition-all hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? "Creating Profile..." : "Create Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
