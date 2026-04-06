/**
 * Binder PDF Generator
 * Generates a professional binder document for the broker to present to the insured
 */

interface BinderData {
  // Quote Information
  quoteNumber: string;
  binderDate: string;
  
  // Insured Information
  companyName: string;
  dba?: string;
  firstName: string;
  lastName: string;
  entityType: string;
  companyFEIN: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Agency Information
  agencyName: string;
  agencyEmail?: string;
  
  // Carrier Information
  carrierName: string;
  carrierReference?: string;
  
  // Policy Information
  policyNumber?: string;
  effectiveDate: string;
  expirationDate: string;
  programName: string;
  
  // Premium Breakdown
  carrierQuoteUSD: number;
  // No wholesale fee - removed per user request
  premiumTaxPercent?: number;
  premiumTaxAmountUSD?: number;
  policyFeeUSD?: number;
  brokerFeeAmountUSD?: number;
  finalAmountUSD: number;
  
  // Limits
  limits?: {
    generalLiability?: string;
    aggregateLimit?: string;
    fireLegalLimit?: string;
    medicalExpenseLimit?: string;
    deductible?: string;
  };
  
  // Endorsements
  endorsements?: string[];
  
  // Special Notes
  specialNotes?: string;
}

export function generateBinderHTML(data: BinderData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #2c3e50;
      padding: 30px;
      background: #ffffff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 4px solid #00BCD4;
    }
    
    .header h1 {
      font-size: 32px;
      color: #1a1a1a;
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .header .subtitle {
      font-size: 18px;
      color: #00BCD4;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .binder-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding: 15px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 4px solid #00BCD4;
      border-radius: 4px;
    }
    
    .binder-info div {
      font-size: 10px;
      line-height: 1.6;
    }
    
    .binder-info strong {
      color: #00BCD4;
      font-weight: 600;
      display: block;
      margin-bottom: 3px;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .section-header {
      background: linear-gradient(135deg, #3A3C3F 0%, #2c2d30 100%);
      color: white;
      padding: 10px 15px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .section-content {
      padding: 15px;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .field-group {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .field-group:last-child {
      border-bottom: none;
    }
    
    .field-label {
      font-weight: 600;
      color: #555;
      margin-bottom: 4px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .field-value {
      color: #1a1a1a;
      padding-left: 8px;
      font-size: 11px;
      font-weight: 400;
    }
    
    .premium-breakdown {
      background: #f8f9fa;
      border: 2px solid #00BCD4;
      border-radius: 4px;
      padding: 15px;
      margin: 15px 0;
    }
    
    .premium-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .premium-row:last-child {
      border-bottom: none;
      border-top: 2px solid #00BCD4;
      margin-top: 8px;
      padding-top: 12px;
    }
    
    .premium-row.total {
      font-size: 14px;
      font-weight: 700;
      color: #00BCD4;
    }
    
    .endorsements-list {
      padding-left: 20px;
      list-style: none;
    }
    
    .endorsements-list li {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
      font-size: 10px;
    }
    
    .endorsements-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #00BCD4;
      font-weight: bold;
      font-size: 12px;
    }
    
    .important-notice {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 3px;
    }
    
    .important-notice h4 {
      color: #856404;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .important-notice p {
      color: #856404;
      font-size: 10px;
      line-height: 1.6;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 3px solid #e0e0e0;
      text-align: center;
      font-size: 9px;
      color: #888;
      line-height: 1.6;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>STERLING WHOLESALE INSURANCE</h1>
    <div class="subtitle">Certificate of Insurance / Binder</div>
  </div>
  
  <div class="binder-info">
    <div>
      <strong>Binder Number:</strong>
      <span>${data.quoteNumber}</span>
    </div>
    <div>
      <strong>Binder Date:</strong>
      <span>${data.binderDate}</span>
    </div>
    <div>
      <strong>Program:</strong>
      <span>${data.programName}</span>
    </div>
  </div>
  
  <!-- Insured Information -->
  <div class="section">
    <div class="section-header">Insured Information</div>
    <div class="section-content">
      <div class="two-column">
        <div class="field-group">
          <div class="field-label">Company Name:</div>
          <div class="field-value">${data.companyName}</div>
        </div>
        ${data.dba ? `
        <div class="field-group">
          <div class="field-label">DBA:</div>
          <div class="field-value">${data.dba}</div>
        </div>
        ` : ''}
        <div class="field-group">
          <div class="field-label">Contact Name:</div>
          <div class="field-value">${data.firstName} ${data.lastName}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Entity Type:</div>
          <div class="field-value">${data.entityType}</div>
        </div>
        <div class="field-group">
          <div class="field-label">FEIN:</div>
          <div class="field-value">${data.companyFEIN}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Phone:</div>
          <div class="field-value">${data.phone}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Email:</div>
          <div class="field-value">${data.email}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Address:</div>
          <div class="field-value">${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Policy Information -->
  <div class="section">
    <div class="section-header">Policy Information</div>
    <div class="section-content">
      <div class="two-column">
        ${data.policyNumber ? `
        <div class="field-group">
          <div class="field-label">Policy Number:</div>
          <div class="field-value">${data.policyNumber}</div>
        </div>
        ` : ''}
        <div class="field-group">
          <div class="field-label">Carrier:</div>
          <div class="field-value">${data.carrierName}</div>
        </div>
        ${data.carrierReference ? `
        <div class="field-group">
          <div class="field-label">Carrier Reference:</div>
          <div class="field-value">${data.carrierReference}</div>
        </div>
        ` : ''}
        <div class="field-group">
          <div class="field-label">Effective Date:</div>
          <div class="field-value">${data.effectiveDate}</div>
        </div>
        <div class="field-group">
          <div class="field-label">Expiration Date:</div>
          <div class="field-value">${data.expirationDate}</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Coverage Limits -->
  ${data.limits ? `
  <div class="section">
    <div class="section-header">Coverage Limits</div>
    <div class="section-content">
      <div class="two-column">
        ${data.limits.generalLiability ? `
        <div class="field-group">
          <div class="field-label">General Liability:</div>
          <div class="field-value">${data.limits.generalLiability}</div>
        </div>
        ` : ''}
        ${data.limits.aggregateLimit ? `
        <div class="field-group">
          <div class="field-label">Aggregate Limit:</div>
          <div class="field-value">${data.limits.aggregateLimit}</div>
        </div>
        ` : ''}
        ${data.limits.fireLegalLimit ? `
        <div class="field-group">
          <div class="field-label">Fire Legal Limit:</div>
          <div class="field-value">$${data.limits.fireLegalLimit}</div>
        </div>
        ` : ''}
        ${data.limits.medicalExpenseLimit ? `
        <div class="field-group">
          <div class="field-label">Medical Expense Limit:</div>
          <div class="field-value">$${data.limits.medicalExpenseLimit}</div>
        </div>
        ` : ''}
        ${data.limits.deductible ? `
        <div class="field-group">
          <div class="field-label">Deductible:</div>
          <div class="field-value">$${data.limits.deductible}</div>
        </div>
        ` : ''}
      </div>
    </div>
  </div>
  ` : ''}
  
  <!-- Premium Breakdown -->
  <div class="section">
    <div class="section-header">Premium Breakdown</div>
    <div class="section-content">
      <div class="premium-breakdown">
        <div class="premium-row">
          <span>Carrier Quote:</span>
          <span>$${data.carrierQuoteUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        ${data.premiumTaxAmountUSD ? `
        <div class="premium-row">
          <span>Premium Tax${data.premiumTaxPercent ? ` (${data.premiumTaxPercent}%)` : ''}:</span>
          <span>$${data.premiumTaxAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
        ${data.policyFeeUSD ? `
        <div class="premium-row">
          <span>Policy Fee:</span>
          <span>$${data.policyFeeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
        ${data.brokerFeeAmountUSD ? `
        <div class="premium-row">
          <span>Broker Fee:</span>
          <span>$${data.brokerFeeAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
        <div class="premium-row total">
          <span>Total Premium:</span>
          <span>$${data.finalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Endorsements -->
  ${data.endorsements && data.endorsements.length > 0 ? `
  <div class="section">
    <div class="section-header">Included Endorsements</div>
    <div class="section-content">
      <ul class="endorsements-list">
        ${data.endorsements.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>
  </div>
  ` : ''}
  
  <!-- Special Notes -->
  ${data.specialNotes ? `
  <div class="section">
    <div class="section-header">Special Conditions / Notes</div>
    <div class="section-content">
      <p style="white-space: pre-wrap; color: #1a1a1a; font-size: 10px; line-height: 1.6;">${data.specialNotes}</p>
    </div>
  </div>
  ` : ''}
  
  <!-- Important Notice -->
  <div class="important-notice">
    <h4>IMPORTANT NOTICE</h4>
    <p>
      This binder provides temporary evidence of insurance coverage. The actual policy will be issued by the carrier 
      and will contain the complete terms, conditions, and exclusions. This binder is valid until the expiration date 
      shown above or until the policy is issued, whichever occurs first.
    </p>
    <p style="margin-top: 10px;">
      Payment of premium is required to maintain coverage. Please contact your broker or Sterling Wholesale Insurance 
      for any questions regarding this binder.
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Sterling Wholesale Insurance</strong></p>
    <p>This binder was generated electronically through the Sterling Wholesale Insurance portal.</p>
    <p>Binder generated on ${data.binderDate} | Agency: ${data.agencyName}</p>
    <p style="margin-top: 10px; font-size: 8px; color: #aaa;">
      © ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();
}

