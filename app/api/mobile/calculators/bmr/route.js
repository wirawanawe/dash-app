import { NextResponse } from "next/server";

// POST - Calculate BMR
export async function POST(request) {
  try {
    const {
      weight,
      height,
      age,
      gender,
      activity_level = "sedentary",
      unit = "metric"
    } = await request.json();

    if (!weight || !height || !age || !gender) {
      return NextResponse.json(
        {
          success: false,
          message: "Weight, height, age, dan gender wajib diisi",
        },
        { status: 400 }
      );
    }

    let weightKg, heightCm;

    // Convert units if necessary
    if (unit === "imperial") {
      // Convert pounds to kg
      weightKg = weight * 0.453592;
      // Convert feet and inches to cm
      const feet = Math.floor(height);
      const inches = (height - feet) * 12;
      heightCm = (feet * 30.48) + (inches * 2.54);
    } else {
      weightKg = weight;
      heightCm = height;
    }

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender.toLowerCase() === "male") {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,        // Little or no exercise
      lightly_active: 1.375,  // Light exercise/sports 1-3 days/week
      moderately_active: 1.55, // Moderate exercise/sports 3-5 days/week
      very_active: 1.725,     // Hard exercise/sports 6-7 days a week
      extremely_active: 1.9   // Very hard exercise/sports & physical job
    };

    const tdee = bmr * activityMultipliers[activity_level];

    // Calculate macronutrient recommendations
    const proteinRatio = 0.25; // 25% of calories
    const fatRatio = 0.25;     // 25% of calories
    const carbRatio = 0.5;     // 50% of calories

    const proteinGrams = (tdee * proteinRatio) / 4; // 4 calories per gram
    const fatGrams = (tdee * fatRatio) / 9;         // 9 calories per gram
    const carbGrams = (tdee * carbRatio) / 4;       // 4 calories per gram

    const result = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      activity_level,
      macronutrients: {
        protein: {
          grams: Math.round(proteinGrams),
          calories: Math.round(tdee * proteinRatio),
          percentage: proteinRatio * 100
        },
        fat: {
          grams: Math.round(fatGrams),
          calories: Math.round(tdee * fatRatio),
          percentage: fatRatio * 100
        },
        carbs: {
          grams: Math.round(carbGrams),
          calories: Math.round(tdee * carbRatio),
          percentage: carbRatio * 100
        }
      },
      recommendations: {
        weight_loss: Math.round(tdee - 500), // 500 calorie deficit
        weight_gain: Math.round(tdee + 300), // 300 calorie surplus
        maintenance: Math.round(tdee)
      },
      input_data: {
        weight_kg: parseFloat(weightKg.toFixed(1)),
        height_cm: parseFloat(heightCm.toFixed(1)),
        age,
        gender,
        unit_used: unit
      }
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error calculating BMR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghitung BMR",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 