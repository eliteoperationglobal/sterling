# Sterling Wholesale Insurance Portal

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-green?logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

An enterprise-grade wholesale commercial insurance portal built with **Next.js 14 (App Router)**, **TypeScript**, and **MongoDB**. Designed specifically for US commercial lines and surplus lines brokerage operations, this platform enables retail agencies to submit complex commercial risks, receive formal underwriting proposals, finance policies via EMI installments, execute digital e-signatures, and bind coverage in a unified web platform.

> 📖 **Full System Documentation**: For the detailed 14-section architectural breakdown, data models, state machines, and comprehensive API catalog, please refer to [**DOCUMENTATION.md**](./DOCUMENTATION.md).

---

## 🚀 Key Modules & Capabilities

- **🏛️ Multi-Tier Architecture & RBAC**
  - **Underwriter Admin Console (`/admin/*`)**: Complete submission intake review, carrier quote rating, surplus lines tax and fee calculations, proposal generation, bind approvals, policy issuance, and mid-term audit management.
  - **Retail Agency Portal (`/agency/*`)**: Multi-user agency management, customized risk intake forms, broker fee markup configuration, digital signature dispatch, payment authorization, and real-time policy binding.
  - **Public Prospect Intake (`/apply/*`)**: Single-use tokenized intake links allowing prospect insureds to enter application data and upload documents securely.

- **📋 Supported Commercial Insurance Programs**
  - **Builders Risk**: Ground-up, renovations, soft costs, water damage, delay in completion, all-perils deductibles, fire deductibles, and building value limits.
  - **Contractors Equipment (Inland Marine)**: Scheduled tools, unscheduled tools, employee tools, and rented/leased machinery.
  - **Manufacturers**: Commercial General Liability (CGL), Products & Completed Operations, Property, Equipment Breakdown, with independent options for Professional & Pollution Liability.
  - **Apartment Buildings / Habitational**: Multi-unit habitational questionnaires, building limits, business income, and ordinance/law coverage.
  - **Commercial Property & General Liability**: Full ISO classification, payroll, subcontractor costs, and gross receipts rating.

- **📄 Dynamic PDF Generation & Proposal Engine**
  - Pixel-perfect server-side PDF generation using Puppeteer and Sparticuz Chromium.
  - Instant rendering of ACORD 125/126 applications, formal wholesale carrier proposals, invoices, payment authorizations, and policy binders.

- **💰 State Surplus Lines Tax & Financing Integration**
  - Automated surplus lines tax and stamping fee calculation engine for California (CA SLA 0.25% + 3.0% Tax), Texas, Florida, and all 50 US states.
  - Dynamic EMI Premium Financing calculator with custom down-payment percentages, loan installments, APR calculations, and digital Premium Finance Agreement (PFA) generation.

- **🔒 Enterprise Security & 2FA**
  - NextAuth.js authentication with JWT session cookies and bcrypt password hashing.
  - Optional Email OTP Two-Factor Authentication (2FA) with trusted device fingerprinting.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 14.2 (App Router, Server Components & Server Actions) |
| **Language** | TypeScript 5 |
| **Database** | MongoDB Atlas via Mongoose ODM v8.3 |
| **Authentication** | NextAuth.js v4 + JWT + bcryptjs + crypto OTP |
| **Styling** | Tailwind CSS + Lucide Icons + Sonner Toasts |
| **Object Storage** | Backblaze B2 (AWS S3 Client SDK v3) |
| **PDF Engine** | Puppeteer v24, Sparticuz Chromium v131, React-PDF |
| **Email Service** | Resend API + Nodemailer fallback |
| **Form Management** | React Hook Form + Zod Schema Validation |

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.17.0+ or v20.x LTS
- **MongoDB**: Active MongoDB Atlas cluster or local MongoDB instance
- **npm**: v9+ or v10+

### 1. Clone & Install
```bash
git clone https://github.com/eliteoperationglobal/sterling.git
cd sterling
npm install
```

### 2. Configure Environment Variables
Create your local environment file:
```bash
cp .env.example .env.local
```
Configure your `.env.local` settings:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/sterling?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_nextauth_secret
JWT_SECRET=your_32_character_jwt_secret
NODE_ENV=development
```
*(See [`.env.example`](./.env.example) for the full list of Backblaze B2, Resend, and SmartyStreets keys)*

### 3. Seed Database
Seed default underwriting carriers, form templates, routing rules, agencies, and admin accounts:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Default Test Accounts (From Seed)

| Portal | Role | Email | Password |
|---|---|---|---|
| **Admin Console** | System Admin / Underwriter | `admin@sterling.com` | `Admin123!` |
| **Agency Portal** | Agency Admin (Broker) | `agent@gamaty.com` | `Agent123!` |
| **Agency Portal** | Agency Admin (Broker) | `agent@blueangel.com` | `Agent123!` |

---

## 📁 Repository Structure

```
sterling/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Admin underwriting portal (submissions, quotes, bind, audits)
│   │   ├── agency/               # Retail agency portal (applications, quotes, documents, team)
│   │   ├── api/                  # RESTful backend API routes
│   │   │   ├── admin/            # Underwriting management endpoints
│   │   │   ├── agency/           # Retail broker endpoints
│   │   │   ├── auth/             # NextAuth session & credentials route
│   │   │   ├── finance/          # Premium financing EMI & PFA routes
│   │   │   ├── public/           # Tokenized client intake endpoints
│   │   │   └── tax/              # Surplus lines tax calculation route
│   │   └── signin/               # Authentication & login UI
│   ├── components/               # Reusable React UI components
│   │   ├── audits/               # Policy audit tabs & forms
│   │   ├── finance/              # Premium finance calculators
│   │   ├── layout/               # Topbar, navigation & responsive wrappers
│   │   └── ui/                   # Buttons, dialogs, modals, and input fields
│   ├── lib/                      # Core business logic & services
│   │   ├── data/                 # State tax rates (CA, TX, FL, etc.)
│   │   ├── services/
│   │   │   ├── email/            # Resend / Nodemailer transactional mailer
│   │   │   └── pdf/              # Puppeteer HTML-to-PDF templates & mappers
│   │   ├── authOptions.ts        # NextAuth configuration
│   │   └── mongodb.ts            # Mongoose singleton connection
│   ├── models/                   # Mongoose schemas (Quote, Submission, User, Agency, Audit, etc.)
│   └── utils/                    # Number formatters, date utilities, URL helpers
├── scripts/                      # Database seeders (seedAll.ts, seedForms.ts, etc.)
├── nginx/                        # Nginx reverse proxy configuration template
├── check-deployment-ready.ps1    # Automated pre-deployment verification script
├── docker-compose.yml            # Multi-container orchestration
├── Dockerfile                    # Multi-stage production container build
├── ecosystem.config.js           # PM2 process configuration for self-hosted servers
├── .env.example                  # Environment variable reference
└── DOCUMENTATION.md              # In-depth system documentation & architecture guide
```

---

## 📦 Production Deployment

### Automated Pre-Flight Check
Before deploying to production, run the built-in diagnostic script:
```powershell
./check-deployment-ready.ps1
```

### Docker Deployment
```bash
docker-compose up -d --build
```

### Vercel Deployment
Deploy directly to Vercel by importing the repository and adding the environment variables specified in `.env.example`.

### Self-Hosted (PM2 + Nginx)
```bash
npm run build
pm2 start ecosystem.config.js
```

---

## 📄 License & Maintainers

- **Owner**: Sterling Wholesale Insurance / [eliteoperationglobal](https://github.com/eliteoperationglobal/sterling)
- **Support**: Review [DOCUMENTATION.md](./DOCUMENTATION.md) for complete technical guides and endpoint specifications.
