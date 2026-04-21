"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface ToolRequest {
  _id: string;
  agencyId: {
    _id: string;
    name: string;
    email: string;
  };
  requestType: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  requestData: any;
  resultDocumentUrl?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function ProcessToolRequestPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [request, setRequest] = useState<ToolRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/signin");
    } else if (authStatus === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "admin" && userRole !== "system_admin") {
        router.push("/signin");
      } else {
        fetchRequest();
      }
    }
  }, [authStatus, session, router, requestId]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tool-requests/${requestId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch request");
      }

      const data = await res.json();
      setRequest(data.request);
      setStatus(data.request.status);
      setAdminNotes(data.request.adminNotes || "");
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to load request", {
        description: error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch(`/api/admin/tool-requests/${requestId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success("Request updated successfully!");
      fetchRequest();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to update request", {
        description: error.message || "An error occurred",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("requestId", requestId);

      const res = await fetch(`/api/admin/tool-requests/${requestId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      toast.success("Document uploaded successfully!");
      setSelectedFile(null);
      fetchRequest();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document", {
        description: error.message || "An error occurred",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LOSS_RUNS: "Loss Runs",
      BOR: "Broker of Record",
      MVR: "MVR Report",
      CREDIT_REPORT: "Credit Report",
      OTHER_REPORT: "Other Report",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      PENDING: { bg: "bg-[#fcfaf7]", text: "text-[#8a6f4d]", border: "border-[#e5ddd5]" },
      IN_PROGRESS: { bg: "bg-[#f5f1eb]", text: "text-[#9A8B7A]", border: "border-[#e5ddd5]" },
      COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      DECLINED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    };
    return colors[status] || colors.PENDING;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-[#fcfaf7] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-[#2d2a26] mb-1">Request Not Found</p>
          <p className="text-sm text-[#6b5e52] mb-4">The tool request you're looking for doesn't exist</p>
          <Link
            href="/admin/tool-requests"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#9A8B7A] hover:bg-[#8a6f4d] rounded-xl shadow-lg shadow-gray-200/30 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tool Requests
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = getStatusColor(request.status);

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <Link href="/admin/dashboard" className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 animate-pulse transition-all duration-500"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:shadow-rose-600/60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                    <div className="relative">
                      <span className="text-white font-black text-lg tracking-tighter drop-shadow-lg">SP</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100"></div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-lg tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">Sterling Portal</span>
                    <div className="px-2 py-0.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-md">
                      <span className="text-[10px] font-black text-rose-600 tracking-wider">ADMIN</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold -mt-0.5 tracking-wide">Control Center</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">{(session?.user as any)?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 font-medium">{(session?.user as any)?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="group relative px-4 py-2 text-sm font-semibold text-[#2d2a26] hover:text-white bg-[#f5f1eb] hover:bg-[#9A8B7A] rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <Link
            href="/admin/tool-requests"
            className="inline-flex items-center gap-2 text-[#9A8B7A] hover:text-[#8a6f4d] font-medium text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tool Requests
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {getRequestTypeLabel(request.requestType)} Request
              </h1>
              <p className="text-sm text-gray-600 font-medium mt-1">Request ID: {request._id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusColors.bg} ${statusColors.text} border ${statusColors.border} shadow-sm`}>
              {request.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Request Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Agency</p>
                  <p className="text-base font-semibold text-gray-900">{request.agencyId.name}</p>
                  <p className="text-sm text-gray-600">{request.agencyId.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Client Name</p>
                    <p className="text-base font-semibold text-gray-900">{request.clientName}</p>
                  </div>
                  {request.clientEmail && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Client Email</p>
                      <p className="text-base font-semibold text-gray-900">{request.clientEmail}</p>
                    </div>
                  )}
                  {request.clientPhone && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium mb-1">Client Phone</p>
                      <p className="text-base font-semibold text-gray-900">{request.clientPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Submitted On</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(request.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request-Specific Data */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Request Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.requestType === "LOSS_RUNS" && (
                  <>
                    {request.requestData.carrierName && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Carrier Name</p>
                        <p className="text-base font-semibold text-gray-900">{request.requestData.carrierName}</p>
                      </div>
                    )}
                    {request.requestData.policyNumber && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Policy Number</p>
                        <p className="text-base font-semibold text-gray-900">{request.requestData.policyNumber}</p>
                      </div>
                    )}
                    {request.requestData.yearsRequested && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Years Requested</p>
                        <p className="text-base font-semibold text-gray-900">{request.requestData.yearsRequested} years</p>
                      </div>
                    )}
                  </>
                )}

                {request.requestType === "BOR" && (
                  <>
                    {request.requestData.currentBrokerName && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Current Broker</p>
                        <p className="text-base font-semibold text-gray-900">{request.requestData.currentBrokerName}</p>
                      </div>
                    )}
                    {request.requestData.effectiveDateBOR && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Effective Date</p>
                        <p className="text-base font-semibold text-gray-900">
                          {new Date(request.requestData.effectiveDateBOR).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {(request.requestType === "MVR" || request.requestType === "CREDIT_REPORT") && (
                  <>
                    {request.requestData.dateOfBirth && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">Date of Birth</p>
                        <p className="text-base font-semibold text-gray-900">
                          {new Date(request.requestData.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {request.requestData.driverLicenseNumber && (
                      <div>
                        <p className="text-sm text-gray-500 font-medium mb-1">License Number</p>
                        <p className="text-base font-semibold text-gray-900">{request.requestData.driverLicenseNumber}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {request.requestData.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 font-medium mb-1">Additional Notes</p>
                  <p className="text-base text-gray-900">{request.requestData.notes}</p>
                </div>
              )}
            </div>

            {/* Result Document */}
            {request.resultDocumentUrl && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Result Document</h2>
                <a
                  href={request.resultDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#9A8B7A] text-white rounded-xl hover:bg-[#8a6f4d] shadow-lg shadow-gray-200/30 hover:shadow-gray-300 font-semibold text-sm transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Result Document
                </a>
              </div>
            )}
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Update Status */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Update Status</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Add notes about this request..."
                  />
                </div>

                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="w-full px-4 py-2 text-sm font-semibold text-white bg-[#9A8B7A] hover:bg-[#8a6f4d] rounded-xl shadow-lg shadow-gray-200/30 hover:shadow-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {updating ? "Updating..." : "Update Request"}
                </button>
              </div>
            </div>

            {/* Upload Document */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Result</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Result Document
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="w-full text-sm text-[#6b5e52] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#fcfaf7] file:text-[#9A8B7A] hover:file:bg-[#f5f1eb] cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-600 mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleUploadDocument}
                  disabled={!selectedFile || uploadingFile}
                  className="w-full px-4 py-2 text-sm font-semibold text-white bg-[#8a6f4d] hover:bg-[#6b5e52] rounded-xl shadow-lg shadow-gray-200/30 hover:shadow-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {uploadingFile ? "Uploading..." : "Upload Document"}
                </button>

                <p className="text-xs text-gray-500">
                  Upload the result document (Loss Runs, BOR letter, report, etc.) for the agency to download.
                </p>
              </div>
            </div>

            {/* Processing History */}
            {request.processedAt && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/60 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-900 mb-2">Processing History</p>
                <p className="text-xs text-gray-600">
                  Processed: {new Date(request.processedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </p>
                {request.processedBy && (
                  <p className="text-xs text-gray-600 mt-1">
                    By: {request.processedBy.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
