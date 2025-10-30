import { NextResponse } from "next/server";
import { query, rawQuery } from "@/lib/db";
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
    
    const user = users[0];

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
    
    console.log('[Users API] PUT request for user ID:', params.id);
    console.log('[Users API] Request body:', JSON.stringify(body, null, 2));
    
    // Trim and validate required fields
    const name = body.name?.trim();
    const email = body.email?.trim();
    
    if (!name || !email) {
      console.error('[Users API] Validation failed:', { name: !!name, email: !!email });
      return NextResponse.json(
        { error: `Nama dan email wajib diisi. ${!name ? 'Nama kosong. ' : ''}${!email ? 'Email kosong.' : ''}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [existingUser] = await query(
      "SELECT id FROM users WHERE id = ?",
      [params.id]
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if email is already used by another user
    const [emailCheck] = await query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, params.id]
    );

    if (emailCheck) {
      return NextResponse.json(
        { error: "Email sudah digunakan oleh user lain" },
        { status: 400 }
      );
    }

    // Update user - ensure role is lowercase to match database ENUM
    const role = body.role ? body.role.toLowerCase() : 'staff';
    const isActive = body.is_active !== undefined ? body.is_active : true;
    
    // Build update query
    let updateQuery = "UPDATE users SET name = ?, email = ?, role = ?, clinic_id = ?, is_active = ?, updated_at = NOW()";
    let queryParams = [name, email, role, body.clinic_id || null, isActive];
    
    // Only update password if provided
    if (body.password && body.password.trim()) {
      const hashedPassword = await bcrypt.hash(body.password.trim(), 10);
      updateQuery += ", password = ?";
      queryParams.push(hashedPassword);
    }
    
    updateQuery += " WHERE id = ?";
    queryParams.push(params.id);
    
    const result = await query(updateQuery, queryParams);

    console.log('[Users API] Update result:', result);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Gagal mengupdate user" },
        { status: 500 }
      );
    }

    // Get updated user data
    const [updatedUser] = await query(
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

    return NextResponse.json({
      success: true,
      message: "User berhasil diupdate",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[Users API] Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengupdate user" },
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
