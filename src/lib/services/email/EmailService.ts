import nodemailer from "nodemailer";

/**
 * Email Service
 * Handles sending emails for quotes, notifications, etc.
 * 
 * In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Postmark
 * - Resend
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
}

interface QuoteEmailData {
  recipientName: string;
  recipientEmail: string;
  companyName: string;
  quoteNumber: string;
  premium: number;
  effectiveDate: string;
  expirationDate: string;
  programName: string;
  coverageLimits: string;
  quotePDFUrl: string;
}

/**
 * Send email using configured email service
 * This is a mock implementation - replace with actual email service
 */

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (process.env.EMAIL_ENABLED !== "true") {
      console.log("⚠️ EMAIL DISABLED — skipping real send");
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Sterling Portal" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    console.log("✅ REAL EMAIL SENT TO:", options.to);
    return true;
  } catch (error) {
    console.error("❌ EMAIL SEND FAILED:", error);
    return false;
  }
}

/**
 * Generate quote email HTML
 */
export function generateQuoteEmailHTML(data: QuoteEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Insurance Quote</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .premium-box {
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .premium-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .premium-amount {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .premium-period {
      font-size: 14px;
      opacity: 0.9;
    }
    .details-box {
      background: #f8f9fa;
      border-left: 4px solid #00BCD4;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
    }
    .detail-value {
      color: #333;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .info-box {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box-title {
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 10px;
    }
    .footer {
      background: #2F4156;
      color: white;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-link {
      color: #00BCD4;
      text-decoration: none;
      margin: 0 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Sterling Wholesale Insurance</div>
      <div class="subtitle">Professional Insurance Solutions</div>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${data.recipientName},</div>
      
      <div class="message">
        Thank you for choosing Sterling Wholesale Insurance! We're pleased to provide you with your 
        <strong>${data.programName}</strong> insurance quote for <strong>${data.companyName}</strong>.
      </div>
      
      <div class="premium-box">
        <div class="premium-label">Your Quoted Premium</div>
        <div class="premium-amount">$${data.premium.toLocaleString()}</div>
        <div class="premium-period">per year</div>
      </div>
      
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Quote Number:</span>
          <span class="detail-value">${data.quoteNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Coverage Limits:</span>
          <span class="detail-value">${data.coverageLimits}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Effective Date:</span>
          <span class="detail-value">${new Date(data.effectiveDate).toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Quote Valid Until:</span>
          <span class="detail-value">${new Date(data.expirationDate).toLocaleDateString()}</span>
        </div>
      </div>
      
      <center>
        <a href="${data.quotePDFUrl}" class="cta-button">
          📄 Download Full Quote (PDF)
        </a>
      </center>
      
      <div class="info-box">
        <div class="info-box-title">📋 Next Steps</div>
        <ol style="margin: 10px 0 0 20px; color: #666;">
          <li>Review your quote details carefully</li>
          <li>Download and save the PDF for your records</li>
          <li>Contact us if you have any questions</li>
          <li>Ready to proceed? Click below to bind your policy</li>
        </ol>
      </div>
      
      <div class="message">
        This quote is valid for 90 days from the date of issue. Premium and coverage are subject to 
        carrier approval and underwriting review. If you have any questions or would like to proceed 
        with binding this policy, please don't hesitate to reach out.
      </div>
      
      <div class="message">
        <strong>Questions?</strong><br>
        Email: <a href="mailto:quotes@sterlingwholesale.com" style="color: #00BCD4;">quotes@sterlingwholesale.com</a><br>
        Phone: <a href="tel:+15551234567" style="color: #00BCD4;">(555) 123-4567</a>
      </div>
      
      <div class="message" style="color: #999; font-size: 14px;">
        Best regards,<br>
        <strong>Sterling Wholesale Insurance Team</strong>
      </div>
    </div>
    
    <div class="footer">
      <div>© ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved.</div>
      <div class="footer-links">
        <a href="#" class="footer-link">Privacy Policy</a> | 
        <a href="#" class="footer-link">Terms of Service</a> | 
        <a href="#" class="footer-link">Contact Us</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version of quote email
 */
export function generateQuoteEmailText(data: QuoteEmailData): string {
  return `
Hi ${data.recipientName},

Thank you for choosing Sterling Wholesale Insurance! We're pleased to provide you with your ${data.programName} insurance quote for ${data.companyName}.

YOUR QUOTED PREMIUM: $${data.premium.toLocaleString()} per year

QUOTE DETAILS:
- Quote Number: ${data.quoteNumber}
- Coverage Limits: ${data.coverageLimits}
- Effective Date: ${new Date(data.effectiveDate).toLocaleDateString()}
- Quote Valid Until: ${new Date(data.expirationDate).toLocaleDateString()}

NEXT STEPS:
1. Review your quote details carefully
2. Download and save the PDF for your records
3. Contact us if you have any questions
4. Ready to proceed? Contact us to bind your policy

Download your full quote: ${data.quotePDFUrl}

This quote is valid for 90 days from the date of issue. Premium and coverage are subject to carrier approval and underwriting review.

Questions?
Email: quotes@sterlingwholesale.com
Phone: (555) 123-4567

Best regards,
Sterling Wholesale Insurance Team

© ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved.
  `.trim();
}

/**
 * Send quote email to client
 */
export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  const html = generateQuoteEmailHTML(data);
  const text = generateQuoteEmailText(data);

  return await sendEmail({
    to: data.recipientEmail,
    subject: `Your Insurance Quote ${data.quoteNumber} - $${data.premium.toLocaleString()}/year`,
    html,
    text,
  });
}

/**
 * Application Email Data
 */
interface ApplicationEmailData {
  carrierEmail: string;
  agencyName: string;
  companyName: string;
  programName: string;
  submittedDate: string;
  applicantEmail: string;
  applicantPhone: string;
  pdfBuffer?: Buffer;
}

/**
 * Generate carrier application email HTML
 */
export function generateCarrierApplicationEmailHTML(data: ApplicationEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application Submission</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #333;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #00BCD4;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      width: 150px;
    }
    .info-value {
      color: #333;
      flex: 1;
    }
    .cta-button {
      display: inline-block;
      background-color: #00BCD4;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .attachment-notice {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 5px;
      padding: 15px;
      margin: 20px 0;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Application Submission</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear Carrier Team,
      </div>
      
      <p>A new insurance application has been submitted through Sterling Wholesale Insurance and requires your review and quote.</p>
      
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Program:</div>
          <div class="info-value"><strong>${data.programName}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Applicant:</div>
          <div class="info-value">${data.companyName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Submitted By:</div>
          <div class="info-value">${data.agencyName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Submission Date:</div>
          <div class="info-value">${data.submittedDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Applicant Email:</div>
          <div class="info-value">${data.applicantEmail}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Applicant Phone:</div>
          <div class="info-value">${data.applicantPhone}</div>
        </div>
      </div>
      
      <div class="attachment-notice">
        📎 <strong>Application PDF Attached</strong><br/>
        Please review the attached comprehensive application document for full details.
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Review the attached application PDF</li>
        <li>Assess risk and prepare your quote</li>
        <li>Send your quote details to the Sterling admin team</li>
        <li>Sterling will enter the quote into the system and notify the broker</li>
      </ol>
      
      <p>If you have any questions or need additional information, please contact Sterling Wholesale Insurance or reach out to the submitting agency directly.</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br/>
        <strong>Sterling Wholesale Insurance</strong><br/>
        Automated Application System
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Sterling Wholesale Insurance portal.</p>
      <p>© ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send application to carrier
 */
export async function sendApplicationToCarrier(data: ApplicationEmailData): Promise<boolean> {
  const html = generateCarrierApplicationEmailHTML(data);

  const emailOptions: EmailOptions = {
    to: data.carrierEmail,
    subject: `New Application: ${data.companyName} - ${data.programName}`,
    html,
    text: `New application submitted for ${data.companyName}. Program: ${data.programName}. Please review the attached PDF.`,
  };

  // Add PDF attachment if provided
  if (data.pdfBuffer) {
    emailOptions.attachments = [
      {
        filename: `Application-${data.companyName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        content: data.pdfBuffer,
      },
    ];
  }

  return await sendEmail(emailOptions);
}

/**
 * Broker Quote Email Data
 */
interface BrokerQuoteEmailData {
  brokerEmail: string;
  brokerName: string;
  companyName: string;
  quoteNumber: string;
  finalAmount: number;
  effectiveDate: string;
  expirationDate: string;
  carrierName: string;
  programName: string;
  pdfBuffer?: Buffer;
  binderPdfUrl?: string;
}

/**
 * Generate broker quote email HTML
 */
export function generateBrokerQuoteEmailHTML(data: BrokerQuoteEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Ready</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #333;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #00BCD4;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      width: 150px;
    }
    .info-value {
      color: #333;
      flex: 1;
    }
    .cta-button {
      display: inline-block;
      background-color: #00BCD4;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .attachment-notice {
      background-color: #d1ecf1;
      border: 1px solid #00BCD4;
      border-radius: 5px;
      padding: 15px;
      margin: 20px 0;
      color: #0c5460;
    }
    .premium-highlight {
      background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%);
      color: white;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
      margin: 20px 0;
    }
    .premium-highlight .amount {
      font-size: 36px;
      font-weight: 700;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Quote Ready for Review</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear ${data.brokerName},
      </div>
      
      <p>Great news! A quote has been prepared for your client and is ready for review.</p>
      
      <div class="premium-highlight">
        <div style="font-size: 14px; opacity: 0.9;">Total Premium</div>
        <div class="amount">$${data.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Quote Number:</div>
          <div class="info-value"><strong>${data.quoteNumber}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Client:</div>
          <div class="info-value">${data.companyName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Program:</div>
          <div class="info-value">${data.programName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Carrier:</div>
          <div class="info-value">${data.carrierName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Effective Date:</div>
          <div class="info-value">${data.effectiveDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Expiration Date:</div>
          <div class="info-value">${data.expirationDate}</div>
        </div>
      </div>
      
      <div class="attachment-notice">
        📎 <strong>Binder PDF Available</strong><br/>
        ${data.binderPdfUrl ? 
          `You can download the binder from your portal dashboard.` : 
          `The binder PDF will be available in your portal dashboard.`
        }
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Review the quote details in your Sterling portal</li>
        <li>Download the binder PDF</li>
        <li>Present the quote to your client</li>
        <li>Accept or request changes through the portal</li>
      </ol>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/agency/dashboard" class="cta-button">
          View Quote in Portal
        </a>
      </div>
      
      <p>If you have any questions or need to request changes, please contact Sterling Wholesale Insurance.</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br/>
        <strong>Sterling Wholesale Insurance</strong><br/>
        Quote Management System
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Sterling Wholesale Insurance portal.</p>
      <p>© ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send quote to broker
 */
export async function sendQuoteToBroker(data: BrokerQuoteEmailData): Promise<boolean> {
  const html = generateBrokerQuoteEmailHTML(data);

  const emailOptions: EmailOptions = {
    to: data.brokerEmail,
    subject: `Quote Ready: ${data.companyName} - $${data.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    html,
    text: `Quote ready for ${data.companyName}. Total Premium: $${data.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Please review in your portal.`,
  };

  // Add PDF attachment if provided
  if (data.pdfBuffer) {
    emailOptions.attachments = [
      {
        filename: `Binder-${data.companyName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        content: data.pdfBuffer,
      },
    ];
  }

  return await sendEmail(emailOptions);
}

/**
 * Bind Request Email Data
 */
export interface BindRequestEmailData {
  carrierEmail: string;
  carrierName: string;
  clientName: string;
  clientEmail: string;
  agencyName: string;
  quoteNumber: string;
  effectiveDate?: string;
  finalAmount: number;
  programName?: string;
  submissionId: string;
  signedProposalUrl?: string;
  signedCarrierFormsUrl?: string;
  applicationPdfUrl?: string;
}

/**
 * Generate bind request email HTML
 */
export function generateBindRequestEmailHTML(data: BindRequestEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bind Request</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #13627b 0%, #00BCD4 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .info-section {
      background-color: #f8f9fa;
      border-left: 4px solid #00BCD4;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #333;
    }
    .info-value {
      color: #666;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Bind Request</h1>
    </div>
    <div class="content">
      <p>Dear ${data.carrierName} Underwriter,</p>
      
      <p>A bind request has been submitted for the following policy:</p>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Client Name:</span>
          <span class="info-value">${data.clientName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Client Email:</span>
          <span class="info-value">${data.clientEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Agency:</span>
          <span class="info-value">${data.agencyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Quote Number:</span>
          <span class="info-value">${data.quoteNumber}</span>
        </div>
        ${data.programName ? `
        <div class="info-row">
          <span class="info-label">Program:</span>
          <span class="info-value">${data.programName}</span>
        </div>
        ` : ''}
        ${data.effectiveDate ? `
        <div class="info-row">
          <span class="info-label">Effective Date:</span>
          <span class="info-value">${data.effectiveDate}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Total Premium:</span>
          <span class="info-value">$${data.finalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <p><strong>All required documents have been signed and payment has been received.</strong></p>
      
      <p>Please find the signed documents attached to this email:</p>
      <ul>
        ${data.signedProposalUrl ? '<li>Signed Proposal PDF</li>' : ''}
        ${data.signedCarrierFormsUrl ? '<li>Signed Carrier Forms PDF</li>' : ''}
        ${data.applicationPdfUrl ? '<li>Application PDF</li>' : ''}
      </ul>
      
      <p>Please review and process this bind request at your earliest convenience.</p>
      
      <p>Best regards,<br>Sterling Wholesale Insurance</p>
    </div>
    <div class="footer">
      <p>This is an automated email from Sterling Wholesale Insurance Portal.</p>
      <p>Submission ID: ${data.submissionId}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send bind request email to carrier underwriter
 */
export async function sendBindRequestToCarrier(data: BindRequestEmailData): Promise<boolean> {
  const html = generateBindRequestEmailHTML(data);

  const emailOptions: EmailOptions = {
    to: data.carrierEmail,
    subject: `Bind Request - ${data.clientName} - ${data.programName || 'Insurance Policy'}`,
    html,
    text: `Bind request submitted for ${data.clientName}. Quote Number: ${data.quoteNumber}. Total Premium: $${data.finalAmount.toFixed(2)}. All documents signed and payment received.`,
  };

  // Note: In production, you would fetch the PDFs from URLs and attach them
  // For now, we're just logging that attachments would be included
  console.log("📧 [BIND EMAIL] Attachments would include:");
  if (data.signedProposalUrl) {
    console.log(`   - Signed Proposal: ${data.signedProposalUrl}`);
  }
  if (data.signedCarrierFormsUrl) {
    console.log(`   - Signed Carrier Forms: ${data.signedCarrierFormsUrl}`);
  }
  if (data.applicationPdfUrl) {
    console.log(`   - Application PDF: ${data.applicationPdfUrl}`);
  }

  return await sendEmail(emailOptions);
}