import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/auth";

// GET - Get user's quick foods
export async function GET(request) {
  try {
    // Get user from request using mobile authentication
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          message: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get user's quick foods with food details
    const quickFoods = await query(`
      SELECT 
        uqf.id,
        uqf.food_id,
        uqf.custom_portion_grams,
        uqf.custom_name,
        uqf.order_index,
        fd.name,
        fd.name_indonesian,
        fd.category,
        fd.calories_per_100g,
        fd.protein_per_100g,
        fd.carbs_per_100g,
        fd.fat_per_100g,
        fd.fiber_per_100g,
        fd.sugar_per_100g,
        fd.sodium_per_100g,
        fd.serving_size,
        fd.serving_weight,
        fd.image_url
      FROM user_quick_foods uqf
      JOIN food_database fd ON uqf.food_id = fd.id
      WHERE uqf.user_id = ?
      ORDER BY uqf.order_index ASC, uqf.created_at ASC
    `, [userId]);

    return NextResponse.json({
      success: true,
      data: quickFoods
    });
  } catch (error) {
    console.error("Error fetching quick foods:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil quick foods",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Add food to quick foods
export async function POST(request) {
  try {
    const user = await getMobileUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          message: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { food_id, custom_portion_grams, custom_name } = body;

    if (!food_id) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food ID is required" 
        },
        { status: 400 }
      );
    }

    // Check if food exists
    const foodCheck = await query("SELECT id FROM food_database WHERE id = ?", [food_id]);
    if (foodCheck.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food not found" 
        },
        { status: 404 }
      );
    }

    // Check if user already has this food in quick foods
    const existingQuickFood = await query(
      "SELECT id FROM user_quick_foods WHERE user_id = ? AND food_id = ?", 
      [userId, food_id]
    );

    if (existingQuickFood.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food already in quick foods" 
        },
        { status: 409 }
      );
    }

    // Check if user has reached maximum quick foods (12)
    const quickFoodCount = await query(
      "SELECT COUNT(*) as count FROM user_quick_foods WHERE user_id = ?", 
      [userId]
    );

    if (quickFoodCount[0].count >= 12) {
      return NextResponse.json(
        { 
          success: false,
          message: "Maximum 12 quick foods allowed" 
        },
        { status: 400 }
      );
    }

    // Get the next order index
    const maxOrderIndex = await query(
      "SELECT MAX(order_index) as max_order FROM user_quick_foods WHERE user_id = ?", 
      [userId]
    );
    const nextOrderIndex = (maxOrderIndex[0].max_order || 0) + 1;

    // Add to quick foods
    await query(`
      INSERT INTO user_quick_foods (user_id, food_id, custom_portion_grams, custom_name, order_index)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, food_id, custom_portion_grams || null, custom_name || null, nextOrderIndex]);

    return NextResponse.json({
      success: true,
      message: "Food added to quick foods",
      data: { food_id, custom_portion_grams, custom_name }
    });
    
  } catch (error) {
    console.error("Error adding to quick foods:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menambah ke quick foods",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 