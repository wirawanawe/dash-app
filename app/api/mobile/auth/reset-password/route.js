import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { email, otp, password, confirmPassword } = await request.json();

    // Validate input
    if (!email || !otp || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, OTP, password, dan konfirmasi password harus diisi",
        },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Password dan konfirmasi password tidak cocok",
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password minimal 6 karakter",
        },
        { status: 400 }
      );
    }

    // Find user with valid OTP
    const [user] = await query(
      "SELECT id, email, reset_otp, reset_otp_expiry FROM mobile_users WHERE email = ? AND reset_otp = ?",
      [email, otp]
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email atau kode OTP tidak valid",
        },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.reset_otp_expiry)) {
      // Clear expired OTP
      await query(
        "UPDATE mobile_users SET reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?",
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear OTP
    await query(
      "UPDATE mobile_users SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL, updated_at = NOW() WHERE id = ?",
      [hashedPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru Anda.",
    });
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
