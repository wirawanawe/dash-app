import { NextResponse } from "next/server";
import { query, rawQuery } from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

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

// Function to get user from token
async function getUserFromToken(request) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookies
    const cookieToken = request.cookies.get("token");
    if (cookieToken) {
      token = cookieToken.value;
    }
  }
  
  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

// GET single user
export async function GET(request, { params }) {
  try {
    const users = await query(
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

    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(request, { params }) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);

    const body = await request.json();

    // Trim and validate required fields
    const name = body.name?.trim();
    const email = body.email?.trim();
    
    if (!name || !email) {

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

    // Check if user exists and get their current role
    const [existingUser] = await query(
      "SELECT id, role FROM users WHERE id = ?",
      [params.id]
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if current user is trying to edit a superadmin
    // Only superadmin can edit superadmin users
    if (existingUser.role?.toUpperCase() === 'SUPERADMIN') {
      if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
        return NextResponse.json(
          { error: "Hanya Superadmin yang dapat mengedit pengguna Superadmin" },
          { status: 403 }
        );
      }
    }

    // Check if trying to change role to SUPERADMIN
    // Only superadmin can set role to superadmin
    const newRole = body.role ? body.role.toUpperCase() : existingUser.role?.toUpperCase();
    if (newRole === 'SUPERADMIN') {
      if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
        return NextResponse.json(
          { error: "Hanya Superadmin yang dapat mengatur role Superadmin" },
          { status: 403 }
        );
      }
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

    return NextResponse.json(
      { error: error.message || "Gagal mengupdate user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request, { params }) {
  try {
    // Get user information from token
    const userPayload = await getUserFromToken(request);

    // Check if user exists and get their role
    const [existingUser] = await query(
      "SELECT id, role FROM users WHERE id = ?",
      [params.id]
    );

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Only superadmin can delete superadmin
    // All other roles are blocked from deleting superadmin
    if (existingUser.role?.toUpperCase() === 'SUPERADMIN') {
      if (!userPayload || userPayload.role?.toUpperCase() !== 'SUPERADMIN') {
        return NextResponse.json(
          { error: "Hanya Superadmin yang dapat menghapus pengguna Superadmin" },
          { status: 403 }
        );
      }
    }

    await query("DELETE FROM users WHERE id = ?", [params.id]);

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {

    return NextResponse.json(
      { error: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
