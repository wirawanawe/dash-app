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
    
    console.log("🔍 PUT /api/users/" + params.id + " - Request body:", JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.name || !body.email) {
      console.log("❌ Validation failed - Missing required fields:", {
        hasName: !!body.name,
        hasEmail: !!body.email
      });
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists for other users
    const existingUser = await query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [body.email, params.id]
    );

    if (existingUser.length > 0) {
      console.log("❌ Validation failed - Email already exists for another user:", {
        email: body.email,
        existingUserId: existingUser[0].id
      });
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed - Updating user");

    // Prepare update fields
    let updateFields = ['name = ?', 'email = ?', 'role = ?', 'clinic_id = ?', 'is_active = ?', 'updated_at = NOW()'];
    let updateValues = [body.name, body.email, body.role ? body.role.toLowerCase() : 'staff', body.clinic_id || null, body.is_active !== undefined ? body.is_active : true];

    // Add password update if provided
    if (body.password && body.password.trim()) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    updateValues.push(params.id);

    // Update user - convert role to lowercase to match database schema
    const result = await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues.map((value, index) => {
        // Convert role to lowercase if it's the role field
        if (updateFields[index] === 'role = ?') {
          return value ? value.toLowerCase() : value;
        }
        return value;
      })
    );

    if (result.affectedRows === 0) {
      console.log("❌ User not found with ID:", params.id);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("✅ User updated successfully");

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
    console.error("❌ Error updating user:", error);
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
    const existingUsers = await query(
      `SELECT id FROM users WHERE id = ?`,
      [params.id]
    );
    
    const existingUser = existingUsers[0];

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // In a real app, you'd check if the current user can delete this user
    // For now, we'll allow deletion

    await query(`DELETE FROM users WHERE id = ?`, [params.id]);

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
