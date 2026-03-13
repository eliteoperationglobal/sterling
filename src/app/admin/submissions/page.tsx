"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Submission {
  _id: string;
  submissionId: string;
  agencyName: string;
  clientName: string;
  clientEmail: string;
  industry: string;
  subtype: string;
  programId?: string;
  programName?: string;
  status: string;
  createdAt: string;
  applicationPdfUrl?: string;
  submittedToCarrierAt?: string;
}

export default function AdminSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      // Only system_admin can access admin pages
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubmissions();
    }
  }, [status, statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const url = statusFilter !== "ALL"
        ? `/api/admin/submissions?status=${statusFilter}`
        : "/api/admin/submissions";
      const response = await fetch(url);
      const data = await response.json();
      console.log("Admin submissions API response:", data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.submissions) {
        setSubmissions(data.submissions);
        console.log(`Loaded ${data.submissions.length} submissions`);
      } else if (data.error) {
        console.error("API Error:", data.error);
        setError(data.error);
      }
    } catch (err: any) {
      console.error("Error fetching submissions:", err);
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200";
      case "ROUTED":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200";
      case "QUOTED":
        return "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200";
      case "BIND_REQUESTED":
        return "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200";
      case "BOUND":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                <span className="text-white font-bold text-lg">SP</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Sterling Portal
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 font-medium">
                {session?.user?.name || session?.user?.email}
              </span>
              <button
                onClick={() => window.location.href = '/api/auth/signout'}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                All Applications
              </h1>
              <p className="text-gray-600 font-medium">
                View submitted applications and enter quotes • {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
              </p>
            </div>

            {/* Filter Section */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <label className="text-sm text-gray-600 font-semibold">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ROUTED">Routed</option>
                <option value="QUOTED">Quoted</option>
                <option value="BIND_REQUESTED">Bind Requested</option>
                <option value="BOUND">Bound</option>
                <option value="DECLINED">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        )}

        {submissions.length === 0 && !loading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Submissions Found</h3>
            <p className="text-gray-600 mb-4">
              Check the browser console (F12) for API response details.
            </p>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3 inline-block">
              Make sure you've run the seed script: <code className="font-mono font-semibold text-blue-600">npm run seed</code>
            </p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Agency
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900">{submission.agencyName || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="font-bold text-gray-900">{submission.clientName || "N/A"}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{submission.clientEmail || ""}</div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="font-semibold text-gray-900">
                          {submission.programName || submission.industry || "N/A"}
                        </div>
                        {submission.programId && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            ID: {submission.programId}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${getStatusBadgeColor(
                            submission.status
                          )}`}
                        >
                          {submission.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="font-semibold text-gray-900">{new Date(submission.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(submission.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href={`/admin/submissions/${submission._id}`}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-lg border border-blue-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                          >
                            <svg className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Link>
                          <a
                            href={`/api/admin/submissions/${submission._id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 rounded-lg border border-gray-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                          >
                            <svg className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF
                          </a>
                          {/* {submission.status === "SUBMITTED" && ( */}
                          {["SUBMITTED", "APPROVAL_REQUESTED"].includes(
                            submission.status
                          ) &&
                            <>
                              <Link
                                href={`/admin/submissions/${submission._id}/quote`}
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-lg border border-emerald-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                              >
                                <svg className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Enter Quote
                              </Link>

                              {/* Renter Quote – opens same quote screen with renter defaults */}
                              {/* <Link
                                href={`/admin/submissions/${submission._id}/quote?quoteType=renter`}
                                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-gradient-to-r from-indigo-50 to-sky-50 hover:from-indigo-100 hover:to-sky-100 rounded-lg border border-indigo-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                              >
                                <svg
                                  className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10l9-7 9 7v7a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2v-7z"
                                  />
                                </svg>
                                Renter Quote
                              </Link> */}
                            </>
                          }

                          {["QUOTED", "BIND_REQUESTED", "BOUND"].includes(
                            submission.status
                          ) && (
                              <Link
                                href={`/admin/submissions/${submission._id}/quote`}
                                className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg border border-amber-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                              >
                                <svg
                                  className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12H9m3-3v6m8-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Re-enter Quote
                              </Link>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

