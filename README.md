# Sterling Wholesale Insurance Portal

A California-focused wholesale insurance portal built with Next.js, MongoDB, and TypeScript. This portal enables agencies to submit risks, receive quotes, finance policies, sign documents, and bind coverage—all in one integrated system.

## 🎯 Project Overview

This is a simplified clone of an enterprise wholesale insurance portal, specifically designed for US/California operations. The system includes:

- **Agency Management**: Multi-user per agency with role-based access control
- **Dynamic Industry Forms**: CA-specific templates (Restaurant, Contractor, Trucking, and more)
- **Automatic Carrier Routing**: Intelligent submission routing based on risk type and location
- **Quote Management**: Admin quote entry with automatic wholesale fee calculation
- **Finance Integration**: EMI calculator via Sterling Financial Partners API
- **Payment Processing**: Credit Card, ACH, and Apple Pay via Sterling Payment Solutions
- **E-Signature**: Document generation and e-signature workflow (ESIGN/UETA compliant)
- **Policy Management**: Bind requests and policy issuance tracking
- **Admin Dashboard**: Comprehensive reporting and CSV exports

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router) + TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: NextAuth.js (Credentials Provider)
- **Styling**: Tailwind CSS
- **Forms**: react-hook-form + zod
- **File Uploads**: multer/formidable
- **Additional**: bcryptjs, jsonwebtoken, dayjs, csv-stringify

## 📋 4-Day MVP Schedule (CA Client)

### Day 1: Foundation & Auth
- ✅ Next.js + TypeScript setup
- ✅ MongoDB connection (Mongoose)
- ✅ Agency + User models
- ✅ NextAuth with Credentials Provider
- ✅ RBAC middleware
- ✅ Basic dashboard structure

### Day 2: Dynamic Forms & Submissions
- ✅ FormTemplate + Industry models
- ✅ Seed CA-specific templates (Restaurant, Contractor, Trucking)
- ✅ DynamicForm React component
- ✅ Industry selection page
- ✅ Submission form with file upload
- ✅ POST /api/submissions API
- ✅ Agency submissions dashboard

### Day 3: Routing, Quotes & Finance
- ✅ Carrier routing engine
- ✅ Admin quote entry + wholesale fee calculation
- ✅ Agency quote view + broker fee input
- ✅ Finance EMI calculator (mock)
- ✅ Payment processing mock (Card/ACH/Apple Pay)

### Day 4: E-Sign, Bind & Reports
- ✅ Document generation & e-sign workflow
- ✅ Bind request system
- ✅ Policy upload & management
- ✅ Admin dashboard with stats
- ✅ CSV export functionality
- ✅ Testing & seed scripts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (v22.17.0 recommended)
- MongoDB Atlas account (or local MongoDB)
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your MongoDB URI and secrets
# MONGODB_URI="mongodb+srv://..."
# NEXTAUTH_SECRET="your-secret-here"
# JWT_SECRET="your-jwt-secret"
# NODE_ENV="development"

# Seed the database
npm run seed

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
sterling-portal-backend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (signin, signup)
│   │   ├── (agency)/           # Agency routes
│   │   │   ├── dashboard/      # Agency dashboard
│   │   │   ├── submit/         # Submission forms
│   │   │   ├── quotes/         # Quote management
│   │   │   ├── policies/       # Bound policies
│   │   │   ├── payments/       # Payment processing
│   │   │   ├── docs/           # Documents & e-sign
│   │   │   └── bind/           # Bind requests
│   │   ├── (admin)/            # Admin routes
│   │   │   ├── dashboard/      # Admin dashboard
│   │   │   ├── submissions/    # Submission management
│   │   │   └── quotes/         # Quote entry
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication
│   │   │   ├── forms/          # Form templates
│   │   │   ├── submissions/    # Submission CRUD
│   │   │   ├── quotes/         # Quote management
│   │   │   ├── finance/        # Finance calculator
│   │   │   ├── payments/       # Payment processing
│   │   │   ├── docs/            # Document management
│   │   │   ├── bind/            # Bind requests
│   │   │   └── admin/          # Admin APIs
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── DynamicForm.tsx     # Dynamic form renderer
│   │   ├── FinanceOption.tsx   # Finance calculator UI
│   │   └── providers.tsx       # NextAuth SessionProvider
│   ├── lib/                    # Utilities
│   │   ├── mongodb.ts          # MongoDB connection
│   │   └── auth.ts             # Auth helpers (hash/verify)
│   ├── models/                 # Mongoose models
│   │   ├── Agency.ts
│   │   ├── User.ts
│   │   ├── FormTemplate.ts
│   │   ├── Industry.ts
│   │   ├── Submission.ts
│   │   ├── Carrier.ts
│   │   ├── RoutingRule.ts
│   │   ├── RoutingLog.ts
│   │   ├── Quote.ts
│   │   ├── FinancePlan.ts
│   │   ├── Payment.ts
│   │   ├── Document.ts
│   │   └── Policy.ts
│   ├── services/               # Business logic
│   │   ├── RoutingEngine.ts    # Carrier routing
│   │   ├── FinanceService.ts   # EMI calculations
│   │   ├── DocumentService.ts  # Document generation
│   │   └── ESignService.ts     # E-signature (mock)
│   └── utils/                  # Helper functions
│       ├── fileUpload.ts       # File upload handler
│       ├── documentGenerator.ts # PDF generation
│       └── csvExporter.ts      # CSV export
├── scripts/                    # Seed & utility scripts
│   ├── seedForms.ts            # Seed form templates
│   ├── seedAll.ts              # Complete seed script
│   └── seedRoutingRules.ts    # Seed routing rules
├── tests/                      # Test files
│   ├── DynamicForm.test.ts
│   ├── RoutingEngine.test.ts
│   └── FinanceService.test.ts
├── public/                     # Static assets
├── uploads/                    # Uploaded files (gitignored)
├── .env.example                # Environment variables template
├── .env.local                  # Local environment (gitignored)
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── package.json                # Dependencies & scripts
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose setup
└── README.md                   # This file
```

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run seed         # Seed database with sample data

# Testing
npm test             # Run tests
```

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# MongoDB
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/sterling_portal?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret-here"

# Environment
NODE_ENV="development"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

## 🎨 California-Specific Features

- **CA License Fields**: CSLB contractor license, CA DOT #, Health Permit #, EIN, CA business registration
- **CCPA Compliance**: Privacy checkbox on public forms with link to Privacy Policy
- **E-Sign Compliance**: ESIGN/UETA compliance notes in UI
- **State-Specific Routing**: Automatic carrier routing based on CA operations
- **USD Currency**: All amounts in USD

## 📊 Demo Flow (Viva)

1. **Agency Registration**: Create agency account
2. **Login**: Agency user logs in
3. **Select Industry**: Choose Restaurant/Contractor/Trucking
4. **Fill Dynamic Form**: Complete CA-specific fields
5. **Submit Application**: Upload documents, confirm CCPA consent
6. **Automatic Routing**: System routes to appropriate carrier
7. **Admin Quote Entry**: Admin enters carrier quote, system calculates wholesale fee
8. **Agency Quote View**: Agency sees quote, enters broker fee
9. **Finance Option**: Calculate EMI with down payment
10. **Payment**: Process payment (mock)
11. **E-Sign Documents**: Generate and send for signature
12. **Bind Request**: Agency requests bind
13. **Policy Issuance**: Admin uploads final policy
14. **View Bound Policies**: Agency sees completed policy

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific features
npm test -- DynamicForm
npm test -- RoutingEngine
npm test -- FinanceService
```

## 🐳 Docker Support

```bash
# Build and run with Docker Compose
docker-compose up -d

# This will start:
# - MongoDB (port 27017)
# - Next.js app (port 3000)
```

## 📄 License

Proprietary - Sterling Wholesale Insurance

## 👥 Support

For questions or issues, contact: info@sterlingwholesaleinsurance.com

---

**Built for Sterling Wholesale Insurance** | California-focused wholesale insurance portal
