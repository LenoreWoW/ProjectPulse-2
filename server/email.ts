import nodemailer from 'nodemailer';

// Create a test SMTP transporter for development purposes
// In a production environment, you should use a real SMTP server
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email', // Default to ethereal for testing
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'test@example.com', // Default test credentials
    pass: process.env.SMTP_PASSWORD || 'testpassword',
  },
});

// For development, create a test account with ethereal.email if no SMTP credentials provided
if (!process.env.SMTP_HOST) {
  console.log('No SMTP configuration found. Setting up Ethereal test account...');
  nodemailer.createTestAccount().then(testAccount => {
    console.log('Created Ethereal test account for email testing:');
    console.log(`- Username: ${testAccount.user}`);
    console.log(`- Password: ${testAccount.pass}`);
    console.log(`- SMTP Host: ${testAccount.smtp.host}`);
    console.log(`- SMTP Port: ${testAccount.smtp.port}`);
    
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }).catch(err => {
    console.error('Failed to create test account:', err);
  });
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using Nodemailer
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const msg = {
      from: process.env.SMTP_FROM || 'no-reply@qaf.mil.qa', // System email address
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    };

    const info = await transporter.sendMail(msg);
    console.log(`Email sent to: ${params.to}`);
    
    // If using ethereal, log the preview URL
    if (info.messageId && info.preview) {
      console.log(`Email preview: ${info.preview}`);
    }
    
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

/**
 * Send registration acceptance email
 */
export async function sendRegistrationAcceptedEmail(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Registration Accepted - Qatar Armed Forces Project Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #8A1538; border-radius: 5px;">
        <div style="background-color: #8A1538; padding: 15px; text-align: center; color: white; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">Registration Accepted</h2>
        </div>
        <div style="padding: 20px;">
          <p>Your registration has been accepted. You can now log in to the Qatar Armed Forces Project Management System.</p>
          <p>Thank you for joining our platform.</p>
          <p>Regards,<br>Qatar Armed Forces PMO Team</p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    `
  });
}

/**
 * Send registration rejection email
 */
export async function sendRegistrationRejectedEmail(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Registration Rejected - Qatar Armed Forces Project Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #8A1538; border-radius: 5px;">
        <div style="background-color: #8A1538; padding: 15px; text-align: center; color: white; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">Registration Rejected</h2>
        </div>
        <div style="padding: 20px;">
          <p>We regret to inform you that your registration has been rejected.</p>
          <p>For assistance, please contact the system administrator.</p>
          <p>Regards,<br>Qatar Armed Forces PMO Team</p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    `
  });
}