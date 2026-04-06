import nodemailer from 'nodemailer';

interface ICarrier {
  _id: string;
  name: string;
  email: string;
}

interface ISubmission {
  _id: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
  };
  state?: string;
}

interface IFormTemplate {
  industry: string;
  subtype: string;
  title: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const emailEnabled = process.env.EMAIL_ENABLED === 'true';
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailFrom = process.env.EMAIL_FROM || 'noreply@sterlingportal.com';

    // 🔍 DEBUG LOGS (TEMPORARY)
    console.log("EMAIL_ENABLED:", process.env.EMAIL_ENABLED);
    console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);

    if (!emailEnabled || !emailHost || !emailUser || !emailPass) {
      console.log('⚠️ Email not configured - using mock mode');
      return null;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort || '587'),
        secure: parseInt(emailPort || '587') === 465,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      console.log('✅ Email transporter initialized');
      return this.transporter;
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
      return null;
    }
  }

  /**
 * Universal raw email sender (used by all systems)
 */
  static async sendRawEmail({
    to,
    subject,
    html,
    text,
    attachments,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
    }>;
  }): Promise<boolean> {
    const transporter = this.getTransporter();
    const emailFrom = process.env.EMAIL_FROM || "noreply@sterlingportal.com";

    if (!transporter) {
      console.log("📧 MOCK MODE: Email not actually sent");
      console.log("📧 To:", to);
      console.log("📧 Subject:", subject);
      return true;
    }

    await transporter.sendMail({
      from: `"Sterling Portal" <${emailFrom}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });

    console.log("✅ Email SENT to:", to);
    return true;
  }

  /**
   * Send submission notification to carrier
   */
  static async sendSubmissionToCarrier(
    submission: ISubmission,
    carrier: ICarrier,
    template: IFormTemplate,
    submissionUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const transporter = this.getTransporter();
    const emailFrom = process.env.EMAIL_FROM || 'noreply@sterlingportal.com';

    // Email content
    const subject = `New Insurance Submission - ${submission.clientContact.name}`;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A4A4A; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .button { display: inline-block; padding: 12px 24px; background-color: #C4A882; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Insurance Submission</h1>
    </div>
    <div class="content">
      <p>Dear ${carrier.name},</p>
      
      <p>You have received a new insurance submission through Sterling Portal.</p>
      
      <h3>Submission Details:</h3>
      
      <div class="info-row">
        <span class="label">Submission ID:</span>
        <span class="value">${submission._id}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Industry:</span>
        <span class="value">${template.industry} - ${template.subtype}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Client Name:</span>
        <span class="value">${submission.clientContact.name}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Client Email:</span>
        <span class="value">${submission.clientContact.email}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Client Phone:</span>
        <span class="value">${submission.clientContact.phone}</span>
      </div>
      
      ${submission.state ? `
      <div class="info-row">
        <span class="label">State:</span>
        <span class="value">${submission.state}</span>
      </div>
      ` : ''}
      
      <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
        <strong>Next Steps:</strong><br>
        1. Review the submission details<br>
        2. Assess the risk<br>
        3. Prepare your quote<br>
        4. Send your quote to the agency via email or contact them directly
      </div>
      
      <p style="margin-top: 20px;">
        <strong>Important:</strong> Please review this submission and provide your quote as soon as possible.
      </p>
      
      <p>If you have any questions, please contact the agency directly at ${submission.clientContact.email}.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from Sterling Insurance Portal</p>
      <p>© ${new Date().getFullYear()} Sterling Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
New Insurance Submission

Dear ${carrier.name},

You have received a new insurance submission through Sterling Portal.

SUBMISSION DETAILS:
------------------
Submission ID: ${submission._id}
Industry: ${template.industry} - ${template.subtype}
Client Name: ${submission.clientContact.name}
Client Email: ${submission.clientContact.email}
Client Phone: ${submission.clientContact.phone}
${submission.state ? `State: ${submission.state}` : ''}

NEXT STEPS:
1. Review the submission details
2. Assess the risk
3. Prepare your quote
4. Send your quote to the agency via email

If you have any questions, please contact the agency directly at ${submission.clientContact.email}.

---
This is an automated message from Sterling Insurance Portal
© ${new Date().getFullYear()} Sterling Portal. All rights reserved.
    `;

    // If no transporter, use mock mode
    if (!transporter) {
      console.log('\n📧 ═══════════════════════════════════════════════════════════════');
      console.log('📧 MOCK EMAIL - Submission to Carrier');
      console.log('📧 ═══════════════════════════════════════════════════════════════');
      console.log(`📧 From: ${emailFrom}`);
      console.log(`📧 To: ${carrier.email} (${carrier.name})`);
      console.log(`📧 Subject: ${subject}`);
      console.log('📧 ───────────────────────────────────────────────────────────────');
      console.log('📧 Content:');
      console.log(textContent);
      console.log('📧 ═══════════════════════════════════════════════════════════════\n');

      return { success: true };
    }

    // Send actual email
    try {
      const info = await transporter.sendMail({
        from: `"Sterling Portal" <${emailFrom}>`,
        to: carrier.email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });

      console.log('✅ Email sent to carrier:', carrier.email);
      console.log('📧 Message ID:', info.messageId);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send email to carrier:', carrier.email);
      console.error('Error:', error.message);

      // Fallback to mock mode if sending fails
      console.log('\n📧 ═══════════════════════════════════════════════════════════════');
      console.log('📧 EMAIL FAILED - Falling back to MOCK mode');
      console.log('📧 ═══════════════════════════════════════════════════════════════');
      console.log(`📧 To: ${carrier.email} (${carrier.name})`);
      console.log(`📧 Subject: ${subject}`);
      console.log('📧 ═══════════════════════════════════════════════════════════════\n');

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send quote posted notification to agency
   */
  static async sendQuotePostedNotification(
    agencyEmail: string,
    agencyName: string,
    clientName: string,
    quoteId: string
  ): Promise<{ success: boolean; error?: string }> {
    const transporter = this.getTransporter();
    const emailFrom = process.env.EMAIL_FROM || 'noreply@sterlingportal.com';

    const subject = `Quote Ready for Review - ${clientName}`;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #C4A882; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .button { display: inline-block; padding: 12px 24px; background-color: #C4A882; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Quote Available for Review</h1>
    </div>
    <div class="content">
      <p>Dear ${agencyName},</p>
      
      <p>Good news! A quote is now available for your client <strong>${clientName}</strong>.</p>
      
      <p>The carrier has submitted their quote, and it's ready for your review and approval.</p>
      
      <p style="margin: 20px 0;">
        <strong>Quote ID:</strong> ${quoteId}
      </p>
      
      <p>Please log in to your dashboard to review and approve the quote.</p>
      
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/agency/quotes?status=POSTED" class="button">
        View Posted Quotes
      </a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Sterling Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    if (!transporter) {
      console.log('\n📧 ═══════════════════════════════════════════════════════════════');
      console.log('📧 MOCK EMAIL - Quote Posted Notification');
      console.log('📧 ═══════════════════════════════════════════════════════════════');
      console.log(`📧 To: ${agencyEmail} (${agencyName})`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📧 Quote ID: ${quoteId}`);
      console.log('📧 ═══════════════════════════════════════════════════════════════\n');

      return { success: true };
    }

    try {
      await transporter.sendMail({
        from: `"Sterling Portal" <${emailFrom}>`,
        to: agencyEmail,
        subject: subject,
        html: htmlContent,
      });

      console.log('✅ Quote notification sent to agency:', agencyEmail);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send quote notification:', error.message);
      return { success: false, error: error.message };
    }
  }
}




export default EmailService;



