"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";

export default function CancelRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [cancellationDate, setCancellationDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      } else {
        fetchRequests();
      }
    }
  }, [status, session, router]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/cancel-requests");
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (request: any) => {
    setSelectedRequestId(request._id);
    
    let defaultDate = new Date().toISOString().split("T")[0];
    if (request.scheduledDate) {
      defaultDate = new Date(request.scheduledDate).toISOString().split("T")[0];
    }
    
    setCancellationDate(defaultDate);
    setModalOpen(true);
  };

  const submitApprove = async () => {
    if (!selectedRequestId) return;
    try {
      const res = await fetch("/api/admin/cancel-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: selectedRequestId, cancellationDate }),
      });

      const data = await res.json();
      setModalOpen(false);
      setSelectedRequestId(null);
      setCancellationDate("");
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading cancel requests...</p>
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
                <h1
                  className="px-4 py-1.5 rounded-2xl bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 text-[18px] font-semibold inline-block cursor-pointer"
                >
                  Sterling Insurance Services
                </h1>
              </div>

              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Dashboard
                </Link>
                <Link href="/admin/quotes" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Quotes
                </Link>
                <Link href="/admin/quote-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Quote Requests
                </Link>
                <Link href="/admin/bind-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Bind Requests
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Tool Requests
                </Link>
                <Link
                  href="/admin/cancel-requests"
                  className="relative px-4 py-2 text-sm font-semibold text-[#9A8B7A]"
                >
                  Cancel Requests
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A8B7A] rounded-full"></div>
                </Link>
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
                      onClick={() => signOut()}
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
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cancel Requests</h1>
          <p className="text-gray-500">Review and approve policy cancel requests</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-[#f5f1eb] text-left text-sm text-[#6b5e52]">
              <tr>
                <th className="p-4 font-bold">Submission</th>
                <th className="p-4 font-bold">Requested At</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Scheduled Date</th>
                <th className="p-4 text-right font-bold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e5ddd5]">
              {requests.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500">
                    No cancel requests found.
                  </td>
                </tr>
              )}

              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-[#f5f1eb]/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">
                    {r.submissionId?.clientContact?.name || "N/A"}
                  </td>

                  <td className="p-4 text-gray-600">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </td>

                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      r.status === "APPROVED" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {r.status}
                    </span>
                  </td>

                  <td className="p-4 text-gray-600 font-medium">
                    {r.scheduledDate 
                      ? new Date(r.scheduledDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' }) 
                      : "—"}
                  </td>

                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveClick(r);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-rose-200 transition-all active:scale-95"
                    >
                      {r.status === "APPROVED" ? "Update Date" : "Approve Cancel"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl shadow-xl border border-[#e5ddd5] w-full max-w-md overflow-hidden animate-[slideUp_0.3s_ease-out]">
              <div className="px-6 py-4 border-b border-[#e5ddd5] bg-[#f5f1eb]">
                <h3 className="text-lg font-bold text-[#2d2a26]">Approve Cancellation</h3>
              </div>
              <div className="p-6">
                <label className="block text-sm font-semibold text-[#6b5e52] mb-2">
                  Effective Cancellation Date
                </label>
                <input
                  type="date"
                  value={cancellationDate}
                  onChange={(e) => setCancellationDate(e.target.value)}
                  className="w-full px-4 py-2 border border-[#e5ddd5] rounded-xl focus:ring-2 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] outline-none transition-all text-[#2d2a26]"
                />
                <p className="mt-2 text-xs text-gray-500">
                  If you select a future date, the policy will remain active and will automatically be cancelled on that date.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-[#e5ddd5] flex justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApprove}
                  disabled={!cancellationDate}
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}