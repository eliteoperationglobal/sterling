/**
 * Quote PDF Generation Service
 * Generates professional insurance quote PDFs
 */

interface QuoteData {
  quoteNumber: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  programName: string;
  effectiveDate: string;
  expirationDate: string;
  premium: number;
  coverageLimits: string;
  deductible: string;
  grossReceipts: string;
  selectedStates: string[];
  endorsements: string[];
}

/**
 * Generate Quote PDF (HTML to be rendered)
 * In production, use libraries like:
 * - jsPDF with html2canvas
 * - Puppeteer
 * - PDFKit
 * - react-pdf
 */
export function generateQuoteHTML(quoteData: QuoteData): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Insurance Quote - ${quoteData.quoteNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      padding: 40px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 4px solid #00BCD4;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo-section {
      flex: 1;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2F4156;
      margin-bottom: 5px;
    }
    
    .subtitle {
      font-size: 14px;
      color: #666;
    }
    
    .quote-info {
      text-align: right;
    }
    
    .quote-number {
      font-size: 24px;
      font-weight: bold;
      color: #00BCD4;
      margin-bottom: 5px;
    }
    
    .quote-date {
      font-size: 12px;
      color: #666;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #2F4156;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #00BCD4;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .info-item {
      padding: 12px;
      background: #f8f9fa;
      border-left: 3px solid #00BCD4;
    }
    
    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .premium-box {
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);
    }
    
    .premium-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .premium-amount {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .premium-period {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .coverage-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    .coverage-table th {
      background: #2F4156;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    
    .coverage-table td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .coverage-table tr:hover {
      background: #f8f9fa;
    }
    
    .endorsements-list {
      list-style: none;
      padding: 0;
    }
    
    .endorsements-list li {
      padding: 10px;
      margin-bottom: 8px;
      background: #f8f9fa;
      border-left: 3px solid #00BCD4;
      display: flex;
      align-items: center;
    }
    
    .endorsements-list li:before {
      content: "✓";
      color: #00BCD4;
      font-weight: bold;
      margin-right: 10px;
      font-size: 18px;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    
    .disclaimer {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 11px;
      line-height: 1.5;
    }
    
    .validity {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      padding: 12px;
      border-radius: 4px;
      margin: 15px 0;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .premium-box {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo">Sterling Wholesale Insurance</div>
      <div class="subtitle">Professional Insurance Solutions</div>
    </div>
    <div class="quote-info">
      <div class="quote-number">${quoteData.quoteNumber}</div>
      <div class="quote-date">Date: ${currentDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Insured Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Company Name</div>
        <div class="info-value">${quoteData.companyName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Contact Person</div>
        <div class="info-value">${quoteData.contactName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${quoteData.email}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${quoteData.phone}</div>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <div class="info-label">Address</div>
        <div class="info-value">${quoteData.address}</div>
      </div>
    </div>
  </div>

  <div class="premium-box">
    <div class="premium-label">Your Quoted Premium</div>
    <div class="premium-amount">$${quoteData.premium.toLocaleString()}</div>
    <div class="premium-period">per year</div>
  </div>

  <div class="section">
    <div class="section-title">Policy Details</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Program</div>
        <div class="info-value">${quoteData.programName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Coverage Limits</div>
        <div class="info-value">${quoteData.coverageLimits}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Deductible</div>
        <div class="info-value">${quoteData.deductible}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Gross Receipts</div>
        <div class="info-value">$${parseFloat(quoteData.grossReceipts).toLocaleString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Effective Date</div>
        <div class="info-value">${new Date(quoteData.effectiveDate).toLocaleDateString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Expiration Date</div>
        <div class="info-value">${new Date(quoteData.expirationDate).toLocaleDateString()}</div>
      </div>
    </div>
  </div>

  <div class="validity">
    <strong>Quote Validity:</strong> This quote is valid until ${new Date(quoteData.expirationDate).toLocaleDateString()}. 
    Premium and coverage are subject to carrier approval and underwriting review.
  </div>

  <div class="section">
    <div class="section-title">Operating Locations</div>
    <p style="padding: 10px; background: #f8f9fa; border-radius: 4px;">
      ${quoteData.selectedStates.join(', ')}
    </p>
  </div>

  ${quoteData.endorsements.length > 0 ? `
  <div class="section">
    <div class="section-title">Included Endorsements</div>
    <ul class="endorsements-list">
      ${quoteData.endorsements.map(e => `<li>${e}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="disclaimer">
    <strong>Important Notice:</strong> This quote is an estimate based on the information provided. 
    Final premium may vary based on underwriting review, inspection results, and carrier approval. 
    This is not a binder or policy. Coverage is not in effect until confirmed and premium is paid.
  </div>

  <div class="footer">
    <p><strong>Sterling Wholesale Insurance</strong></p>
    <p>Questions? Contact us at quotes@sterlingwholesale.com | (555) 123-4567</p>
    <p style="margin-top: 10px;">© ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF from quote data
 * Returns HTML that can be converted to PDF using browser's print functionality
 * or a server-side PDF generator
 */
export async function generateQuotePDF(quoteData: QuoteData): Promise<string> {
  return generateQuoteHTML(quoteData);
}













