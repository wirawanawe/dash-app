import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCachedCount, invalidateTableCache } from "@/lib/cache";

// GET all foods with search functionality
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = Math.max(1, parseInt(searchParams.get("limit"), 10) || 50); // Increased default from 20 to 50
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

    // Get total count for pagination using cached COUNT
    let whereClause = "WHERE 1=1";
    let countParams = [];
    
    if (search) {
      whereClause += " AND (name LIKE ? OR name_indonesian LIKE ? OR category LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (category) {
      whereClause += " AND category = ?";
      countParams.push(category);
    }

    const total = await getCachedCount('food_database', whereClause, countParams, query);

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
    console.error("Error fetching foods:", error);
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

// POST - Add new food
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { success: false, message: "Nama dan kategori makanan wajib diisi" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO food_database (
        name, name_indonesian, category, calories_per_100g, 
        protein_per_100g, carbs_per_100g, fat_per_100g, 
        fiber_per_100g, sugar_per_100g, sodium_per_100g,
        serving_size, serving_weight, barcode, image_url, 
        is_verified, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      body.name,
      body.name_indonesian || body.name,
      body.category,
      body.calories_per_100g || 0,
      body.protein_per_100g || 0,
      body.carbs_per_100g || 0,
      body.fat_per_100g || 0,
      body.fiber_per_100g || 0,
      body.sugar_per_100g || 0,
      body.sodium_per_100g || 0,
      body.serving_size || '',
      body.serving_weight || 0,
      body.barcode || '',
      body.image_url || '',
      body.is_verified || false,
      body.source || 'manual'
    ];

    const result = await query(sql, params);
    
    // Invalidate cache after adding new food
    invalidateTableCache('food_database');

    return NextResponse.json({
      success: true,
      message: "Makanan berhasil ditambahkan",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("Error adding food:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menambahkan makanan",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 