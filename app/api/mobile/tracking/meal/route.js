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
        mt.id, mt.user_id, mt.meal_type, mt.recorded_at, mt.notes, mt.created_at,
        mf.food_id, mf.quantity, mf.unit, mf.calories, mf.protein, mf.carbs, mf.fat,
        fd.name as food_name, fd.name_indonesian as food_name_indonesian
      FROM meal_tracking mt
      LEFT JOIN meal_foods mf ON mt.id = mf.meal_id
      LEFT JOIN food_database fd ON mf.food_id = fd.id
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

    sql += " ORDER BY mt.recorded_at DESC";

    // Add LIMIT if specified
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }

    const mealData = await query(sql, params);

    // Group by meal (same user_id, meal_type, recorded_at, notes)
    const groupedMeals = {};
    
    mealData.forEach(record => {
      const mealKey = `${record.user_id}_${record.meal_type}_${record.recorded_at}_${record.notes || ''}`;
      
      if (!groupedMeals[mealKey]) {
        groupedMeals[mealKey] = {
          id: record.id,
          user_id: record.user_id,
          meal_type: record.meal_type,
          recorded_at: record.recorded_at,
          notes: record.notes,
          created_at: record.created_at,
          foods: []
        };
      }
      
      // Add food item if it exists
      if (record.food_id) {
        groupedMeals[mealKey].foods.push({
          food_id: record.food_id,
          food_name: record.food_name,
          food_name_indonesian: record.food_name_indonesian,
          quantity: record.quantity,
          unit: record.unit,
          calories: record.calories,
          protein: record.protein,
          carbs: record.carbs,
          fat: record.fat
        });
      }
    });

    const result = Object.values(groupedMeals);

    return NextResponse.json({
      success: true,
      data: result,
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

    // Debug logging
    console.log('🍽️ Received meal data:', {
      user_id,
      meal_type,
      foods_count: foods?.length,
      foods: foods,
      notes,
      recorded_at
    });

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
      // Format datetime for MySQL
      const formattedDate = recorded_at ? 
        new Date(recorded_at).toISOString().slice(0, 19).replace('T', ' ') : 
        new Date().toISOString().slice(0, 19).replace('T', ' ');

      // First, create the meal entry
      const mealInsertSQL = `
        INSERT INTO meal_tracking (
          user_id, meal_type, recorded_at, notes, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `;

      const mealResult = await query(mealInsertSQL, [
        user_id,
        meal_type,
        formattedDate,
        notes || null
      ]);

      const mealId = mealResult.insertId;
      console.log('🍽️ Created meal entry with ID:', mealId);

      // Then, insert each food as a separate record in meal_foods
      const insertedFoodIds = [];
      
      for (const food of foods) {
        // Validate and convert nutrition values
        const quantity = parseFloat(food.quantity) || 1;
        const calories = parseFloat(food.calories) || 0;
        const protein = parseFloat(food.protein) || 0;
        const carbs = parseFloat(food.carbs) || 0;
        const fat = parseFloat(food.fat) || 0;
        
        // Ensure values are not negative
        const validatedCalories = Math.max(0, calories);
        const validatedProtein = Math.max(0, protein);
        const validatedCarbs = Math.max(0, carbs);
        const validatedFat = Math.max(0, fat);
        
        const foodInsertSQL = `
          INSERT INTO meal_foods (
            meal_id, food_id, quantity, unit, calories, protein, carbs, fat, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const foodResult = await query(foodInsertSQL, [
          mealId,
          food.food_id || null,
          quantity,
          food.unit || 'serving',
          validatedCalories,
          validatedProtein,
          validatedCarbs,
          validatedFat
        ]);

        insertedFoodIds.push(foodResult.insertId);

        // Debug logging for each food
        console.log('🍎 Saved food:', {
          id: foodResult.insertId,
          meal_id: mealId,
          food_id: food.food_id,
          quantity,
          unit: food.unit || 'serving',
          calories: validatedCalories,
          protein: validatedProtein,
          carbs: validatedCarbs,
          fat: validatedFat
        });
      }

      return NextResponse.json({
        success: true,
        message: "Meal tracking entry created successfully",
        data: { meal_id: mealId, food_ids: insertedFoodIds },
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