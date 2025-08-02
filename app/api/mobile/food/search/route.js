import { NextResponse } from "next/server";
import { query, rawQuery } from "@/lib/db";

// GET - Search foods
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query_param = searchParams.get("query") || "";
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));

    if (!query_param.trim()) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const searchTerm = `%${query_param}%`;
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
      WHERE (name LIKE '${searchTerm}' OR name_indonesian LIKE '${searchTerm}' OR category LIKE '${searchTerm}')
      ORDER BY name ASC
      LIMIT ${limit}
    `;
    

    
    const foods = await rawQuery(sql);

    return NextResponse.json({
      success: true,
      data: foods
    });
  } catch (error) {
    console.error("Error searching foods:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mencari makanan",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 