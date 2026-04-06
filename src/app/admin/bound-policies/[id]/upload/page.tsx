"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface Quote {
  _id: string;
  carrierId?: { name: string };
  status: string;
  policyType?: string;
  binderUrl?: string;
  policyDocsUrl?: string;
}

interface Submission {
  _id: string;
  clientContact: {
    name: string;
    email: string;
  };
  programName?: string;
  quotes?: Quote[];
  finalPolicyDocuments?: {
    finalBinderPdfUrl?: string;
    finalPolicyPdfUrl?: string;
    certificateOfInsuranceUrl?: string;
    finalBinderUploadedAt?: string;
    finalPolicyUploadedAt?: string;
    certificateUploadedAt?: string;
    uploadedByAdminId?: string;
  };
}

export default function UploadFinalDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // State to hold staged files mapped by Quote ID so switching tabs retains memory
  const [stagedFiles, setStagedFiles] = useState<Record<string, { binder: File | null; policy: File | null }>>({});
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [globalSelectedQuoteId, setGlobalSelectedQuoteId] = useState<string>("");

  const boundQuotes = submission?.quotes?.filter(q => q.status === "BOUND") || [];
  const selectedQuote = globalSelectedQuoteId ? boundQuotes.find(q => q._id === globalSelectedQuoteId) : null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      } else {
        fetchSubmission();
      }
    }
  }, [status, session, router, submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/submissions/${submissionId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch submission");
      }

      const data = await res.json();

      // The API returns quotes outside the submission object, so we merge them here
      const submissionWithQuotes = {
        ...data.submission,
        quotes: data.quotes || []
      };

      setSubmission(submissionWithQuotes);

      const bQuotes = data.quotes?.filter((q: any) => q.status === "BOUND") || [];
      if (bQuotes.length > 0) {
        setGlobalSelectedQuoteId(bQuotes[0]._id);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load submission", {
        description: err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'binder' | 'policy' | 'certificate'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Invalid file type", {
          description: "Please upload a PDF file",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 10MB",
        });
        return;
      }

      if (type === 'certificate') {
        setCertificateFile(file);
      } else {
        setStagedFiles(prev => ({
          ...prev,
          [globalSelectedQuoteId]: {
            ...prev[globalSelectedQuoteId],
            [type]: file
          }
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!globalSelectedQuoteId) {
      toast.error("No policy selected", {
        description: "Please select a bound policy to upload documents for",
      });
      return;
    }

    const currentStaged = stagedFiles[globalSelectedQuoteId] || { binder: null, policy: null };
    const { binder: finalBinderFile, policy: finalPolicyFile } = currentStaged;

    if (!finalBinderFile && !finalPolicyFile && !certificateFile) {
      toast.error("No files selected", {
        description: "Please select at least one file to upload (Binder, Policy, or COI)",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("submissionId", submissionId);
      formData.append("quoteId", globalSelectedQuoteId);
      formData.append("policyType", selectedQuote?.policyType || "GENERAL_LIABILITY");
      if (finalBinderFile) formData.append("finalBinderPdf", finalBinderFile);
      if (finalPolicyFile) formData.append("finalPolicyPdf", finalPolicyFile);
      if (certificateFile) formData.append("certificate", certificateFile);

      const res = await fetch("/api/admin/bound-policies/upload-documents", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseError) {
        const text = await res.text();
        throw new Error(`Upload failed: ${res.status} ${res.statusText}. Response body: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Failed to upload documents (${res.status})`);
      }

      toast.success("Documents uploaded successfully!", {
        description: "The agency has been notified",
      });

      // Clear the staged files for the successful quote
      setStagedFiles(prev => ({
        ...prev,
        [globalSelectedQuoteId]: { binder: null, policy: null }
      }));
      setCertificateFile(null);
      fetchSubmission();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Failed to upload documents", {
        description: err.message || "An error occurred",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-rose-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">Submission Not Found</p>
          <p className="text-sm text-gray-600 mb-4">The submission you're looking for doesn't exist</p>
          <Link
            href="/admin/bound-policies"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Bound Policies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
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
                className="group relative px-4 py-2 text-sm font-semibold text-gray-700 hover:text-white bg-gradient-to-r from-gray-100 to-gray-200 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
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
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <Link
            href="/admin/bound-policies"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Bound Policies
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Upload Final Policy Documents</h1>
              <p className="text-sm text-gray-600 font-medium mt-0.5">
                Client: {submission.clientContact.name}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upload Documents</h2>

            {/* Policy Selector Dropdown */}
            {boundQuotes.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Target Policy:</label>
                <select
                  value={globalSelectedQuoteId}
                  onChange={(e) => setGlobalSelectedQuoteId(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
                >
                  {boundQuotes.map((q) => (
                    <option key={q._id} value={q._id}>
                      {q.policyType === "EXCESS_LIABILITY" ? "Excess Liability" : "General Liability"} - {q.carrierId?.name || "Carrier"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Final Binder PDF */}
            <div key={`binder-${globalSelectedQuoteId}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Final Binder PDF
                </label>
                {selectedQuote?.binderUrl && !stagedFiles[globalSelectedQuoteId]?.binder && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase border border-blue-200">
                    Uploaded
                  </span>
                )}
              </div>

              {stagedFiles[globalSelectedQuoteId]?.binder ? (
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-800 truncate">
                      {stagedFiles[globalSelectedQuoteId].binder.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedFiles(prev => ({
                      ...prev,
                      [globalSelectedQuoteId]: { ...prev[globalSelectedQuoteId], binder: null }
                    }))}
                    className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : selectedQuote?.binderUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-blue-800 truncate">
                        Active Document Found
                      </span>
                    </div>
                    <a
                      href={`/api/download?view=true&url=${encodeURIComponent(selectedQuote.binderUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm"
                    >
                      View
                    </a>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Replace File (Optional)</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'binder')}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer cursor-pointer"
                  />
                </div>
              ) : (
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'binder')}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                />
              )}
            </div>

            {/* Final Policy PDF */}
            <div key={`policy-${globalSelectedQuoteId}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Final Policy PDF
                </label>
                {selectedQuote?.policyDocsUrl && !stagedFiles[globalSelectedQuoteId]?.policy && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase border border-blue-200">
                    Uploaded
                  </span>
                )}
              </div>

              {stagedFiles[globalSelectedQuoteId]?.policy ? (
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-800 truncate">
                      {stagedFiles[globalSelectedQuoteId].policy.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedFiles(prev => ({
                      ...prev,
                      [globalSelectedQuoteId]: { ...prev[globalSelectedQuoteId], policy: null }
                    }))}
                    className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : selectedQuote?.policyDocsUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-blue-800 truncate">
                        Active Document Found
                      </span>
                    </div>
                    <a
                      href={`/api/download?view=true&url=${encodeURIComponent(selectedQuote.policyDocsUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm"
                    >
                      View
                    </a>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Replace File (Optional)</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'policy')}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer cursor-pointer"
                  />
                </div>
              ) : (
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'policy')}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                />
              )}
            </div>

            {/* Certificate of Insurance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Certificate of Insurance
                </label>
                {submission.finalPolicyDocuments?.certificateOfInsuranceUrl && !certificateFile && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase border border-blue-200">
                    Uploaded
                  </span>
                )}
              </div>

              {certificateFile ? (
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-800 truncate">
                      {certificateFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertificateFile(null)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : submission.finalPolicyDocuments?.certificateOfInsuranceUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-blue-800 truncate">
                        Active Document Found
                      </span>
                    </div>
                    <a
                      href={`/api/download?view=true&url=${encodeURIComponent(submission.finalPolicyDocuments.certificateOfInsuranceUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm"
                    >
                      View
                    </a>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Replace File (Optional)</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'certificate')}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer cursor-pointer"
                  />
                </div>
              ) : (
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'certificate')}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                />
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || (!stagedFiles[globalSelectedQuoteId]?.binder && !stagedFiles[globalSelectedQuoteId]?.policy && !certificateFile) || !globalSelectedQuoteId}
              className="w-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Documents
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Documents */}
        {/* {boundQuotes.length > 0 && globalSelectedQuoteId && selectedQuote && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Uploaded Documents ({selectedQuote.policyType === "EXCESS_LIABILITY" ? "Excess Liability" : "General Liability"})
            </h2>

            <div className="space-y-3">
              {selectedQuote.binderUrl && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Final Binder PDF</p>
                    </div>
                  </div>
                  <a
                    href={`/api/download?view=true&url=${encodeURIComponent(selectedQuote.binderUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    View
                  </a>
                </div>
              )}

              {selectedQuote.policyDocsUrl && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Final Policy PDF</p>
                    </div>
                  </div>
                  <a
                    href={`/api/download?view=true&url=${encodeURIComponent(selectedQuote.policyDocsUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    View
                  </a>
                </div>
              )}

              {submission.finalPolicyDocuments?.certificateOfInsuranceUrl && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Certificate of Insurance</p>
                      {submission.finalPolicyDocuments.certificateUploadedAt && (
                        <p className="text-xs text-gray-600">
                          Uploaded: {new Date(submission.finalPolicyDocuments.certificateUploadedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/api/download?view=true&url=${encodeURIComponent(submission.finalPolicyDocuments.certificateOfInsuranceUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    View
                  </a>
                </div>
              )}

              {!selectedQuote.binderUrl && !selectedQuote.policyDocsUrl && !submission.finalPolicyDocuments?.certificateOfInsuranceUrl && (
                <p className="text-sm text-gray-600 text-center py-4">No documents uploaded yet for this policy.</p>
              )}
            </div>
          </div>
        )} */}
      </main>
    </div>
  );
}
