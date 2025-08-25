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

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's meals using meal_logging table
    const mealsSQL = `
      SELECT 
        id, user_id, meal_type, recorded_at, food_id, food_name, food_name_indonesian,
        quantity, unit, calories, protein, carbs, fat, notes, created_at
      FROM meal_logging
      WHERE user_id = ? AND DATE(recorded_at) = ?
      ORDER BY recorded_at DESC
    `;

    const mealData = await query(mealsSQL, [user_id, today]);

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

    // Calculate totals for today
    const totalsSQL = `
      SELECT 
        COALESCE(SUM(calories), 0) as calories,
        COALESCE(SUM(protein), 0) as protein,
        COALESCE(SUM(carbs), 0) as carbs,
        COALESCE(SUM(fat), 0) as fat
      FROM meal_logging
      WHERE user_id = ? AND DATE(recorded_at) = ?
    `;
    const totalsRow = await query(totalsSQL, [user_id, today]);
    const totals = totalsRow[0] || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return NextResponse.json({
      success: true,
      data: {
        meals: result,
        totals
      },
    });
  } catch (error) {
    console.error("Error fetching today's meals:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data meal hari ini",
        error: error.message,
      },
      { status: 500 }
    );
  }
}