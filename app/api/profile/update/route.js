import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';


export async function PUT(request) {
  try {
    // Get token from cookies instead of authorization header
    const token = request.cookies.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token diperlukan" }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token.value, secretKey);

    const [user] = await query("SELECT * FROM users WHERE id = ?", [
      payload.userId,
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    // Validasi password lama jika ingin mengubah password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Password lama diperlukan untuk mengubah password" },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Password lama tidak valid" },
          { status: 400 }
        );
      }
    }

    // Hash password baru jika ada
    const hashedPassword = newPassword
      ? await bcrypt.hash(newPassword, 10)
      : undefined;

    // Update user in database
    let updateQuery = "UPDATE users SET name = ?, email = ?";
    let updateValues = [name || user.name, email || user.email];

    if (hashedPassword) {
      updateQuery += ", password = ?";
      updateValues.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    updateValues.push(payload.userId);

    await query(updateQuery, updateValues);

    // Get updated user data
    const [updatedUser] = await query(
      "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
      [payload.userId]
    );

    const userWithoutPassword = updatedUser;

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
