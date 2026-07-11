import { Resend } from 'resend';

export interface TransactionalEmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailServiceImpl {
  private resend: Resend | null = null;
  private fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@examforge.com';
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      console.warn('RESEND_API_KEY is missing. Emails will be logged to console instead of sent.');
    }
  }

  async sendTransactionalEmail(options: TransactionalEmailOptions): Promise<void> {
    if (!this.resend) {
      console.log('--- EMAIL MOCK ---');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML: ${options.html}`);
      console.log('------------------');
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: `ExamForge <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Email sending failed: ${error.message}`);
      }
    } catch (err) {
      console.error('Failed to send email (exception):', err);
      throw err;
    }
  }
}

export const EmailService = new EmailServiceImpl();
