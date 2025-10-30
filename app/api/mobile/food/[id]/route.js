import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET single food item by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const sql = `
      SELECT 
        id,
        name,
        name_indonesian,
        category,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        fiber_per_100g,
        sugar_per_100g,
        sodium_per_100g,
        serving_size,
        serving_weight,
        barcode,
        image_url,
        is_verified,
        source,
        created_at,
        updated_at
      FROM food_database 
      WHERE id = ?
    `;

    const foods = await query(sql, [id]);

    if (foods.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Data makanan tidak ditemukan" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: foods[0]
    });
  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil data makanan",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT - Update food item
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      name_indonesian,
      category,
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g,
      fiber_per_100g,
      sugar_per_100g,
      sodium_per_100g,
      serving_size,
      serving_weight,
      barcode,
      image_url,
      is_verified,
      source
    } = body;

    // Validate required fields
    if (!name || !category || calories_per_100g === undefined) {
      return NextResponse.json(
        { 
          success: false,
          message: "Name, category, dan calories per 100g wajib diisi" 
        },
        { status: 400 }
      );
    }

    // Check if food exists
    const existingFood = await query(
      'SELECT id FROM food_database WHERE id = ?',
      [id]
    );

    if (existingFood.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Data makanan tidak ditemukan" 
        },
        { status: 404 }
      );
    }

    const sql = `
      UPDATE food_database 
      SET 
        name = ?,
        name_indonesian = ?, 
        category = ?,
        calories_per_100g = ?,
        protein_per_100g = ?,
        carbs_per_100g = ?,
        fat_per_100g = ?,
        fiber_per_100g = ?,
        sugar_per_100g = ?,
        sodium_per_100g = ?,
        serving_size = ?,
        serving_weight = ?,
        barcode = ?,
        image_url = ?,
        is_verified = ?,
        source = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      name, name_indonesian, category, calories_per_100g, protein_per_100g,
      carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g,
      sodium_per_100g, serving_size, serving_weight, barcode, image_url,
      is_verified, source, id
    ];

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      message: "Data makanan berhasil diperbarui"
    });
  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        message: "Gagal memperbarui data makanan",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete food item
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if food exists and is not referenced by other tables
    const checkSql = `
      SELECT COUNT(*) as meal_count 
      FROM meal_logging 
      WHERE food_id = ?
    `;
    
    const [checkResult] = await query(checkSql, [id]);
    
    if (checkResult.meal_count > 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Tidak dapat menghapus makanan yang sudah digunakan dalam meal logging" 
        },
        { status: 400 }
      );
    }

    const sql = "DELETE FROM food_database WHERE id = ?";
    const result = await query(sql, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Data makanan tidak ditemukan" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data makanan berhasil dihapus"
    });
  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menghapus data makanan",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 