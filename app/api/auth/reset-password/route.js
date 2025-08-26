import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // Validate input
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Token, password, dan konfirmasi password harus diisi",
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

    // Find user with valid reset token
    const [user] = await query(
      "SELECT id, email, reset_token, reset_token_expiry FROM users WHERE reset_token = ?",
      [token]
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Token reset password tidak valid",
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > new Date(user.reset_token_expiry)) {
      // Clear expired token
      await query(
        "UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
        [user.id]
      );

      return NextResponse.json(
        {
          success: false,
          message: "Token reset password telah kadaluarsa. Silakan request reset password baru.",
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = ?",
      [hashedPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru Anda.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
