import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    // Get today's meals using new schema
    const mealsSQL = `
      SELECT 
        mt.id, mt.user_id, mt.meal_type, mt.recorded_at, mt.notes, mt.created_at,
        mf.food_id, mf.quantity, mf.unit, mf.calories, mf.protein, mf.carbs, mf.fat,
        fd.name as food_name, fd.name_indonesian as food_name_indonesian
      FROM meal_tracking mt
      LEFT JOIN meal_foods mf ON mt.id = mf.meal_id
      LEFT JOIN food_database fd ON mf.food_id = fd.id
      WHERE mt.user_id = ? AND DATE(mt.recorded_at) = ?
      ORDER BY mt.recorded_at DESC
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

    // Calculate totals for today
    const totalsSQL = `
      SELECT 
        COALESCE(SUM(mf.calories), 0) as calories,
        COALESCE(SUM(mf.protein), 0) as protein,
        COALESCE(SUM(mf.carbs), 0) as carbs,
        COALESCE(SUM(mf.fat), 0) as fat
      FROM meal_tracking mt
      LEFT JOIN meal_foods mf ON mt.id = mf.meal_id
      WHERE mt.user_id = ? AND DATE(mt.recorded_at) = ?
    `;
    const [totalsRow] = await query(totalsSQL, [user_id, today]);
    const totals = totalsRow || { calories: 0, protein: 0, carbs: 0, fat: 0 };

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