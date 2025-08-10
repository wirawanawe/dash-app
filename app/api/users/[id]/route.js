import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// Role hierarchy: Superadmin > Admin > Doctor > Staff
const roleHierarchy = {
  SUPERADMIN: 4,
  ADMIN: 3,
  DOCTOR: 2,
  STAFF: 1
};

const getUserRoleLevel = (role) => {
  return roleHierarchy[role?.toUpperCase()] || 0;
};

const canManageRole = (userRole, targetRole) => {
  const userLevel = getUserRoleLevel(userRole);
  const targetLevel = getUserRoleLevel(targetRole);
  return userLevel > targetLevel; // Can only manage roles below their own level
};

// GET single user
export async function GET(request, { params }) {
  try {
    const [user] = await query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.clinic_id,
        u.is_active,
        u.created_at, 
        u.updated_at,
        c.name as clinic_name
      FROM users u
      LEFT JOIN clinics c ON u.clinic_id = c.id
      WHERE u.id = ?`,
      [params.id]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Update user
    const result = await query(
      "UPDATE users SET name = ?, email = ?, role = ?, clinic_id = ?, updated_at = NOW() WHERE id = ?",
      [body.name, body.email, body.role, body.clinic_id, params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: params.id,
        name: body.name,
        email: body.email,
        role: body.role,
        clinic_id: body.clinic_id,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request, { params }) {
  try {
    // Check if user exists
    const [existingUser] = await query(
      "SELECT id FROM users WHERE id = ?",
      [params.id]
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // In a real app, you'd check if the current user can delete this user
    // For now, we'll allow deletion

    await query("DELETE FROM users WHERE id = ?", [params.id]);

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
