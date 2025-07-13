import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

// Helper function to verify user is admin
async function verifyAdmin(request) {
  const token = request.cookies.get("token");
  if (!token) return false;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token.value, secretKey);
    return payload.role === "ADMIN";
  } catch (error) {
    return false;
  }
}

// GET user by id
export async function GET(request, { params }) {
  try {
    // Verify admin permissions
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = params.id;

    // Get user
    const [user] = await query(
      `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.created_at
      FROM users u
      WHERE u.id = ?
    `,
      [userId]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Format user
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      clinic: null, // No clinic info in current schema
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(request, { params }) {
  try {
    // Verify admin permissions
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = params.id;
    const { name, email, role, is_active, password } = await request.json();

    // Check if user exists
    const [existingUser] = await query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Start building the update query
    let updateQuery = `
      UPDATE users 
      SET name = ?, email = ?, role = ?, is_active = ?
    `;
    let updateValues = [name, email, role, is_active ? 1 : 0];

    // If password is provided, hash it and add to the update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = ?`;
      updateValues.push(hashedPassword);
    }

    // Add WHERE clause and execute the query
    updateQuery += ` WHERE id = ?`;
    updateValues.push(userId);

    await query(updateQuery, updateValues);

    // Get updated user
    const [updatedUser] = await query(
      `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.created_at
      FROM users u
      WHERE u.id = ?
    `,
      [userId]
    );

    // Format user
    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      is_active: updatedUser.is_active,
      created_at: updatedUser.created_at,
      clinic: null, // No clinic info in current schema
    };

    return NextResponse.json({
      message: "Pengguna berhasil diupdate",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate pengguna" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request, { params }) {
  try {
    // Verify admin permissions
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = params.id;

    // Check if user exists
    const [existingUser] = await query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete the user
    await query("DELETE FROM users WHERE id = ?", [userId]);

    return NextResponse.json({
      message: "Pengguna berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
