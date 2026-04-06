/**
 * Carrier Forms PDF Generator
 * Generates required carrier forms for the insured to complete and sign
 */

interface CarrierFormsData {
  // Application Information
  submissionId: string;
  formDate: string;
  
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
  
  // Carrier Information
  carrierName: string;
  carrierReference?: string;
  
  // Program Information
  programName: string;
  
  // Application Data (from form payload)
  applicationData?: Record<string, any>;
}

export function generateCarrierFormsHTML(data: CarrierFormsData): string {
  // Extract key information from application data
  const estimatedGrossReceipts = data.applicationData?.estimatedGrossReceipts || 'N/A';
  const yearsInBusiness = data.applicationData?.yearsInBusiness || 'N/A';
  const classCodes = data.applicationData?.classCodeWork || {};
  const statesOfOperation = data.applicationData?.statesOfOperation || [];
  
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
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #6B6B6B;
      font-weight: 400;
    }
    
    .form-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    
    .form-info-item {
      flex: 1;
    }
    
    .form-info-label {
      font-size: 9px;
      color: #6B6B6B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .form-info-value {
      font-size: 13px;
      color: #1a1a1a;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-header {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #00BCD4;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .section-content {
      padding: 0 5px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .info-item {
      margin-bottom: 10px;
    }
    
    .info-label {
      font-size: 9px;
      color: #6B6B6B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    
    .info-value {
      font-size: 11px;
      color: #1a1a1a;
      font-weight: 500;
    }
    
    .form-field {
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: #fafafa;
    }
    
    .form-field-label {
      font-size: 10px;
      color: #4A4A4A;
      margin-bottom: 5px;
      font-weight: 600;
    }
    
    .form-field-input {
      border-bottom: 2px solid #1a1a1a;
      min-height: 30px;
      padding: 5px 0;
    }
    
    .checkbox-list {
      list-style: none;
      margin-top: 10px;
    }
    
    .checkbox-list li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
      font-size: 11px;
      color: #4A4A4A;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .checkbox-list li:before {
      content: "☐";
      position: absolute;
      left: 0;
      font-size: 16px;
      color: #1a1a1a;
    }
    
    .signature-section {
      margin-top: 40px;
      padding-top: 25px;
      border-top: 2px solid #e0e0e0;
      page-break-inside: avoid;
    }
    
    .signature-box {
      margin-top: 30px;
      margin-bottom: 20px;
    }
    
    .signature-line {
      border-bottom: 2px solid #1a1a1a;
      width: 300px;
      margin-bottom: 8px;
      padding-bottom: 5px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #6B6B6B;
      margin-top: 5px;
    }
    
    .footer {
      position: fixed;
      bottom: 20px;
      left: 30px;
      right: 30px;
      text-align: center;
      font-size: 8px;
      color: #6B6B6B;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
    }
    
    .notice {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin-top: 20px;
      border-radius: 4px;
      font-size: 10px;
      color: #856404;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    table th,
    table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
      font-size: 10px;
    }
    
    table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #4A4A4A;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Carrier Required Forms</h1>
    <div class="subtitle">${data.carrierName} - ${data.programName}</div>
  </div>
  
  <div class="form-info">
    <div class="form-info-item">
      <div class="form-info-label">Application ID</div>
      <div class="form-info-value">${data.submissionId.substring(0, 8).toUpperCase()}</div>
    </div>
    <div class="form-info-item">
      <div class="form-info-label">Date</div>
      <div class="form-info-value">${data.formDate}</div>
    </div>
    <div class="form-info-item">
      <div class="form-info-label">Carrier</div>
      <div class="form-info-value">${data.carrierName}</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-header">Applicant Information</div>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Company Name</div>
          <div class="info-value">${data.companyName}</div>
        </div>
        ${data.dba ? `
        <div class="info-item">
          <div class="info-label">DBA</div>
          <div class="info-value">${data.dba}</div>
        </div>
        ` : ''}
        <div class="info-item">
          <div class="info-label">Entity Type</div>
          <div class="info-value">${data.entityType}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Company FEIN</div>
          <div class="info-value">${data.companyFEIN}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Contact Name</div>
          <div class="info-value">${data.firstName} ${data.lastName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${data.phone}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${data.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Business Address</div>
          <div class="info-value">${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}</div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-header">Business Information</div>
    <div class="section-content">
      <div class="form-field">
        <div class="form-field-label">Estimated Gross Receipts</div>
        <div class="form-field-input">${estimatedGrossReceipts}</div>
      </div>
      <div class="form-field">
        <div class="form-field-label">Years in Business</div>
        <div class="form-field-input">${yearsInBusiness}</div>
      </div>
      ${Object.keys(classCodes).length > 0 ? `
      <div class="form-field">
        <div class="form-field-label">Class Codes & Work Distribution</div>
        <table>
          <thead>
            <tr>
              <th>Class Code</th>
              <th>Description</th>
              <th>% of Work</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(classCodes).map(([code, percent]) => `
            <tr>
              <td>${code}</td>
              <td>Class Code Description</td>
              <td>${percent}%</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      ${statesOfOperation.length > 0 ? `
      <div class="form-field">
        <div class="form-field-label">States of Operation</div>
        <div class="form-field-input">${statesOfOperation.join(', ')}</div>
      </div>
      ` : ''}
    </div>
  </div>
  
  <div class="section">
    <div class="section-header">Required Forms Checklist</div>
    <div class="section-content">
      <ul class="checkbox-list">
        <li>Application Form (Completed)</li>
        <li>Risk Assessment Questionnaire</li>
        <li>Underwriting Information Form</li>
        <li>Loss History Statement</li>
        <li>Additional Documentation (if required)</li>
      </ul>
    </div>
  </div>
  
  <div class="section">
    <div class="section-header">Certification & Authorization</div>
    <div class="section-content">
      <p style="font-size: 11px; color: #4A4A4A; margin-bottom: 15px;">
        I certify that the information provided in this application is true and accurate to the best of my knowledge. I understand that any misrepresentation or omission may result in denial of coverage or cancellation of the policy.
      </p>
      <p style="font-size: 11px; color: #4A4A4A; margin-bottom: 15px;">
        I authorize the carrier and its representatives to obtain any additional information necessary for underwriting purposes, including but not limited to credit reports, loss history, and business records.
      </p>
    </div>
  </div>
  
  <div class="signature-section">
    <div class="section-header">Signature</div>
    <div class="section-content">
      <p style="font-size: 11px; color: #4A4A4A; margin-bottom: 20px;">
        By signing below, I acknowledge that I have reviewed all information provided and certify its accuracy:
      </p>
      
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Applicant Signature</div>
      </div>
      
      <div style="margin-top: 20px;">
        <div class="signature-line" style="width: 200px;"></div>
        <div class="signature-label">Date</div>
      </div>
      
      <div style="margin-top: 20px;">
        <div class="signature-line" style="width: 200px;"></div>
        <div class="signature-label">Print Name</div>
      </div>
      
      <div style="margin-top: 20px;">
        <div class="signature-line" style="width: 200px;"></div>
        <div class="signature-label">Title</div>
      </div>
    </div>
  </div>
  
  <div class="notice">
    <strong>Important:</strong> Please complete all required forms and return them to your agency. Incomplete forms may delay the underwriting process.
  </div>
  
  <div class="footer">
    <p>This form is generated by Sterling Wholesale Insurance Portal</p>
    <p>© ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

