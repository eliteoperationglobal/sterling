"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Upload, File as FileIcon, X as CloseIcon, Menu, Trash2 } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";

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
  payload?: any;
  clientName?: string;
  programName?: string;
  programId?: string;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dragging states
  const [isDraggingBinder, setIsDraggingBinder] = useState(false);
  const [isDraggingPolicy, setIsDraggingPolicy] = useState(false);
  const [isDraggingCertificate, setIsDraggingCertificate] = useState(false);

  // State to hold staged files mapped by Quote ID so switching tabs retains memory
  const [stagedFiles, setStagedFiles] = useState<Record<string, { binder: File | null; policy: File | null }>>({});
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [globalSelectedQuoteId, setGlobalSelectedQuoteId] = useState<string>("");
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    documentType: 'binder' | 'policy' | 'certificate' | null;
  }>({ isOpen: false, documentType: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasMadeInitialSelection, setHasMadeInitialSelection] = useState(false);

  const boundQuotes = submission?.quotes?.filter(q => q.status === "BOUND") || [];
  const selectedQuote = globalSelectedQuoteId ? boundQuotes.find(q => q._id === globalSelectedQuoteId) : null;

  useEffect(() => {
    if (submission && boundQuotes.length <= 1 && !hasMadeInitialSelection) {
      setHasMadeInitialSelection(true);
    }
  }, [submission, boundQuotes.length, hasMadeInitialSelection]);

  const handleDeleteDocument = async () => {
    if (!deleteModalState.documentType) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/bound-policies/delete-document", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          quoteId: globalSelectedQuoteId,
          documentType: deleteModalState.documentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete document");
      }

      toast.success("Document deleted successfully");
      await fetchSubmission(); // Refresh the list
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Failed to delete document", {
        description: err.message || "An error occurred",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalState({ isOpen: false, documentType: null });
    }
  };

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

      const responseText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Response body is not valid JSON (e.g., Nginx HTML error page)
      }

      if (!res.ok) {
        const errorMsg = data?.error || (responseText ? responseText.replace(/<[^>]*>?/gm, '').trim().slice(0, 150) : `Upload failed (${res.status})`);
        throw new Error(errorMsg);
      }

      toast.success("Documents uploaded successfully!", {
        description: "The agency has been notified",
      });

      // Redirect back to Bound Policies page after successful upload
      router.push("/admin/bound-policies");
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
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 lg:py-0 lg:h-16 gap-4 lg:gap-0">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-4 md:gap-10">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-6 h-6 text-[#9A8B7A]" />
                </button>
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
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">{(session?.user as any)?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 font-medium">{(session?.user as any)?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
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
                Client: {submission.payload?.companyName || submission.payload?.namedInsured || submission.clientName || submission.clientContact.name}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Form or Initial Selection Screen */}
        {!hasMadeInitialSelection && boundQuotes.length > 1 ? (
          <div className="bg-[#faf8f5]/90 backdrop-blur-xl rounded-3xl shadow-sm border border-[#e5ddd5] p-8 mb-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-[#9A8B7A]/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#9A8B7A]/20 shadow-inner">
              <FileIcon className="w-10 h-10 text-[#9A8B7A]" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Which policy are you uploading for?</h2>
            <p className="text-base text-[#6b5e52] font-medium mb-10 max-w-lg mx-auto leading-relaxed">
              This submission has multiple bound policies. Please select one to begin uploading documents.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {boundQuotes.map((q) => {
                const displayName = q.policyType === "EXCESS_LIABILITY" 
                  ? (submission?.programId === 'apartment-buildings' || submission?.programName?.includes("Property") || submission?.programName?.includes("Apartment") ? "General Liability" : "Excess Liability")
                  : (submission?.programId === 'apartment-buildings' || submission?.programName?.includes("Property") || submission?.programName?.includes("Apartment") ? "Property" : "General Liability");

                return (
                  <button
                    key={q._id}
                    onClick={() => {
                      setGlobalSelectedQuoteId(q._id);
                      setHasMadeInitialSelection(true);
                    }}
                    className="flex flex-col items-center justify-center p-8 bg-white border-2 border-[#e5ddd5] hover:border-[#9A8B7A] hover:bg-[#fcfaf8] rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="w-14 h-14 bg-[#f5f1eb] group-hover:bg-[#9A8B7A]/10 rounded-2xl flex items-center justify-center mb-5 transition-colors shadow-sm">
                      <FileIcon className="w-7 h-7 text-gray-400 group-hover:text-[#9A8B7A] transition-colors" />
                    </div>
                    <span className="text-xl font-extrabold text-gray-900 group-hover:text-[#9A8B7A] transition-colors tracking-tight">
                      {displayName}
                    </span>
                    <span className="text-sm font-semibold text-[#6b5e52] mt-2 bg-[#f5f1eb] px-3 py-1 rounded-full">
                      Carrier: {q.carrierId?.name || "Unknown"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-6 mb-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Upload Documents</h2>

              {/* Policy Selector Dropdown */}
              {boundQuotes.length > 1 && (
                <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Target Policy:</label>
                  <select
                    value={globalSelectedQuoteId}
                    onChange={(e) => setGlobalSelectedQuoteId(e.target.value)}
                    className="bg-transparent text-gray-900 text-sm font-bold focus:outline-none cursor-pointer"
                  >
                    {boundQuotes.map((q) => (
                      <option key={q._id} value={q._id}>
                        {q.policyType === "EXCESS_LIABILITY" 
                          ? (submission?.programId === 'apartment-buildings' || submission?.programName?.includes("Property") || submission?.programName?.includes("Apartment") ? "General Liability" : "Excess Liability")
                          : (submission?.programId === 'apartment-buildings' || submission?.programName?.includes("Property") || submission?.programName?.includes("Apartment") ? "Property" : "General Liability")
                        } - {q.carrierId?.name || "Carrier"}
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
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl group/file">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-4 h-4 text-green-600" />
                    </div>
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
                    className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedQuote?.binderUrl && (
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-blue-800 truncate">
                          Active Document Found
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/download?view=true&url=${encodeURIComponent(selectedQuote.binderUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteModalState({ isOpen: true, documentType: 'binder' })}
                          className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 bg-white hover:bg-red-50 border border-red-200 rounded-md transition-colors shadow-sm flex items-center"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedQuote?.binderUrl && (
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Replace File (Optional)</span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingBinder(true);
                    }}
                    onDragLeave={() => setIsDraggingBinder(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingBinder(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const mockEvent = { target: { files: [file] } } as any;
                        handleFileChange(mockEvent, 'binder');
                      }
                    }}
                    className={`relative group cursor-pointer transition-all duration-300 ${isDraggingBinder 
                      ? "border-[#9A8B7A] bg-[#9A8B7A]/5" 
                      : "border-[#e5ddd5] hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                    } border-2 border-dashed rounded-xl p-6 text-center`}
                    onClick={() => document.getElementById(`binder-input-${globalSelectedQuoteId}`)?.click()}
                  >
                    <input
                      id={`binder-input-${globalSelectedQuoteId}`}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'binder')}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDraggingBinder ? "bg-[#9A8B7A] text-white" : "bg-white text-[#9A8B7A] shadow-sm"}`}>
                        <Upload className={`w-6 h-6 ${isDraggingBinder ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Click or drag binder here</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">PDF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl group/file">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-4 h-4 text-green-600" />
                    </div>
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
                    className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedQuote?.policyDocsUrl && (
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-blue-800 truncate">
                          Active Document Found
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/download?view=true&url=${encodeURIComponent(selectedQuote.policyDocsUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteModalState({ isOpen: true, documentType: 'policy' })}
                          className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 bg-white hover:bg-red-50 border border-red-200 rounded-md transition-colors shadow-sm flex items-center"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedQuote?.policyDocsUrl && (
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Replace File (Optional)</span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPolicy(true);
                    }}
                    onDragLeave={() => setIsDraggingPolicy(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPolicy(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const mockEvent = { target: { files: [file] } } as any;
                        handleFileChange(mockEvent, 'policy');
                      }
                    }}
                    className={`relative group cursor-pointer transition-all duration-300 ${isDraggingPolicy 
                      ? "border-[#9A8B7A] bg-[#9A8B7A]/5" 
                      : "border-[#e5ddd5] hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                    } border-2 border-dashed rounded-xl p-6 text-center`}
                    onClick={() => document.getElementById(`policy-input-${globalSelectedQuoteId}`)?.click()}
                  >
                    <input
                      id={`policy-input-${globalSelectedQuoteId}`}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'policy')}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDraggingPolicy ? "bg-[#9A8B7A] text-white" : "bg-white text-[#9A8B7A] shadow-sm"}`}>
                        <Upload className={`w-6 h-6 ${isDraggingPolicy ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Click or drag policy here</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">PDF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl group/file">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-semibold text-green-800 truncate">
                      {certificateFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertificateFile(null)}
                    className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {submission.finalPolicyDocuments?.certificateOfInsuranceUrl && (
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-blue-800 truncate">
                          Active Document Found
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/download?view=true&url=${encodeURIComponent(submission.finalPolicyDocuments.certificateOfInsuranceUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md transition-colors shadow-sm"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteModalState({ isOpen: true, documentType: 'certificate' })}
                          className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 bg-white hover:bg-red-50 border border-red-200 rounded-md transition-colors shadow-sm flex items-center"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {submission.finalPolicyDocuments?.certificateOfInsuranceUrl && (
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Replace File (Optional)</span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingCertificate(true);
                    }}
                    onDragLeave={() => setIsDraggingCertificate(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingCertificate(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const mockEvent = { target: { files: [file] } } as any;
                        handleFileChange(mockEvent, 'certificate');
                      }
                    }}
                    className={`relative group cursor-pointer transition-all duration-300 ${isDraggingCertificate 
                      ? "border-[#9A8B7A] bg-[#9A8B7A]/5" 
                      : "border-[#e5ddd5] hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                    } border-2 border-dashed rounded-xl p-6 text-center`}
                    onClick={() => document.getElementById('certificate-input')?.click()}
                  >
                    <input
                      id="certificate-input"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'certificate')}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDraggingCertificate ? "bg-[#9A8B7A] text-white" : "bg-white text-[#9A8B7A] shadow-sm"}`}>
                        <Upload className={`w-6 h-6 ${isDraggingCertificate ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Click or drag certificate here</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">PDF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
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
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#6b5e52]/40 backdrop-blur-sm px-4">
            <div className="bg-[#faf8f5] rounded-2xl shadow-xl border border-[#e5ddd5] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Document?</h3>
                <p className="text-sm text-[#6b5e52] font-medium leading-relaxed">
                  Are you sure you want to permanently delete this document from cloud storage? This action cannot be undone.
                </p>
              </div>
              <div className="bg-[#f5f1eb] px-6 py-4 flex items-center justify-end gap-3 border-t border-[#e5ddd5]">
                <button
                  onClick={() => setDeleteModalState({ isOpen: false, documentType: null })}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-bold text-[#6b5e52] hover:text-gray-900 bg-white hover:bg-[#f0ebe1] border border-[#e5ddd5] rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:transform-none"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Documents */}
        {/* {boundQuotes.length > 0 && globalSelectedQuoteId && selectedQuote && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Uploaded Documents ({selectedQuote.policyType === "EXCESS_LIABILITY" 
                ? (submission?.programId === 'apartment-buildings' || submission?.programName?.includes("Property") || submission?.programName?.includes("Apartment") ? "General Liability" : "Excess Liability")
                : (submission?.programId === 'apartment-buildings' || submission?.programName?.includes("Property") || submission?.programName?.includes("Apartment") ? "Property" : "General Liability")
              })
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
                          Uploaded: {new Date(submission.finalPolicyDocuments.certificateUploadedAt).toLocaleString('en-US')}
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
