const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer');

async function generatePDF() {
  console.log('Starting Sterling Documentation PDF generation...');

  // 1. Load logo as base64 if available
  let logoBase64 = '';
  const logoPath = path.join(__dirname, '../public/logos/sterling_title.png');
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  }

  // 2. Build complete, professional HTML document
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sterling Wholesale Insurance Portal — Documentation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: letter;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1f2937;
      background: #ffffff;
    }

    .page {
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px;
      page-break-after: always;
      border: 1px solid #e5e7eb;
      background: linear-gradient(180deg, #fafaf9 0%, #ffffff 100%);
      border-radius: 8px;
    }

    .cover-header {
      border-bottom: 3px solid #9A8B7A;
      padding-bottom: 25px;
    }

    .cover-logo {
      max-height: 85px;
      max-width: 280px;
      object-fit: contain;
      margin-bottom: 20px;
    }

    .badge {
      display: inline-block;
      background: #9A8B7A;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #111827;
      line-height: 1.15;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #4b5563;
      font-weight: 400;
      line-height: 1.4;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 40px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 3px;
    }

    .meta-value {
      font-size: 10pt;
      font-weight: 600;
      color: #111827;
    }

    .cover-footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 15px;
      font-size: 8pt;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Content Styling */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #111827;
      margin-top: 25px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #9A8B7A;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1f2937;
      margin-top: 20px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #374151;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 10px;
      color: #374151;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
      color: #374151;
    }

    li {
      margin-bottom: 4px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
      font-size: 8.5pt;
      border: 1px solid #e5e7eb;
      background: #ffffff;
    }

    th, td {
      padding: 7px 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      vertical-align: top;
    }

    th:last-child, td:last-child {
      border-right: none;
    }

    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) td {
      background: #fcfcfd;
    }

    /* Code Blocks */
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.45;
      margin: 10px 0 14px 0;
      overflow-x: auto;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* Cards & Boxes */
    .info-box {
      background: #fdfaf7;
      border-left: 4px solid #9A8B7A;
      padding: 12px 14px;
      margin: 14px 0;
      border-radius: 0 4px 4px 0;
    }

    .info-box-title {
      font-weight: 700;
      color: #9A8B7A;
      margin-bottom: 4px;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 12px 0 16px 0;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }

    .card-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .card-desc {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.4;
    }

    /* Workflow Diagram */
    .flow-step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 5px;
      padding: 8px 12px;
    }

    .step-number {
      background: #9A8B7A;
      color: white;
      font-weight: 700;
      font-size: 8pt;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
    }

    .step-title {
      font-weight: 700;
      font-size: 9pt;
      color: #111827;
    }

    .step-detail {
      font-size: 8pt;
      color: #4b5563;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-header">
      ${logoBase64 ? '<img src="' + logoBase64 + '" class="cover-logo" alt="Sterling Logo" />' : ''}
      <div class="badge">Official Technical Document</div>
      <div class="cover-title">Sterling Wholesale Insurance Portal</div>
      <div class="cover-subtitle">Enterprise Technical Architecture, Operational Workflow Manual & Complete API Directory</div>
    </div>

    <div class="cover-meta-grid">
      <div class="meta-item">
        <span class="meta-label">Application Core</span>
        <span class="meta-value">Next.js 14 (App Router) + TypeScript</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Persistence & Cloud Tier</span>
        <span class="meta-value">MongoDB Atlas + Backblaze B2 (S3 SDK)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Target Jurisdiction</span>
        <span class="meta-value">US Commercial Lines & Surplus Lines</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Primary Modules</span>
        <span class="meta-value">Builders Risk, GL, Inland Marine, Habitational</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Document Date</span>
        <span class="meta-value">November 2026</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Repository Target</span>
        <span class="meta-value">eliteoperationglobal/sterling (main)</span>
      </div>
    </div>

    <div class="cover-footer">
      <span>Sterling Wholesale Insurance Services LLC</span>
      <span>Confidential & Proprietary Developer Documentation</span>
    </div>
  </div>

  <!-- TABLE OF CONTENTS & EXECUTIVE SUMMARY -->
  <div class="page">
    <h1>1. Executive Summary & Core Mission</h1>
    <p>
      The <strong>Sterling Wholesale Insurance Portal</strong> is a specialized enterprise brokerage management solution engineered to solve the complex underwriting, statutory compliance, rating, and binding challenges inherent to US commercial surplus lines insurance.
    </p>

    <div class="info-box">
      <div class="info-box-title">System Mission & Purpose</div>
      <p style="margin: 0; font-size: 8.5pt;">
        To eliminate latency in the wholesale placement pipeline by providing an automated, multi-party bridge connecting retail insurance producers, wholesale underwriters, surplus lines stamping offices (e.g. California SLA, SLTX), premium finance companies, and insurance carriers.
      </p>
    </div>

    <h2>High-Level System Capabilities</h2>
    <div class="card-grid">
      <div class="card">
        <div class="card-title">🏢 Retail Agency Portal</div>
        <div class="card-desc">Provides retail insurance brokers with a digital command center to submit commercial risks, track underwriting status, customize retail broker fees, dispatch client e-sign envelopes, and request immediate policy binding.</div>
      </div>
      <div class="card">
        <div class="card-title">⚙️ Wholesale Underwriter Console</div>
        <div class="card-desc">Enables wholesale underwriters to manage risks across all retail agencies, evaluate loss runs, enter carrier terms, automate state surplus lines tax and stamping calculations, issue PDF proposals, and approve binds.</div>
      </div>
      <div class="card">
        <div class="card-title">🔗 Public Prospect Intake</div>
        <div class="card-desc">Retail agents generate tokenized, secure single-use web links allowing prospective clients to fill out complete commercial applications and upload documents without requiring an agency login.</div>
      </div>
      <div class="card">
        <div class="card-title">💳 Integrated Premium Financing</div>
        <div class="card-desc">Real-time EMI loan calculator supporting 10% to 25% down payments and 9-to-11 monthly installments, automatically creating formal Premium Finance Agreements (PFA).</div>
      </div>
    </div>

    <h2>Core Architecture Topology</h2>
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Component</th>
          <th>Implementation Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend & API</strong></td>
          <td>Next.js 14.2 (App Router)</td>
          <td>React Server Components (RSC), Tailwind CSS, Lucide Icons, Client Hydration via SWR.</td>
        </tr>
        <tr>
          <td><strong>Database Tier</strong></td>
          <td>MongoDB Atlas & Mongoose 8.3</td>
          <td>Document database storing polymorphic submissions, multi-policy quotes, agencies, and audit logs.</td>
        </tr>
        <tr>
          <td><strong>Identity & Auth</strong></td>
          <td>NextAuth.js v4 + JWT + 2FA</td>
          <td>Credential-based JWT session strategy with optional 6-digit email OTP 2FA and trusted device fingerprinting.</td>
        </tr>
        <tr>
          <td><strong>Cloud Storage</strong></td>
          <td>Backblaze B2 (AWS S3 SDK v3)</td>
          <td>Presigned uploads and downloads for policy binders, invoices, signed accords, and uploaded loss runs.</td>
        </tr>
        <tr>
          <td><strong>PDF Generation</strong></td>
          <td>Puppeteer & Sparticuz Chromium</td>
          <td>Server-side HTML-to-PDF rendering for ACORD 125/126, proposals, and invoices.</td>
        </tr>
        <tr>
          <td><strong>Notifications</strong></td>
          <td>Resend SDK & Nodemailer</td>
          <td>Automated transactional dispatch for quote delivery, OTP login codes, and bind confirmations.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SUPPORTED PROGRAMS & FORM INTAKE -->
  <div class="page">
    <h1>2. Supported Commercial Programs & Data Models</h1>
    <p>
      The platform accommodates diverse commercial P&C underwriting programs, each with tailored data models, validation schemas, and ACORD mappings:
    </p>

    <div class="avoid-break">
      <h2>1. Builders Risk</h2>
      <p>Specialized ground-up residential and commercial construction, renovations, and remodeling risks.</p>
      <table>
        <thead>
          <tr><th>Category</th><th>Captured Fields & Underwriting Limits</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Core Limits</strong></td>
            <td>Limit per Occurrence, Completed Value, Total Insurable Value, Existing Structure, Valuation (ACV vs Replacement Cost), Coinsurance (80%, 90%, 100%).</td>
          </tr>
          <tr>
            <td><strong>Sublimits</strong></td>
            <td>Water Damage, Soft Costs, Delay in Completion, Property in Transit, Temporary Offsite Storage, Debris Removal, Pollutant Clean-up, Scaffolding, Fire Dept Service Charge.</td>
          </tr>
          <tr>
            <td><strong>Deductibles & Values</strong></td>
            <td>All-Perils Deductible, Fire Deductible, Building Value.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="avoid-break">
      <h2>2. Contractors Equipment (Inland Marine)</h2>
      <p>Covers mobile equipment, heavy machinery, tools, and accessories utilized by trade contractors.</p>
      <ul>
        <li><strong>Scheduled Equipment</strong>: Specific items itemized by year, make, model, serial number, and individual insurable limit.</li>
        <li><strong>Unscheduled Tools & Employee Tools</strong>: Blanket coverage limit with maximum per-item caps ($2,500 / $5,000).</li>
        <li><strong>Rented / Leased Equipment</strong>: Short-term and long-term equipment rental coverage with deductible options.</li>
      </ul>
    </div>

    <div class="avoid-break">
      <h2>3. Manufacturers</h2>
      <p>Commercial coverage for light industrial, food processing, metal fabrication, and goods manufacturing.</p>
      <ul>
        <li><strong>Commercial General Liability (CGL)</strong>: Occurrence & Aggregate limits ($1M / $2M), Products & Completed Operations.</li>
        <li><strong>Commercial Property</strong>: Building value, Business Personal Property (BPP), and Equipment Breakdown.</li>
        <li><strong>Specialized Add-ons</strong>: Independent radio selection for <em>Professional Liability</em> and <em>Pollution Liability</em>.</li>
      </ul>
    </div>

    <div class="avoid-break">
      <h2>4. Apartment Buildings & Habitational</h2>
      <p>Multi-family residential risks, apartment complexes, mixed-use, and commercial residential properties.</p>
      <ul>
        <li><strong>Habitational Questionnaire</strong>: Roof age, wiring updates, plumbing pipe material, hardwired smoke detectors, tenant safety.</li>
        <li><strong>Limits & Endorsements</strong>: Building coverage, Business Income / Extra Expense, Building Ordinance & Law.</li>
      </ul>
    </div>
  </div>

  <!-- OPERATIONAL LIFECYCLE & STATE MACHINE -->
  <div class="page">
    <h1>3. End-to-End Operational Lifecycle</h1>
    <p>
      A commercial submission transitions through distinct statutory and operational states from initial intake to final policy issuance:
    </p>

    <div class="flow-step">
      <div class="step-number">1</div>
      <div class="step-content">
        <div class="step-title">Risk Intake (Draft & Submit)</div>
        <div class="step-detail">The retail broker creates a submission in the agency portal or a prospective client submits via a tokenized link (<code>/apply/[token]</code>). The intake engine validates required attachments (Loss Runs, ACORD forms) and creates a <code>Submission</code> document with status <code>SUBMITTED</code>.</div>
      </div>
    </div>

    <div class="flow-step">
      <div class="step-number">2</div>
      <div class="step-content">
        <div class="step-title">Underwriting & Multi-Carrier Quote Entry</div>
        <div class="step-detail">Wholesale underwriters inspect the risk, market to carriers (e.g. Kinsale, Richmond National, Lloyd's), and enter formal quote terms into <code>/admin/submissions/[id]/quote</code>. The system automatically computes state surplus lines tax and stamping fees.</div>
      </div>
    </div>

    <div class="flow-step">
      <div class="step-number">3</div>
      <div class="step-content">
        <div class="step-title">Proposal Publication & Broker Markup</div>
        <div class="step-detail">The underwriter posts the quote to the retail broker. The retail agent reviews terms, inputs their retail broker fee, and downloads the pixel-perfect Proposal PDF. The submission status updates to <code>QUOTED</code> / <code>ACCEPTED_BY_AGENCY</code>.</div>
      </div>
    </div>

    <div class="flow-step">
      <div class="step-number">4</div>
      <div class="step-content">
        <div class="step-title">E-Signature & Payment Capture</div>
        <div class="step-detail">The system generates the complete application packet, ACORD 125/126 forms, and Payment Authorization / Premium Finance Agreement. Digital e-signatures are captured from the insured and broker. Payment is authorized via Credit Card, ACH, or Financed down payment.</div>
      </div>
    </div>

    <div class="flow-step">
      <div class="step-number">5</div>
      <div class="step-content">
        <div class="step-title">Bind Request & Policy Issuance</div>
        <div class="step-detail">The agent clicks 'Request Bind'. The underwriter verifies subjectivities and payment confirmation, approves the order, uploads the final policy binder, and issues the policy. The status becomes <code>BOUND</code>.</div>
      </div>
    </div>

    <div class="flow-step">
      <div class="step-number">6</div>
      <div class="step-content">
        <div class="step-title">Post-Bind Administration & Policy Audits</div>
        <div class="step-detail">The platform supports mid-term policy endorsements, cancellations, and premium audits via <code>/admin/audit</code> and <code>/admin/cancel-requests</code>.</div>
      </div>
    </div>

    <h2>State Surplus Lines Tax & Stamping Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>State Jurisdiction</th>
          <th>Surplus Lines Tax Rate</th>
          <th>Stamping Office Fee</th>
          <th>Statutory Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>California (CA)</strong></td>
          <td>3.00%</td>
          <td>0.250% (SLA CA)</td>
          <td>Calculated on Gross Premium + Carrier Fees + Wholesale Policy Fee.</td>
        </tr>
        <tr>
          <td><strong>Texas (TX)</strong></td>
          <td>4.85%</td>
          <td>0.040% (SLTX)</td>
          <td>Surplus Lines Stamping Office of Texas reporting.</td>
        </tr>
        <tr>
          <td><strong>Florida (FL)</strong></td>
          <td>4.94%</td>
          <td>0.060% (FSLSO)</td>
          <td>Florida Surplus Lines Service Office filing requirements.</td>
        </tr>
        <tr>
          <td><strong>All Other States</strong></td>
          <td>Dynamic Lookup</td>
          <td>State Stamping Fee</td>
          <td>Engine references <code>src/lib/data/stateTaxRates.ts</code> by property risk state.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- API REFERENCE DIRECTORY -->
  <div class="page">
    <h1>4. Core RESTful API Directory</h1>
    <p>
      The platform exposes over 100 modular route handlers structured across clean administrative, agency, and public domains:
    </p>

    <h2>Administrative Endpoints (<code>/api/admin/*</code>)</h2>
    <table>
      <thead>
        <tr><th>Endpoint</th><th>HTTP</th><th>File Route</th><th>Operational Description</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/api/admin/submissions</code></td>
          <td><code>GET, POST</code></td>
          <td><code>admin/submissions/route.ts</code></td>
          <td>Query, filter, and paginate wholesale submissions across all agencies.</td>
        </tr>
        <tr>
          <td><code>/api/admin/submissions/[id]</code></td>
          <td><code>GET, PUT</code></td>
          <td><code>admin/submissions/[id]/route.ts</code></td>
          <td>Inspect submission details and update risk specifications.</td>
        </tr>
        <tr>
          <td><code>/api/admin/quotes/[id]/enter</code></td>
          <td><code>POST</code></td>
          <td><code>admin/quotes/[id]/enter/route.ts</code></td>
          <td>Persist carrier quote limits, deductibles, premiums, and calculate taxes.</td>
        </tr>
        <tr>
          <td><code>/api/admin/quotes/[id]/post</code></td>
          <td><code>POST</code></td>
          <td><code>admin/quotes/[id]/post/route.ts</code></td>
          <td>Publish completed carrier quote to the retail broker.</td>
        </tr>
        <tr>
          <td><code>/api/admin/bind-requests/approve</code></td>
          <td><code>POST</code></td>
          <td><code>admin/bind-requests/approve/route.ts</code></td>
          <td>Approve retail bind order, generate bound policy, and dispatch alerts.</td>
        </tr>
        <tr>
          <td><code>/api/admin/audits</code></td>
          <td><code>GET, POST</code></td>
          <td><code>admin/audits/route.ts</code></td>
          <td>Manage policy premium audits and mid-term adjustment invoices.</td>
        </tr>
        <tr>
          <td><code>/api/admin/submissions/[id]/proposal</code></td>
          <td><code>GET</code></td>
          <td><code>admin/submissions/[id]/proposal/route.ts</code></td>
          <td>Stream real-time rendered Puppeteer proposal PDF for underwriter.</td>
        </tr>
      </tbody>
    </table>

    <h2>Agency Endpoints (<code>/api/agency/*</code>)</h2>
    <table>
      <thead>
        <tr><th>Endpoint</th><th>HTTP</th><th>File Route</th><th>Operational Description</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/api/agency/submissions</code></td>
          <td><code>GET, POST</code></td>
          <td><code>agency/submissions/route.ts</code></td>
          <td>Retrieve submissions scoped to the authenticated agency context.</td>
        </tr>
        <tr>
          <td><code>/api/agency/applications/submit</code></td>
          <td><code>POST</code></td>
          <td><code>agency/applications/submit/route.ts</code></td>
          <td>Direct risk application intake with multi-file attachment parsing.</td>
        </tr>
        <tr>
          <td><code>/api/agency/links/generate</code></td>
          <td><code>POST</code></td>
          <td><code>agency/links/generate/route.ts</code></td>
          <td>Create cryptographically secure, tokenized intake links for clients.</td>
        </tr>
        <tr>
          <td><code>/api/agency/quotes/[id]</code></td>
          <td><code>GET</code></td>
          <td><code>agency/quotes/[id]/route.ts</code></td>
          <td>Fetch received carrier quote terms and configure broker fee markup.</td>
        </tr>
        <tr>
          <td><code>/api/agency/submissions/[id]/request-bind</code></td>
          <td><code>POST</code></td>
          <td><code>agency/.../request-bind/route.ts</code></td>
          <td>Submit bind order to wholesale underwriting with payment authorization.</td>
        </tr>
      </tbody>
    </table>

    <h2>Public & Utility Endpoints (<code>/api/*</code>)</h2>
    <table>
      <thead>
        <tr><th>Endpoint</th><th>HTTP</th><th>File Route</th><th>Operational Description</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/api/auth/[...nextauth]</code></td>
          <td><code>GET, POST</code></td>
          <td><code>auth/[...nextauth]/route.ts</code></td>
          <td>NextAuth credential verification, JWT generation, and 2FA OTP handler.</td>
        </tr>
        <tr>
          <td><code>/api/public/links/verify</code></td>
          <td><code>GET</code></td>
          <td><code>public/links/verify/route.ts</code></td>
          <td>Validate single-use dynamic link token for prospective client intake.</td>
        </tr>
        <tr>
          <td><code>/api/public/applications/submit</code></td>
          <td><code>POST</code></td>
          <td><code>public/.../submit/route.ts</code></td>
          <td>Unauthenticated client submission intake via verified token.</td>
        </tr>
        <tr>
          <td><code>/api/finance/quote</code></td>
          <td><code>POST</code></td>
          <td><code>finance/quote/route.ts</code></td>
          <td>Calculate EMI loan installments, down payments, APR, and PFA terms.</td>
        </tr>
        <tr>
          <td><code>/api/tax/calculate</code></td>
          <td><code>POST</code></td>
          <td><code>tax/calculate/route.ts</code></td>
          <td>Calculate statutory state surplus lines tax and stamping fees.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- DEPLOYMENT & MAINTENANCE GUIDE -->
  <div class="page">
    <h1>5. Installation, Deployment & System Maintenance</h1>

    <h2>Local Development Setup</h2>
    <pre><code># 1. Clone repository & install dependencies
git clone https://github.com/eliteoperationglobal/sterling.git
cd sterling
npm install

# 2. Configure environment file
cp .env.example .env.local
# (Populate MONGODB_URI, NEXTAUTH_SECRET, JWT_SECRET, etc.)

# 3. Seed database with core agencies, carriers, forms & admin
npm run seed

# 4. Start local development server
npm run dev
# Running at: http://localhost:3000</code></pre>

    <h2>Deployment Topologies</h2>
    <div class="card-grid">
      <div class="card">
        <div class="card-title">▲ Vercel Serverless</div>
        <div class="card-desc">Connect repository directly to Vercel. Puppeteer uses <code>@sparticuz/chromium</code> for serverless PDF rendering. Configure environment variables in the project dashboard.</div>
      </div>
      <div class="card">
        <div class="card-title">🐳 Docker & Docker Compose</div>
        <div class="card-desc">Execute <code>docker-compose up -d --build</code>. Utilizes multi-stage standalone Node.js container with integrated dependencies on port 3000.</div>
      </div>
    </div>

    <h2>Pre-Deployment Verification Script</h2>
    <p>
      An automated diagnostic script is provided in the repository to verify environment variables, git sync, and import integrity prior to deploying to staging or production:
    </p>
    <pre><code>powershell -ExecutionPolicy Bypass -File .\\check-deployment-ready.ps1</code></pre>

    <div class="info-box">
      <div class="info-box-title">Document Verification & Maintenance</div>
      <p style="margin: 0; font-size: 8.5pt;">
        This document represents the official architectural baseline for <strong>Sterling Wholesale Insurance Services</strong>. For questions or system upgrades, refer to the active repository at <a href="https://github.com/eliteoperationglobal/sterling" style="color:#9A8B7A; text-decoration: none; font-weight: 600;">github.com/eliteoperationglobal/sterling</a>.
      </p>
    </div>
  </div>

</body>
</html>
`;

  // 3. Save standalone HTML document
  const htmlOutputPath = path.join(__dirname, '../Sterling_Wholesale_Insurance_Portal_Documentation.html');
  fs.writeFileSync(htmlOutputPath, htmlContent, 'utf8');
  console.log(`Saved HTML document to: ${htmlOutputPath}`);

  // 4. Launch Puppeteer with isolated user data dir
  const tempDir = path.join(os.tmpdir(), 'puppeteer_pdf_' + Date.now());
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: tempDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfOutputPath = path.join(__dirname, '../Sterling_Wholesale_Insurance_Portal_Documentation.pdf');

    await page.pdf({
      path: pdfOutputPath,
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 8pt; font-family: 'Inter', sans-serif; color: #94a3b8; display: flex; justify-content: space-between; padding: 0 14mm 10px 14mm;">
          <span>Sterling Wholesale Insurance Portal — Technical Documentation</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '18mm',
        right: '14mm',
        bottom: '18mm',
        left: '14mm',
      },
    });

    console.log(`SUCCESS! Generated PDF document at: ${pdfOutputPath}`);
    const stats = fs.statSync(pdfOutputPath);
    console.log(`PDF File Size: ${(stats.size / 1024).toFixed(2)} KB`);
  } finally {
    await browser.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore cleanup errors
    }
  }
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
