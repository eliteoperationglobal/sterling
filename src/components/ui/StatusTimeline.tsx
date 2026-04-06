"use client";

import React from "react";

// Simple icon components (replacing lucide-react)
const CheckCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const FileText = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

interface StatusTimelineProps {
  submission: {
    quoteStatus?: string;
    signedDocuments?: Array<any>;
    esignCompleted?: boolean;
    esignCompletedAt?: string;
    paymentStatus?: string;
    paymentDate?: string;
    paymentMethod?: string;
    bindRequested?: boolean;
    bindRequestedAt?: string;
    bindApproved?: boolean;
    bindApprovedAt?: string;
    createdAt?: string;
  };
  className?: string;
}

export default function StatusTimeline({ submission, className = "" }: StatusTimelineProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  const steps = [
    {
      label: "Quote Created",
      description: "Quote was created by admin",
      done: true,
      date: submission?.createdAt,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      label: submission?.quoteStatus === "APPROVED" || 
             submission?.quoteStatus === "PAYMENT_RECEIVED" ||
             submission?.quoteStatus === "BIND_REQUESTED" ||
             submission?.quoteStatus === "BOUND"
        ? "Quote Approved"
        : "Quote Pending Approval",
      description: submission?.quoteStatus === "APPROVED" 
        ? "Quote has been approved and is ready for workflow"
        : "Waiting for quote approval",
      done: submission?.quoteStatus === "APPROVED" || 
            submission?.quoteStatus === "PAYMENT_RECEIVED" ||
            submission?.quoteStatus === "BIND_REQUESTED" ||
            submission?.quoteStatus === "BOUND",
      date: null,
      icon: submission?.quoteStatus === "APPROVED" ? CheckCircle : Clock,
      color: submission?.quoteStatus === "APPROVED" ? "text-green-600" : "text-gray-400",
      bgColor: submission?.quoteStatus === "APPROVED" ? "bg-green-50" : "bg-gray-50",
      borderColor: submission?.quoteStatus === "APPROVED" ? "border-green-200" : "border-gray-200",
    },
    {
      label: (submission?.signedDocuments?.length || 0) >= 2 
        ? "Documents Generated"
        : "Generating Documents",
      description: (submission?.signedDocuments?.length || 0) >= 2
        ? `${submission?.signedDocuments?.length || 0} documents ready`
        : "Documents are being prepared",
      done: (submission?.signedDocuments?.length || 0) >= 2,
      date: null,
      icon: (submission?.signedDocuments?.length || 0) >= 2 ? CheckCircle : Clock,
      color: (submission?.signedDocuments?.length || 0) >= 2 ? "text-green-600" : "text-gray-400",
      bgColor: (submission?.signedDocuments?.length || 0) >= 2 ? "bg-green-50" : "bg-gray-50",
      borderColor: (submission?.signedDocuments?.length || 0) >= 2 ? "border-green-200" : "border-gray-200",
    },
    {
      label: submission?.esignCompleted === true 
        ? "E‑Signature Completed" 
        : "Awaiting E‑Signature",
      description: submission?.esignCompleted === true
        ? "All documents have been signed"
        : "Waiting for client to sign documents",
      done: submission?.esignCompleted === true,
      date: submission?.esignCompletedAt,
      icon: submission?.esignCompleted === true ? CheckCircle : Clock,
      color: submission?.esignCompleted === true ? "text-green-600" : "text-gray-400",
      bgColor: submission?.esignCompleted === true ? "bg-green-50" : "bg-gray-50",
      borderColor: submission?.esignCompleted === true ? "border-green-200" : "border-gray-200",
    },
    {
      label: submission?.paymentStatus === "PAID" 
        ? "Payment Completed" 
        : "Payment Pending",
      description: submission?.paymentStatus === "PAID"
        ? submission?.paymentMethod 
          ? `Paid via ${submission.paymentMethod}`
          : "Payment has been received"
        : "Waiting for payment",
      done: submission?.paymentStatus === "PAID",
      date: submission?.paymentDate,
      icon: submission?.paymentStatus === "PAID" ? CheckCircle : Clock,
      color: submission?.paymentStatus === "PAID" ? "text-green-600" : "text-gray-400",
      bgColor: submission?.paymentStatus === "PAID" ? "bg-green-50" : "bg-gray-50",
      borderColor: submission?.paymentStatus === "PAID" ? "border-green-200" : "border-gray-200",
    },
    {
      label: submission?.bindApproved 
        ? "Policy Bound" 
        : submission?.bindRequested 
        ? "Bind Requested"
        : "Bind Request Pending",
      description: submission?.bindApproved
        ? "Policy has been successfully bound"
        : submission?.bindRequested
        ? "Bind request submitted, awaiting approval"
        : "Bind request not yet submitted",
      done: submission?.bindRequested === true || submission?.bindApproved === true,
      date: submission?.bindApprovedAt || submission?.bindRequestedAt,
      icon: submission?.bindApproved ? CheckCircle : Clock,
      color: submission?.bindApproved ? "text-green-600" : submission?.bindRequested ? "text-yellow-600" : "text-gray-400",
      bgColor: submission?.bindApproved ? "bg-green-50" : submission?.bindRequested ? "bg-yellow-50" : "bg-gray-50",
      borderColor: submission?.bindApproved ? "border-green-200" : submission?.bindRequested ? "border-yellow-200" : "border-gray-200",
    },
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#9A8B7A] rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Status Timeline</h3>
          <p className="text-sm text-gray-600">Track the progress of your quote</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={index} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div className={`absolute left-5 top-10 w-0.5 h-full ${
                  step.done ? "bg-green-200" : "bg-gray-200"
                }`} />
              )}
              
              {/* Step Content */}
              <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                step.bgColor
              } ${step.borderColor} transition-all duration-200`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.done ? "bg-green-100" : "bg-gray-100"
                }`}>
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm ${
                        step.done ? "text-gray-900" : "text-gray-600"
                      }`}>
                        {step.label}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {step.description}
                      </p>
                    </div>
                    {step.date && (
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-medium text-gray-500">
                          {formatDate(step.date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
