/**
 * Client-side API helper functions
 * All functions use fetch with cache: "no-store" for real-time data
 */

const API_BASE = ""; // Relative to current domain

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
  [key: string]: any;
}

/**
 * Generate Proposal PDF
 */
export async function generateProposal(submissionId: string): Promise<ApiResponse<{ documentUrl: string }>> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/generate-proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate proposal" };
  }
}

/**
 * Generate Finance Agreement PDF
 */
export async function generateFinanceAgreement(submissionId: string): Promise<ApiResponse<{ documentUrl: string }>> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/generate-finance-agreement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate finance agreement" };
  }
}

/**
 * Generate Carrier Forms PDF
 */
export async function generateCarrierForms(submissionId: string): Promise<ApiResponse<{ documentUrl: string }>> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/generate-carrier-forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate carrier forms" };
  }
}

/**
 * Send documents for e-signature
 */
export async function sendForSignature(submissionId: string): Promise<ApiResponse<{ signingUrl: string }>> {
  try {
    const res = await fetch(`${API_BASE}/api/esign/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to send for signature" };
  }
}

/**
 * Get e-signature status
 */
export async function getESignStatus(submissionId: string): Promise<ApiResponse<{
  documents: Array<{ documentType: string; signatureStatus: string }>;
  allSigned: boolean;
  esignCompleted: boolean;
}>> {
  try {
    const res = await fetch(`${API_BASE}/api/esign/status/${submissionId}`, {
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get e-sign status" };
  }
}

/**
 * Make payment
 */
export async function makePayment(
  submissionId: string,
  amount: number,
  method: string = "CARD"
): Promise<ApiResponse<{
  paymentStatus: string;
  paymentDate: string;
  paymentAmount: number;
  paymentMethod: string;
  transactionId: string;
}>> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, amount, method }),
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Payment failed" };
  }
}

/**
 * Request bind
 */
export async function requestBind(submissionId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const res = await fetch(`${API_BASE}/api/bind/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to request bind" };
  }
}

/**
 * Get documents for a submission
 */
export async function getDocuments(submissionId: string): Promise<ApiResponse<{
  documents: Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
    signatureStatus: string;
    generatedAt: string;
  }>;
  count: number;
}>> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/${submissionId}`, {
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get documents" };
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(submissionId: string): Promise<ApiResponse<{
  paymentStatus: string;
  paymentDate?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  esignCompleted: boolean;
  esignCompletedAt?: string;
}>> {
  try {
    const res = await fetch(`${API_BASE}/api/payment/status/${submissionId}`, {
      cache: "no-store",
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get payment status" };
  }
}



