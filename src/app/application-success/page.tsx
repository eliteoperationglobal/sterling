import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border border-gray-200 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Application Submitted!</h1>
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Thank you for submitting your application. Your information has been securely sent to your agent. They will review it and get back to you shortly.
        </p>
        <p className="text-sm text-gray-400">
          You may now close this window.
        </p>
      </div>
    </div>
  );
}
