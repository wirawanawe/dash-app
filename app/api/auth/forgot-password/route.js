import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email harus diisi",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const [user] = await query(
      "SELECT id, name, email FROM users WHERE email = ? AND is_active = 1",
      [email]
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email tidak terdaftar atau akun tidak aktif",
        },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [resetToken, resetTokenExpiry, user.id]
    );

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@phc.com",
        to: email,
        subject: "Reset Password - PHC Mobile",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E22345;">Reset Password PHC Mobile</h2>
            <p>Halo ${user.name},</p>
            <p>Anda telah meminta reset password untuk akun PHC Mobile Anda.</p>
            <p>Klik link di bawah ini untuk reset password Anda:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #E22345; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Link ini akan kadaluarsa dalam 1 jam.</p>
            <p>Jika Anda tidak meminta reset password ini, abaikan email ini.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Email ini dikirim otomatis, mohon tidak membalas email ini.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return NextResponse.json({
        success: true,
        message: "Email reset password telah dikirim. Silakan cek email Anda.",
      });
    } catch (emailError) {

      // Remove reset token if email fails
      await query(
        "UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
        [user.id]
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengirim email. Silakan coba lagi atau hubungi admin.",
        },
        { status: 500 }
      );
    }
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
