import nodemailer from "nodemailer";

interface SendHiredEmailParams {
  workerEmail: string;
  workerName: string;
  jobTitle: string;
  category: string;
  location: string;
  budgetOrRate?: string | number | null;
  recruiterName: string;
  recruiterBusiness?: string | null;
  recruiterPhone?: string | null;
  recruiterEmail: string;
}

export async function sendHiredEmail(params: SendHiredEmailParams): Promise<{
  success: boolean;
  simulated?: boolean;
  error?: string;
}> {
  const {
    workerEmail,
    workerName,
    jobTitle,
    category,
    location,
    budgetOrRate,
    recruiterName,
    recruiterBusiness,
    recruiterPhone,
    recruiterEmail,
  } = params;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const dashboardUrl = `${siteUrl}/dashboard`;

  const formattedRate = budgetOrRate ? `Rs. ${Number(budgetOrRate).toLocaleString()}` : "Agreed Rate";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; }
          .content { padding: 32px; }
          .badge { display: inline-block; background: #ffedd5; color: #c2410c; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; }
          .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .card-row:last-child { margin-bottom: 0; }
          .label { color: #64748b; font-weight: 600; }
          .value { color: #0f172a; font-weight: 700; text-align: right; }
          .btn { display: inline-block; background: #ea580c; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-align: center; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations, ${workerName}!</h1>
            <p>You have been officially hired on KamGhar</p>
          </div>
          <div class="content">
            <span class="badge">${category}</span>
            <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0f172a;">${jobTitle}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
              Great news! The client has accepted your application. You are now matched for this requirement. Please get in touch with the client to coordinate dates and equipment.
            </p>

            <div class="card">
              <div class="card-row">
                <span class="label">Client Name:</span>
                <span class="value">${recruiterName}${recruiterBusiness ? ` (${recruiterBusiness})` : ""}</span>
              </div>
              <div class="card-row">
                <span class="label">Job Location:</span>
                <span class="value">${location}, Nepal</span>
              </div>
              <div class="card-row">
                <span class="label">Agreed Compensation:</span>
                <span class="value" style="color: #16a34a;">${formattedRate}</span>
              </div>
              <div class="card-row">
                <span class="label">Client Email:</span>
                <span class="value"><a href="mailto:${recruiterEmail}" style="color: #ea580c; text-decoration: none;">${recruiterEmail}</a></span>
              </div>
              ${
                recruiterPhone
                  ? `<div class="card-row">
                      <span class="label">Client Phone:</span>
                      <span class="value"><a href="tel:${recruiterPhone}" style="color: #16a34a; text-decoration: none;">${recruiterPhone}</a></span>
                    </div>`
                  : ""
              }
            </div>

            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="btn">Go to Your Dashboard</a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; text-align: center; margin-top: 16px;">
              Tip: Keep all communications polite and professional. After job completion, remember to request a rating and review!
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} KamGhar Nepal • Connecting Skilled Workers With Opportunities.
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Congratulations ${workerName}!

You have been officially hired on KamGhar for the following job:
Job: ${jobTitle} (${category})
Location: ${location}, Nepal
Agreed Amount: ${formattedRate}

Client Details:
Name: ${recruiterName}${recruiterBusiness ? ` (${recruiterBusiness})` : ""}
Email: ${recruiterEmail}
${recruiterPhone ? `Phone: ${recruiterPhone}\n` : ""}

View your dashboard: ${dashboardUrl}
  `.trim();

  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      await transporter.sendMail({
        from: `"KamGhar Nepal" <${gmailUser}>`,
        to: workerEmail,
        subject: `🎉 You are hired on KamGhar: ${jobTitle}`,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[KamGhar Mailer] Sent live hire notification email to ${workerEmail}`);
      return { success: true };
    } catch (err) {
      console.error("[KamGhar Mailer] Failed to send email via SMTP:", err);
      return { success: false, error: err instanceof Error ? err.message : "SMTP send failed" };
    }
  } else {
    // Graceful fallback with clear developer log
    console.log(`\n======================================================`);
    console.log(`[KamGhar Mailer] 📧 AUTO-MESSAGE DISPATCH SIMULATION`);
    console.log(`Recipient: ${workerEmail}`);
    console.log(`Subject: 🎉 You are hired on KamGhar: ${jobTitle}`);
    console.log(`Client: ${recruiterName} (${recruiterEmail})`);
    console.log(`Location: ${location}`);
    console.log(`Rate: ${formattedRate}`);
    console.log(`Note: To deliver live emails to actual Gmail inboxes, add`);
    console.log(`GMAIL_USER="your-email@gmail.com" and`);
    console.log(`GMAIL_APP_PASSWORD="your-google-app-password" to your .env file.`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }
}