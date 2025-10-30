import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET all foods with search functionality
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = Math.max(1, parseInt(searchParams.get("limit"), 10) || 20);
    const offset = Math.max(0, parseInt(searchParams.get("offset"), 10) || 0);

    let sql = `
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
      WHERE 1=1
    `;
    
    let params = [];

    // Add search filter
    if (search) {
      sql += " AND (name LIKE ? OR name_indonesian LIKE ? OR category LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add category filter
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    // Ensure limit and offset are valid integers
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 1 || offset < 0) {
      throw new Error(`Invalid pagination parameters: limit=${limit}, offset=${offset}`);
    }
    
    // Build LIMIT and OFFSET directly (safe because we validated they are integers)
    sql += ` ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`;

    const foods = await query(sql, params);

    // Get total count for pagination
    let countSql = "SELECT COUNT(*) as total FROM food_database WHERE 1=1";
    let countParams = [];
    
    if (search) {
      countSql += " AND (name LIKE ? OR name_indonesian LIKE ? OR category LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (category) {
      countSql += " AND category = ?";
      countParams.push(category);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: foods,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
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

// POST - Create new food item
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      name_indonesian,
      category,
      calories_per_100g,
      protein_per_100g = 0,
      carbs_per_100g = 0,
      fat_per_100g = 0,
      fiber_per_100g = 0,
      sugar_per_100g = 0,
      sodium_per_100g = 0,
      serving_size,
      serving_weight,
      barcode,
      image_url,
      is_verified = false,
      source = 'manual'
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

    const sql = `
      INSERT INTO food_database (
        name, name_indonesian, category, calories_per_100g, protein_per_100g,
        carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g,
        sodium_per_100g, serving_size, serving_weight, barcode, image_url,
        is_verified, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      name, name_indonesian, category, calories_per_100g, protein_per_100g,
      carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g,
      sodium_per_100g, serving_size, serving_weight, barcode, image_url,
      is_verified, source
    ];

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      message: "Data makanan berhasil ditambahkan",
      data: { id: result.insertId }
    }, { status: 201 });
    
  } catch (error) {

    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menambah data makanan",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 