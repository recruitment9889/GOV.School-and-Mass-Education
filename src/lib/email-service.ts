import nodemailer from "nodemailer";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Configure Gmail SMTP Transporter (Using Gmail App Password if set in .env)
const smtpTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "recruitment9889@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD || "", // Gmail App Password
  },
});

export async function sendApprovalEmail({
  recipientEmail,
  applicantName,
  applicationNo,
  categoryName,
}: {
  recipientEmail: string;
  applicantName: string;
  applicationNo: string;
  categoryName?: string;
}) {
  const senderEmail = "recruitment9889@gmail.com";
  const subject = `🎉 Congratulations! Your Application (${applicationNo}) Has Been APPROVED - Government of Odisha`;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; padding: 30px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: #1e3a8a; padding: 25px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Government of Odisha</h1>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #93c5fd; font-weight: 600;">School & Mass Education Department</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <div style="background-color: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
            <span style="font-size: 16px; font-weight: 800; color: #15803d; text-transform: uppercase; display: block;">🎉 APPLICATION APPROVED 🎉</span>
          </div>

          <p style="font-size: 15px; font-weight: 700; color: #0f172a;">Dear ${applicantName},</p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            We are pleased to inform you that your application for recruitment under the <strong>School & Mass Education Department, Government of Odisha</strong> has been <strong>ACCEPTED & APPROVED</strong> by the recruitment committee.
          </p>

          <!-- Details Box -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Application Number:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #1e3a8a; font-family: monospace; font-size: 14px;">${applicationNo}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Applied Position:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${categoryName || "Recruitment Post"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Verification Status:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #16a34a;">VERIFIED & APPROVED ✓</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Official Sender:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #334155;">${senderEmail}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="http://localhost:3000/dashboard" target="_blank" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 10px rgba(30,58,138,0.3);">
              View Approved Status & Download Dossier →
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 25px;">
            Please log into the portal to check further instructions and download your official approved candidate slip.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 15px; text-align: center; font-size: 11px; color: #64748b;">
          This is an official automated notification from Government of Odisha • School & Mass Education Department.<br/>
          Official Contact: <a href="mailto:${senderEmail}" style="color: #1e3a8a; text-decoration: none;">${senderEmail}</a>
        </div>
      </div>
    </div>
  `;

  try {
    if (resend) {
      await resend.emails.send({
        from: `Government of Odisha <recruitment9889@gmail.com>`,
        to: [recipientEmail],
        subject,
        html: htmlContent,
      });
      console.log(`[Email Service] Sent approval email via Resend to ${recipientEmail}`);
      return { success: true };
    }

    if (process.env.GMAIL_APP_PASSWORD) {
      await smtpTransporter.sendMail({
        from: `"Government of Odisha Recruitment" <${senderEmail}>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[Email Service] Sent approval email via Gmail SMTP to ${recipientEmail}`);
      return { success: true };
    }

    console.log(`[Email Service] Simulated approval email to ${recipientEmail} from ${senderEmail}`);
    return { success: true, simulated: true };
  } catch (error) {
    console.error("[Email Service Error]:", error);
    return { success: false, error };
  }
}
