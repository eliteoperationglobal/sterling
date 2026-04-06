"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import DynamicForm from "@/components/DynamicForm";
import type { IFormTemplate } from "@/models/FormTemplate";

function SubmitFormContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const templateId = params?.templateId as string;
  const editSubmissionId = searchParams?.get("edit");

  const [template, setTemplate] = useState<IFormTemplate | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientEIN, setClientEIN] = useState("");
  const [clientStreet, setClientStreet] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientState, setClientState] = useState("CA");
  const [clientZip, setClientZip] = useState("");
  const [ccpaConsent, setCcpaConsent] = useState(false);
  const [isCAOperations, setIsCAOperations] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [carriers, setCarriers] = useState<any[]>([]);
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && templateId) {
      setLoading(true);
      
      // Check if we're in edit mode
      if (editSubmissionId) {
        setIsEditMode(true);
        // Fetch existing submission data
        fetch(`/api/agency/submissions/${editSubmissionId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error("Failed to fetch submission");
            }
            return res.json();
          })
          .then((submissionData) => {
            if (submissionData.submission) {
              const sub = submissionData.submission;
              
              // Check if submission can be edited
              if (sub.status !== "ENTERED" && sub.status !== "DRAFT") {
                setError(`This submission cannot be edited. Current status: ${sub.status}`);
                setLoading(false);
                return;
              }
              
              // Check if submission has routing logs (cannot edit if already routed)
              if (submissionData.routingLogs && submissionData.routingLogs.length > 0) {
                setError("This submission cannot be edited. It has already been routed to carriers.");
                setLoading(false);
                return;
              }
              
              setExistingSubmission(sub);
              
              // Pre-populate form fields
              if (sub.clientContact) {
                setClientName(sub.clientContact.name || "");
                setClientPhone(sub.clientContact.phone || "");
                setClientEmail(sub.clientContact.email || "");
                setClientEIN(sub.clientContact.EIN || "");
                if (sub.clientContact.businessAddress) {
                  setClientStreet(sub.clientContact.businessAddress.street || "");
                  setClientCity(sub.clientContact.businessAddress.city || "");
                  setClientState(sub.clientContact.businessAddress.state || "CA");
                  setClientZip(sub.clientContact.businessAddress.zip || "");
                }
              }
              setCcpaConsent(sub.ccpaConsent || false);
              setClientState(sub.state || "CA");
              
              // Set template ID from submission (use submission's template, not URL param)
              if (sub.templateId?._id) {
                const subTemplateId = sub.templateId._id;
                // Fetch template
                return fetch(`/api/forms?templateId=${subTemplateId}`);
              }
            }
            // Fallback to original templateId
            return fetch(`/api/forms?templateId=${templateId}`);
          })
          .then((res) => res?.json())
          .then((data) => {
            if (data?.templates && data.templates.length > 0) {
              setTemplate(data.templates[0]);
              setIsCAOperations(data.templates[0].stateSpecific || false);
              setError("");
            } else if (data?.error) {
              setError(data.error || "Template not found");
            } else {
              setError("Template not found");
            }
            setLoading(false);
          })
          .catch((err) => {
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to load submission data. Please try again.");
            setLoading(false);
          });
      } else {
        // Normal mode - just fetch template
        fetch(`/api/forms?templateId=${templateId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.templates && data.templates.length > 0) {
              setTemplate(data.templates[0]);
              setIsCAOperations(data.templates[0].stateSpecific || false);
              setError("");
            } else if (data.error) {
              setError(data.error || "Template not found");
            } else {
              setError("Template not found");
            }
            setLoading(false);
          })
          .catch((err) => {
            console.error("Error fetching template:", err);
            setError("Failed to load form template. Please try again.");
            setLoading(false);
          });
      }
    }
  }, [status, templateId, editSubmissionId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/carriers")
        .then((res) => res.json())
        .then((data) => {
          if (data.carriers) {
            setCarriers(data.carriers);
          }
        })
        .catch((err) => {
          console.error("Error fetching carriers:", err);
        });
    }
  }, [status]);

  const handleFormSubmit = async (formData: Record<string, any>, files: FileList | null) => {
    if (!template || !session) {
      setError("Missing template or session");
      return;
    }

    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }
    if (!clientPhone.trim()) {
      setError("Client phone is required");
      return;
    }
    if (!clientEmail.trim()) {
      setError("Client email is required");
      return;
    }
    if (!clientStreet.trim()) {
      setError("Business street address is required");
      return;
    }
    if (!clientCity.trim()) {
      setError("Business city is required");
      return;
    }
    if (!clientZip.trim()) {
      setError("Business zip code is required");
      return;
    }
    // Carrier selection only required for new submissions
    if (!isEditMode && !selectedCarrierId) {
      setError("Please select a carrier");
      return;
    }
    if (isCAOperations && !ccpaConsent) {
      setError("CCPA consent is required for California operations");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formDataToSend.append(key, value);
          } else if (typeof value === "boolean") {
            formDataToSend.append(key, value.toString());
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      if (files) {
        Array.from(files).forEach((file) => {
          formDataToSend.append("files", file);
        });
      }

      formDataToSend.append("clientName", clientName);
      formDataToSend.append("clientPhone", clientPhone);
      formDataToSend.append("clientEmail", clientEmail);
      if (clientEIN) {
        formDataToSend.append("clientEIN", clientEIN);
      }
      formDataToSend.append("clientStreet", clientStreet);
      formDataToSend.append("clientCity", clientCity);
      formDataToSend.append("clientState", clientState);
      formDataToSend.append("clientZip", clientZip);
      formDataToSend.append("templateId", templateId);
      formDataToSend.append("ccpaConsent", ccpaConsent.toString());
      formDataToSend.append("isCAOperations", isCAOperations.toString());
      // Only append carrierId if provided (not required in edit mode)
      if (selectedCarrierId) {
        formDataToSend.append("carrierId", selectedCarrierId);
      }

      // Use PATCH for edit mode, POST for new submission
      const url = isEditMode && editSubmissionId 
        ? `/api/agency/submissions/${editSubmissionId}`
        : "/api/submissions";
      const method = isEditMode && editSubmissionId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || isEditMode ? "Failed to update application" : "Failed to submit application");
      }

      // Show success toast
      if (isEditMode) {
        toast.success("Submission updated successfully!", {
          description: "Your changes have been saved.",
        });
      } else {
        toast.success("Application submitted successfully!", {
          description: "Your submission has been received.",
        });
      }

      setSuccess(true);
      setTimeout(() => {
        if (isEditMode) {
          router.push(`/agency/submissions/${editSubmissionId}?updated=true`);
        } else {
          router.push("/agency/dashboard?submitted=true");
        }
      }, 2000);
    } catch (err: any) {
      console.error("Submission error:", err);
      const errorMessage = err.message || "Failed to submit application. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, {
        description: "Please check all required fields and try again.",
      });
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading form...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  if (error && !template) {
    return (
      <div className="min-h-screen bg-[#f5f1eb]">
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
            <Link href="/agency/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl blur-sm opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/30">
                  SP
                </div>
              </div>
              <span className="text-gray-900 font-bold text-lg tracking-tight">Sterling Portal</span>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link href="/agency/submit" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Selection
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-2xl p-12 text-center animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Success!</h2>
          <p className="text-gray-600 mb-2 text-lg">
            {isEditMode ? "Your application has been updated successfully." : "Your application has been submitted successfully."}
          </p>
          <p className="text-sm text-gray-500 mb-8">Redirecting...</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse animation-delay-100"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse animation-delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/agency/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl blur-sm opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/30">
                  SP
                </div>
              </div>
              <span className="text-gray-900 font-bold text-lg tracking-tight">Sterling Portal</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{session?.user?.name || "User"}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
              <Link href="/agency/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg hover:bg-gray-50 transition-all">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/agency/submit" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Selection
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 px-8 py-6 mb-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Coverage Selected</p>
                <p className="text-xs text-gray-600">{template?.industry} - {template?.subtype}</p>
              </div>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-pulse-subtle">
                2
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Application Form</p>
                <p className="text-xs text-gray-600">Complete details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Title */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            {isEditMode && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-sm font-semibold">
                Edit Mode
              </span>
            )}
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              {isEditMode ? "Edit Application" : template?.title || "Application Form"}
            </h1>
          </div>
          {template?.description && <p className="text-lg text-gray-600">{template.description}</p>}
          {isEditMode && existingSubmission && (
            <p className="text-sm text-gray-500 mt-2">
              Submission ID: {existingSubmission.submissionId || existingSubmission._id.slice(-8)}
            </p>
          )}
        </div>

        {/* Client Contact Information */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Client Information</h2>
              <p className="text-sm text-gray-600">Contact details and business address</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Client Name <span className="text-red-500">*</span>
              </label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300 !text-gray-900" placeholder="John Doe" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300 !text-gray-900" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300 !text-gray-900" placeholder="client@example.com" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                EIN <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input type="text" value={clientEIN} onChange={(e) => setClientEIN(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300 !text-gray-900" placeholder="12-3456789" />
            </div>
          </div>

          {/* Business Address */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Business Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-gray-900 mb-2 block">Street Address <span className="text-red-500">*</span></label>
                <input type="text" value={clientStreet} onChange={(e) => setClientStreet(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300 !text-gray-900" placeholder="123 Main Street" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 mb-2 block">City <span className="text-red-500">*</span></label>
                <input type="text" value={clientCity} onChange={(e) => setClientCity(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300 !text-gray-900" placeholder="Los Angeles" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 mb-2 block">State <span className="text-red-500">*</span></label>
                <select value={clientState} onChange={(e) => setClientState(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300">
                  <option value="CA">California</option>
                  <option value="AZ">Arizona</option>
                  <option value="NV">Nevada</option>
                  <option value="OR">Oregon</option>
                  <option value="WA">Washington</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="NY">New York</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 mb-2 block">Zip Code <span className="text-red-500">*</span></label>
                <input type="text" value={clientZip} onChange={(e) => setClientZip(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300 !text-gray-900" placeholder="90001" />
              </div>
            </div>
          </div>

          {/* Carrier Selection - Only show for new submissions */}
          {!isEditMode && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Insurance Carrier
              </h3>
              <div>
                <label className="text-sm font-bold text-gray-900 mb-2 block">Select Carrier <span className="text-red-500">*</span></label>
                <select value={selectedCarrierId} onChange={(e) => setSelectedCarrierId(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all hover:border-gray-300">
                  <option value="">Select a carrier...</option>
                  {carriers.map((carrier) => (
                    <option key={carrier._id} value={carrier._id}>{carrier.name} - {carrier.email}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  The submission will be routed to the selected carrier for review
                </p>
              </div>
            </div>
          )}
          
          {/* Edit Mode Info */}
          {isEditMode && (
            <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-1">Editing Submission</p>
                  <p className="text-xs text-amber-800">
                    You are editing an existing submission. Changes will update the submission data. 
                    Carrier selection is not available in edit mode as the submission may have already been routed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CCPA Consent */}
        {isCAOperations && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full -mr-16 -mt-16"></div>
            <label className="relative flex items-start gap-4 cursor-pointer">
              <input type="checkbox" checked={ccpaConsent} onChange={(e) => setCcpaConsent(e.target.checked)} required={isCAOperations} className="w-6 h-6 text-indigo-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition cursor-pointer mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-base font-bold text-gray-900">CCPA Privacy Consent <span className="text-red-500">*</span></span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  I consent to the collection and use of my personal information as described in the{" "}
                  <Link href="/privacy" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">Privacy Policy</Link>. This consent is required for California operations under CCPA.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Dynamic Form */}
        {template && template.fields && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-600">Complete all required fields below</p>
              </div>
            </div>
            <DynamicForm 
              fields={template.fields} 
              onSubmit={handleFormSubmit} 
              isLoading={submitting}
              initialValues={isEditMode && existingSubmission?.payload ? existingSubmission.payload : dynamicFormData || undefined}
              onDataChange={setDynamicFormData}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-fade-in-up">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Submitting State */}
        {submitting && (
          <div className="mb-8 p-5 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0"></div>
            <p className="text-sm font-medium text-blue-800">Submitting your application... Please wait.</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

export default function SubmitFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SubmitFormContent />
    </Suspense>
  );
}
