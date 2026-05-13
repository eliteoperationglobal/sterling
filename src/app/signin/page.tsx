"use client";

export const dynamic = 'force-dynamic';

import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate or retrieve a persistent device ID
    let id = localStorage.getItem("sterling_device_id");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("sterling_device_id", id);
    }
    setDeviceId(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        otp: showOtp ? otp : undefined,
        deviceId,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // If it's a generic signin error, check if 2FA is actually required
        if (result.error === "CredentialsSignin") {
          try {
            const checkRes = await fetch("/api/auth/check-2fa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
            const { required } = await checkRes.json();
            
            if (required) {
              setShowOtp(true);
              setLoading(false);
              toast.info("Verification Required", { 
                description: "A code has been sent to your agency email.",
                duration: 5000 
              });
              return;
            }
          } catch (e) {
            // Fall back to standard error
          }
        }

        // Handle specific errors if they somehow bypass the generic code
        const errorMsg = result.error.toLowerCase();
        if (errorMsg.includes("invalid_otp")) {
          setError("Invalid verification code. Please try again.");
          toast.error("Invalid Code");
          setLoading(false);
          return;
        }

        if (errorMsg.includes("otp_expired")) {
          setError("Too many failed attempts. A new code has been sent to your email.");
          toast.warning("New Code Sent", { description: "Please use the latest code sent to your inbox." });
          setLoading(false);
          setShowOtp(true); // Keep them on the OTP screen
          return;
        }

        // If we reach here, it's a genuine invalid credential error
        setError("Invalid email or password");
        toast.error("Sign in failed", { description: "Check your credentials and try again." });
        setLoading(false);
        return;
      }


      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) throw new Error("Unable to fetch session after sign in");
      const sessionData = await sessionRes.json();
      const userRole = sessionData?.user?.role;

      if (userRole === "system_admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/agency/dashboard");
      }
      toast.success("Signed in");
    } catch (err) {
      setError("An error occurred. Please try again.");
      toast.error("Sign in error", { description: (err as any)?.message || "Unexpected error" });
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen font-sans px-4 py-8 overflow-hidden" style={{ background: "linear-gradient(135deg, #a38c7a 0%, #8b735b 100%)" }}>
      {/* Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* TOP RIGHT GLOW (Matched to latest image) */}
        <div 
          className="absolute"
          style={{
            top: "10%",
            right: "-10%",
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
            filter: "blur(60px)",
            opacity: "0.5"
          }}
        ></div>
        
        {/* Subtle center-left glow for depth */}
        <div 
          className="absolute"
          style={{
            bottom: "-10%",
            left: "-10%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
            filter: "blur(80px)",
          }}
        ></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#ffffff] rounded-[16px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="mb-4">
            <img 
              src="/sterling-logo.JPG" 
              alt="Sterling Insurance Services LLC" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-[#2d2a26]">
            {showOtp ? "Verify your identity" : "Welcome back"}
          </h2>
          <p className="text-sm text-[#6b5e52] mt-1">
            {showOtp 
              ? "Enter the 6-digit code sent to your agency's email." 
              : "Please enter your details to sign in."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!showOtp ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#2d2a26]" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-[8px] border border-[#e5ddd5] bg-[#ffffff] px-4 py-3 text-sm text-[#2d2a26] placeholder:text-[#6b5e52] focus:border-[#9A8B7A] focus:outline-none focus:ring-1 focus:ring-[#9A8B7A] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#2d2a26]" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-[8px] border border-[#e5ddd5] bg-[#ffffff] px-4 py-3 text-sm text-[#2d2a26] placeholder:text-[#6b5e52] focus:border-[#9A8B7A] focus:outline-none focus:ring-1 focus:ring-[#9A8B7A] transition-all"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2d2a26]" htmlFor="otp">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full rounded-[8px] border border-[#e5ddd5] bg-[#ffffff] px-4 py-3 text-2xl text-center tracking-[10px] font-bold text-[#2d2a26] placeholder:text-[#6b5e52] focus:border-[#9A8B7A] focus:outline-none focus:ring-1 focus:ring-[#9A8B7A] transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowOtp(false)}
                className="text-xs text-[#9A8B7A] hover:underline"
              >
                Back to password
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c2a07e] hover:bg-[#b08d6a] text-white font-[600] py-3 rounded-[10px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading 
              ? (showOtp ? "Verifying..." : "Signing in...") 
              : (showOtp ? "Verify Code" : "Sign In")}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#e5ddd5] flex items-center justify-center">
          <Link href="/" className="text-sm font-medium text-[#6b5e52] hover:text-[#9A8B7A] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9A8B7A] mx-auto"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
