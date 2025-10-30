import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET user permissions
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Get user permissions
    const permissions = await query(
      `SELECT menu_key, has_access 
       FROM user_permissions 
       WHERE user_id = ?`,
      [id]
    );

    // Convert to object format { menu_key: true/false }
    const permissionsObj = {};
    permissions.forEach(perm => {
      permissionsObj[perm.menu_key] = Boolean(perm.has_access);
    });

    return NextResponse.json(permissionsObj);
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data permission" },
      { status: 500 }
    );
  }
}

// PUT update user permissions
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const permissions = await request.json();

    // Delete existing permissions for this user
    await query(
      `DELETE FROM user_permissions WHERE user_id = ?`,
      [id]
    );

    // Insert new permissions
    if (permissions && Object.keys(permissions).length > 0) {
      const values = Object.entries(permissions).map(([menu_key, has_access]) => {
        return [id, menu_key, has_access ? 1 : 0];
      });

      if (values.length > 0) {
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();
        
        await query(
          `INSERT INTO user_permissions (user_id, menu_key, has_access) 
           VALUES ${placeholders}`,
          flatValues
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Permission berhasil diperbarui" 
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui permission" },
      { status: 500 }
    );
  }
}

