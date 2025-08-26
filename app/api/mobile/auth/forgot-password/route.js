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

    // Check if mobile user exists
    const [user] = await query(
      "SELECT id, name, email FROM mobile_users WHERE email = ? AND is_active = 1",
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

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await query(
      "UPDATE mobile_users SET reset_otp = ?, reset_otp_expiry = ? WHERE id = ?",
      [otp, otpExpiry, user.id]
    );

    // Send email with OTP
    try {
      // Check if email configuration is available or if we're in development mode
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.NODE_ENV === 'development') {
        console.log("📧 Email configuration not available or in development mode, skipping email send");
        console.log("📧 OTP for development:", otp);
        
        return NextResponse.json({
          success: true,
          message: "Kode OTP telah dikirim ke email Anda. Silakan cek email dan masukkan kode OTP.",
          development_otp: otp, // Only include in development
        });
      }

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
        subject: "Kode OTP Reset Password - PHC Mobile",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E22345;">Reset Password PHC Mobile</h2>
            <p>Halo ${user.name},</p>
            <p>Anda telah meminta reset password untuk akun PHC Mobile Anda.</p>
            <p>Berikut adalah kode OTP Anda:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; display: inline-block;">
                <h1 style="color: #E22345; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              </div>
            </div>
            <p><strong>Kode OTP ini akan kadaluarsa dalam 10 menit.</strong></p>
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
        message: "Kode OTP telah dikirim ke email Anda. Silakan cek email dan masukkan kode OTP.",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      
      // Remove OTP if email fails
      await query(
        "UPDATE mobile_users SET reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?",
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
    console.error("Mobile forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
