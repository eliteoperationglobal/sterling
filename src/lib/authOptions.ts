import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword } from "@/lib/auth";
import type { NextAuthOptions } from "next-auth";
import OTP from "@/models/OTP";
import TrustedDevice from "@/models/TrustedDevice";
import { send2FAEmail } from "@/lib/services/email/EmailService";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          // Import Agency model to ensure it's registered for populate
          await import("@/models/Agency");
          
          const user = await User.findOne({ email: credentials.email }).populate("agencyId");

          if (!user) {
            return null;
          }

          const isValid = await verifyPassword(credentials.password, user.passwordHash);

          if (!isValid) {
            return null;
          }

          // --- 2FA LOGIC START ---
          const is2FAEnabled = process.env.ENABLE_2FA === "true";

          // Only apply 2FA if enabled AND user is NOT system_admin
          if (is2FAEnabled && user.role !== "system_admin") {
            const deviceId = credentials.deviceId;

            // Check if this device is trusted
            const isTrusted = await TrustedDevice.findOne({
              userId: user._id,
              deviceId: deviceId
            });

            if (!isTrusted) {
              // If no OTP provided, send one
              if (!credentials.otp || credentials.otp.trim() === "" || credentials.otp === "undefined") {
                const otpCode = crypto.randomInt(100000, 999999).toString();
                const hashedOtp = await bcrypt.hash(otpCode, 10);
                
                // Save hashed OTP to DB (expires in 10 mins)
                await OTP.findOneAndUpdate(
                  { userId: user._id },
                  { 
                    otp: hashedOtp, 
                    attempts: 0,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
                  },
                  { upsert: true }
                );

                // Send Email
                const agencyEmail = (user.agencyId as any)?.email || user.email;
                await send2FAEmail(agencyEmail, otpCode);

                throw new Error("2FA_REQUIRED");
              } else {
                // Find OTP record
                const otpRecord = await OTP.findOne({ userId: user._id });

                if (!otpRecord) {
                  throw new Error("INVALID_OTP");
                }

                // Verify hash
                const isOtpValid = await bcrypt.compare(credentials.otp, otpRecord.otp);

                if (!isOtpValid) {
                  const newAttempts = (otpRecord.attempts || 0) + 1;
                  
                  if (newAttempts >= 5) {
                    await OTP.deleteOne({ _id: otpRecord._id });
                    throw new Error("OTP_EXPIRED");
                  } else {
                    await OTP.updateOne({ _id: otpRecord._id }, { attempts: newAttempts });
                    throw new Error("INVALID_OTP");
                  }
                }

                // OTP is valid! 
                if (deviceId) {
                  await TrustedDevice.findOneAndUpdate(
                    { userId: user._id, deviceId: deviceId },
                    { lastUsedAt: new Date() },
                    { upsert: true }
                  );
                }
                await OTP.deleteOne({ _id: otpRecord._id });
              }
            } else {
              await TrustedDevice.updateOne(
                { _id: isTrusted._id },
                { lastUsedAt: new Date() }
              );
            }
          }
          // --- 2FA LOGIC END ---

          // Handle agencyId - it might be populated or just an ObjectId
          const agencyId = 
            typeof user.agencyId === "object" && user.agencyId !== null
              ? (user.agencyId as any)._id?.toString() || (user.agencyId as any).toString()
              : (user.agencyId as any).toString();

          const agency: any = typeof user.agencyId === "object" && user.agencyId !== null ? user.agencyId : {};

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            agencyId: agencyId,

              // ⭐ NEW AGENCY FIELDS
              agencyName: agency.name,
              agencyAddress: agency.address?.street,
              agencyCity: agency.address?.city,
              agencyState: agency.address?.state,
              agencyZip: agency.address?.zip,
              agencyPhone: agency.phone,
              agencyEmail: agency.email,    
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.agencyId = (user as any).agencyId;
        token.agencyName = (user as any).agencyName;
        token.agencyAddress = (user as any).agencyAddress;
        token.agencyCity = (user as any).agencyCity;
        token.agencyState = (user as any).agencyState;
        token.agencyZip = (user as any).agencyZip;
        token.agencyPhone = (user as any).agencyPhone;
        token.agencyEmail = (user as any).agencyEmail;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).agencyId = token.agencyId;
        (session.user as any).agencyName = token.agencyName;
        (session.user as any).agencyAddress = token.agencyAddress;
        (session.user as any).agencyCity = token.agencyCity;
        (session.user as any).agencyState = token.agencyState;
        (session.user as any).agencyZip = token.agencyZip;
        (session.user as any).agencyPhone = token.agencyPhone;
        (session.user as any).agencyEmail = token.agencyEmail;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 1. If url is relative, return it directly so the client remains on current origin
      if (url.startsWith("/")) {
        return url;
      }
      try {
        const parsed = new URL(url);
        // 2. If url host is localhost or 127.0.0.1, strip origin and return relative pathname
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          return parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/signin";
        }
        // 3. Allow callback URLs matching the current baseUrl origin
        if (parsed.origin === baseUrl) {
          return url;
        }
        // 4. Fallback to relative pathname
        return parsed.pathname || "/signin";
      } catch (e) {
        // Ignore URL parsing errors
      }
      return "/signin";
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};