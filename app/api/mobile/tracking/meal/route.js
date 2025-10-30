import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Function to convert Indonesian meal type to English
function convertMealTypeToEnglish(mealType) {
  const mealTypeMap = {
    'sarapan': 'breakfast',
    'makan siang': 'lunch',
    'makan malam': 'dinner',
    'snack': 'snack',
    // Keep English values as is
    'breakfast': 'breakfast',
    'lunch': 'lunch',
    'dinner': 'dinner'
  };
  
  return mealTypeMap[mealType] || mealType;
}

// Function to convert English meal type to Indonesian for display
function convertMealTypeToIndonesian(mealType) {
  const mealTypeMap = {
    'breakfast': 'sarapan',
    'lunch': 'makan siang',
    'dinner': 'makan malam',
    'snack': 'snack'
  };
  
  return mealTypeMap[mealType] || mealType;
}

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
        id, user_id, meal_type, recorded_at, food_id, food_name, food_name_indonesian,
        quantity, unit, calories, protein, carbs, fat, notes, created_at
      FROM meal_logging
      WHERE user_id = ?
    `;
    let params = [user_id];

    if (date) {
      sql += " AND DATE(recorded_at) = ?";
      params.push(date);
    }

    if (hours_ago) {
      const hours = parseInt(hours_ago);
      sql += " AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)";
      params.push(hours);
    }

    if (meal_type) {
      // Convert Indonesian meal type to English for database query
      const englishMealType = convertMealTypeToEnglish(meal_type);
      sql += " AND meal_type = ?";
      params.push(englishMealType);
    }

    sql += " ORDER BY recorded_at DESC";

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
          meal_type: convertMealTypeToIndonesian(record.meal_type), // Convert to Indonesian for display
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
      data: {
        entries: result
      },
    });
  } catch (error) {

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
      // Convert Indonesian meal type to English for database storage
      const englishMealType = convertMealTypeToEnglish(meal_type);

      // Format datetime for MySQL
      const formattedDate = recorded_at ? 
        new Date(recorded_at).toISOString().slice(0, 19).replace('T', ' ') : 
        new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Insert each food as a separate record in meal_logging
      const insertedIds = [];
      
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
        
        // Get food name from food_database if food_id is provided
        let foodName = null;
        let foodNameIndonesian = null;
        
        if (food.food_id) {
          const foodData = await query(
            'SELECT name, name_indonesian FROM food_database WHERE id = ?',
            [food.food_id]
          );
          
          if (foodData.length > 0) {
            foodName = foodData[0].name;
            foodNameIndonesian = foodData[0].name_indonesian;
          }
        }
        
        const insertSQL = `
          INSERT INTO meal_logging (
            user_id, meal_type, recorded_at, food_id, food_name, food_name_indonesian,
            quantity, unit, calories, protein, carbs, fat, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const result = await query(insertSQL, [
          user_id,
          englishMealType, // Use converted English meal type
          formattedDate,
          food.food_id || null,
          foodName,
          foodNameIndonesian,
          quantity,
          food.unit || 'serving',
          validatedCalories,
          validatedProtein,
          validatedCarbs,
          validatedFat,
          notes || null
        ]);

        insertedIds.push(result.insertId);

        // Debug logging for each food

      }

      return NextResponse.json({
        success: true,
        message: "Meal tracking entry created successfully",
        data: { ids: insertedIds },
      });
    } catch (error) {

      throw error;
    }
  } catch (error) {

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