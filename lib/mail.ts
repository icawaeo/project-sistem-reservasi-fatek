import nodemailer from "nodemailer";

type SendPasswordSetupMailInput = {
  to: string;
  userName: string;
  setupUrl: string;
  expiresInHours: number;
};

type SendEmailChangeVerificationMailInput = {
	to: string;
	userName: string;
	verificationUrl: string;
	expiresInHours: number;
};

const parsePort = (value: string | undefined) => {
  const port = Number(value);

  if (Number.isNaN(port) || port <= 0) {
    return null;
  }

  return port;
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parsePort(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export const sendPasswordSetupMail = async ({ to, userName, setupUrl, expiresInHours }: SendPasswordSetupMailInput) => {
  const transporter = createTransporter();
  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@localhost";

  if (!transporter) {
    console.warn("MAIL_DEBUG: SMTP belum dikonfigurasi. Gunakan setup URL manual:", setupUrl);
    return { delivered: false as const };
  }

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Atur Password Akun Reservasi Fakultas Teknik",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Halo ${userName},</h2>
        <p style="margin-top: 0;">Akun Anda telah dibuat oleh Superadmin. Silakan atur password melalui tombol berikut:</p>
        <p>
          <a href="${setupUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 700;">Atur Password</a>
        </p>
        <p>Link ini berlaku selama ${expiresInHours} jam dan hanya bisa dipakai satu kali.</p>
        <p>Jika tombol tidak bekerja, salin tautan ini ke browser Anda:</p>
        <p><a href="${setupUrl}">${setupUrl}</a></p>
      </div>
    `,
  });

  return { delivered: true as const };
};

export const sendEmailChangeVerificationMail = async ({
  to,
  userName,
  verificationUrl,
  expiresInHours,
}: SendEmailChangeVerificationMailInput) => {
  const transporter = createTransporter();
  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@localhost";

  if (!transporter) {
    console.warn("MAIL_DEBUG: SMTP belum dikonfigurasi. Gunakan URL verifikasi email manual:", verificationUrl);
    return { delivered: false as const };
  }

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Verifikasi Perubahan Email Akun Reservasi Fakultas Teknik",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Halo ${userName},</h2>
        <p style="margin-top: 0;">Kami menerima permintaan untuk mengubah email akun Anda. Silakan verifikasi email baru melalui tombol berikut:</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 700;">Verifikasi Email Baru</a>
        </p>
        <p>Link ini berlaku selama ${expiresInHours} jam dan hanya bisa dipakai satu kali.</p>
        <p>Jika tombol tidak bekerja, salin tautan ini ke browser Anda:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      </div>
    `,
  });

  return { delivered: true as const };
};

type SendRegistrationOtpMailInput = {
  to: string;
  userName: string;
  otpCode: string;
  expiresInMinutes: number;
};

export const sendRegistrationOtpMail = async ({
  to,
  userName,
  otpCode,
  expiresInMinutes,
}: SendRegistrationOtpMailInput) => {
  const transporter = createTransporter();
  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@localhost";

  if (!transporter) {
    console.warn("MAIL_DEBUG: SMTP belum dikonfigurasi. Kode OTP registrasi:", otpCode);
    return { delivered: false as const };
  }

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Kode Verifikasi Registrasi - Reservasi Fakultas Teknik",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Halo ${userName},</h2>
        <p style="margin-top: 0;">Gunakan kode berikut untuk menyelesaikan registrasi akun Anda pada sistem Reservasi Ruangan Fakultas Teknik UNSRAT:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; background: #f1f5f9; padding: 16px 32px; border-radius: 12px; border: 2px solid #e2e8f0; color: #0f172a;">${otpCode}</span>
        </div>
        <p>Kode ini berlaku selama <strong>${expiresInMinutes} menit</strong>. Jangan bagikan kode ini kepada siapapun.</p>
        <p style="color: #64748b; font-size: 13px;">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
      </div>
    `,
  });

  return { delivered: true as const };
};
