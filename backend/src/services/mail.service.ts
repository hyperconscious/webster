import * as nodemailer from 'nodemailer';
import config from '../config/env.config';
import verificationTemplate from '../templates/verificationTemplate';
import passwordResetTemplate from '../templates/passwordResetTemplate';

interface Attachment {
  filename: string;
  path: string;
  contentType?: string;
}

export class MailService {
  private transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: 465,
    secure: true,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  public async sendEmail(
    email: string,
    title: string,
    message: string,
  ) {

    const mailOptions = {
      from: '"UEvent"',
      to: email,
      subject: title,
      text: message
    };

    await this.transporter.sendMail(mailOptions);
  }

  public async sendEmailWithAttachment(
    email: string,
    title: string,
    htmlContent: string,
    attachments: Attachment[]
  ) {
    const mailOptions = {
      from: '"UEvent"',
      to: email,
      subject: title,
      html: htmlContent,
      attachments: attachments
    };

    await this.transporter.sendMail(mailOptions);
  }

  public async sendVerificationEmail(
    email: string,
    token: string,
    callbackUrl: string,
  ) {
    const verificationLink = `${callbackUrl}?token=${token}`;


    const mailOptions = {
      from: '"UEvent"',
      to: email,
      subject: 'Email Verification',
      text: `Please verify your email by clicking this link: ${verificationLink}`,
      html: verificationTemplate(verificationLink),
    };

    await this.transporter.sendMail(mailOptions);
  }

  public async sendPasswordResetEmail(
    email: string,
    token: string,
    callbackUrl: string,
  ) {
    const resetLink = `${callbackUrl}?token=${token}`;

    const mailOptions = {
      from: '"UEvent"',
      to: email,
      subject: 'Reset Password',
      text: `You can reset your password by folowing this link: ${resetLink}`,
      html: passwordResetTemplate(resetLink),
    };

    await this.transporter.sendMail(mailOptions);
  }
}
