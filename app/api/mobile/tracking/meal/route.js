import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get meal tracking data
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");
    const date = searchParams.get("date");
    const meal_type = searchParams.get("meal_type"); // breakfast, lunch, dinner, snack
    const limit = searchParams.get("limit");
    const hours_ago = searchParams.get("hours_ago"); // Filter meals from last N hours

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        mt.id, mt.user_id, mt.meal_type, mt.recorded_at, mt.notes, mt.created_at
      FROM meal_tracking mt
      WHERE mt.user_id = ?
    `;
    let params = [user_id];

    if (date) {
      sql += " AND DATE(mt.recorded_at) = ?";
      params.push(date);
    }

    if (hours_ago) {
      const hours = parseInt(hours_ago);
      sql += " AND mt.recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)";
      params.push(hours);
    }

    if (meal_type) {
      sql += " AND mt.meal_type = ?";
      params.push(meal_type);
    }

    sql += " GROUP BY mt.id ORDER BY mt.recorded_at DESC";

    // Add LIMIT if specified
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }

    const mealData = await query(sql, params);

    // Get foods for each meal
    const parsedMealData = await Promise.all(mealData.map(async (meal) => {
      try {
        const foodsSql = `
          SELECT 
            mf.food_id,
            fd.name as food_name,
            fd.name_indonesian as food_name_indonesian,
            mf.quantity,
            mf.unit,
            mf.calories,
            mf.protein,
            mf.carbs,
            mf.fat
          FROM meal_foods mf
          LEFT JOIN food_database fd ON mf.food_id = fd.id
          WHERE mf.meal_id = ?
        `;
        
        const foods = await query(foodsSql, [meal.id]);
        
        return {
          ...meal,
          foods: foods || []
        };
      } catch (error) {
        console.error("Error fetching foods for meal:", meal.id, error);
        return {
          ...meal,
          foods: []
        };
      }
    }));

    return NextResponse.json({
      success: true,
      data: parsedMealData,
    });
  } catch (error) {
    console.error("Error fetching meal tracking:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data meal tracking",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create meal tracking entry
export async function POST(request) {
  try {
    const {
      user_id,
      meal_type,
      foods,
      notes,
      recorded_at
    } = await request.json();

    if (!user_id || !meal_type || !foods || !Array.isArray(foods)) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID, meal type, dan foods array wajib diisi",
        },
        { status: 400 }
      );
    }

    try {
      // Insert meal tracking
      const mealSql = `
        INSERT INTO meal_tracking (user_id, meal_type, notes, recorded_at, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

      // Format datetime for MySQL
      const formattedDate = recorded_at ? 
        new Date(recorded_at).toISOString().slice(0, 19).replace('T', ' ') : 
        new Date().toISOString().slice(0, 19).replace('T', ' ');

      const mealResult = await query(mealSql, [
        user_id,
        meal_type,
        notes || null,
        formattedDate,
      ]);

      const mealId = mealResult.insertId;

      // Insert meal foods
      for (const food of foods) {
        const foodSql = `
          INSERT INTO meal_foods (meal_id, food_id, quantity, unit, calories, protein, carbs, fat)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await query(foodSql, [
          mealId,
          food.food_id,
          food.quantity || 1,
          food.unit || 'serving',
          food.calories || 0,
          food.protein || 0,
          food.carbs || 0,
          food.fat || 0,
        ]);
      }

      return NextResponse.json({
        success: true,
        message: "Meal tracking entry created successfully",
        data: { id: mealId },
      });
    } catch (error) {
      console.error("Error inserting meal data:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error creating meal tracking:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat meal tracking entry",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 