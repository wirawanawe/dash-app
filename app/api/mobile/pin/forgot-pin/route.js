import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";
// WhatsApp service will be implemented later
// For now, we'll use console logging as fallback

// POST - Request PIN reset with WhatsApp OTP
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

    // Check if mobile user exists and has phone number
    const [user] = await query(
      "SELECT id, name, email, phone FROM mobile_users WHERE email = ? AND is_active = 1",
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

    if (!user.phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor telepon tidak terdaftar. Silakan hubungi admin untuk bantuan.",
        },
        { status: 400 }
      );
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await query(
      "UPDATE mobile_users SET pin_reset_otp = ?, pin_reset_otp_expiry = ? WHERE id = ?",
      [otp, otpExpiry, user.id]
    );

    // Send WhatsApp OTP
    try {
      // For now, just log the OTP in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Development: WhatsApp OTP would be sent to ${user.phone}: ${otp}`);
      }
      
      // TODO: Implement actual WhatsApp sending when service is ready
      console.log(`📱 WhatsApp OTP simulation: ${otp} sent to ${user.phone}`);

      return NextResponse.json({
        success: true,
        message: "Kode OTP telah dikirim ke WhatsApp Anda. Silakan cek WhatsApp dan masukkan kode OTP.",
        data: {
          email: user.email,
          phone: user.phone,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
        }
      });

    } catch (whatsappError) {
      console.error("WhatsApp sending error:", whatsappError);
      
      // Remove OTP if WhatsApp fails
      await query(
        "UPDATE mobile_users SET pin_reset_otp = NULL, pin_reset_otp_expiry = NULL WHERE id = ?",
        [user.id]
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengirim OTP ke WhatsApp. Silakan coba lagi atau hubungi admin.",
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Forgot PIN error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}

// POST - Verify PIN reset OTP and set new PIN
export async function PUT(request) {
  try {
    const { email, otp, newPin } = await request.json();

    // Validate input
    if (!email || !otp || !newPin) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, OTP, dan PIN baru harus diisi",
        },
        { status: 400 }
      );
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(newPin)) {
      return NextResponse.json(
        {
          success: false,
          message: "PIN harus 6 digit angka",
        },
        { status: 400 }
      );
    }

    // Find user with valid OTP
    const [user] = await query(
      "SELECT id, email, pin_reset_otp, pin_reset_otp_expiry FROM mobile_users WHERE email = ? AND is_active = 1",
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

    if (!user.pin_reset_otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada permintaan reset PIN yang aktif",
        },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (user.pin_reset_otp !== otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode OTP tidak valid",
        },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.pin_reset_otp_expiry)) {
      // Clear expired OTP
      await query(
        "UPDATE mobile_users SET pin_reset_otp = NULL, pin_reset_otp_expiry = NULL WHERE id = ?",
        [user.id]
      );

      return NextResponse.json(
        {
          success: false,
          message: "Kode OTP telah kadaluarsa. Silakan request kode OTP baru.",
        },
        { status: 400 }
      );
    }

    // Hash new PIN
    const bcrypt = require('bcryptjs');
    const hashedPin = await bcrypt.hash(newPin, 10);

    // Update PIN and clear OTP
    await query(
      `UPDATE mobile_users 
       SET pin_code = ?, 
           pin_enabled = TRUE,
           pin_attempts = 0,
           pin_locked_until = NULL,
           pin_reset_otp = NULL,
           pin_reset_otp_expiry = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [hashedPin, user.id]
    );

    return NextResponse.json({
      success: true,
      message: "PIN berhasil direset. Silakan login dengan PIN baru Anda.",
    });

  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
