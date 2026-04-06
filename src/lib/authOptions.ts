import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword } from "@/lib/auth";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
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
      // After signin, redirect based on user role
      // Note: We can't access token here, so we'll redirect to a default
      // The actual role-based redirect happens in the signin page
      if (url === `${baseUrl}/signin` || url === baseUrl) {
        // Default redirect - will be handled by signin page based on session
        return `${baseUrl}/agency/dashboard`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};