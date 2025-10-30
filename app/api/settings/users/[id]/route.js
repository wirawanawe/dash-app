import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET single user
export async function GET(request, { params }) {
  try {
    const [user] = await query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [parseInt(params.id)]
    );

    if (!user) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const userId = parseInt(params.id);

    // Build update query parts
    const updateFields = ["name = ?", "email = ?", "updated_at = NOW()"];
    const updateParams = [data.name, data.email];

    // Update password only if new password provided
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateFields.splice(-1, 0, "password = ?"); // Insert before updated_at
      updateParams.splice(-1, 0, hashedPassword); // Insert before userId
    }

    // Add userId for WHERE clause
    updateParams.push(userId);

    await query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams
    );

    // Get updated user (without password)
    const [updatedUser] = await query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [userId]
    );

    return NextResponse.json(updatedUser);
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal mengupdate pengguna" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request, { params }) {
  try {
    await query("DELETE FROM users WHERE id = ?", [parseInt(params.id)]);

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {

    return NextResponse.json(
      { message: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
