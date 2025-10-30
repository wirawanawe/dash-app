import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET food categories
export async function GET() {
  try {
    const sql = `
      SELECT DISTINCT category
      FROM food_database
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category ASC
    `;

    const categories = await query(sql);

    return NextResponse.json({
      success: true,
      data: categories.map(cat => cat.category)
    });
  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil kategori makanan",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 