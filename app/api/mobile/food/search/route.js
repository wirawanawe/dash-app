import { NextResponse } from "next/server";
import { query, rawQuery } from "@/lib/db";

// Simple rate limiting for search API
const searchRequests = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean old requests
  if (searchRequests.has(ip)) {
    searchRequests.set(ip, searchRequests.get(ip).filter(time => time > windowStart));
  } else {
    searchRequests.set(ip, []);
  }
  
  const requests = searchRequests.get(ip);
  if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }
  
  requests.push(now);
  return true; // Allowed
}

// GET - Search foods
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query_param = searchParams.get("query") || "";
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "50", 10)); // Increased default from 20 to 50

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          success: false,
          message: "Terlalu banyak request pencarian. Silakan coba lagi dalam 1 menit.",
          error: "RATE_LIMIT_EXCEEDED"
        },
        { status: 429 }
      );
    }

    if (!query_param.trim()) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Only search if query has at least 2 characters to reduce unnecessary queries
    if (query_param.trim().length < 2) {
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