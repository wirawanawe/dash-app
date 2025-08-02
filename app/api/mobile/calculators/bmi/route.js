import { NextResponse } from "next/server";

// POST - Calculate BMI
export async function POST(request) {
  try {
    const { weight, height, unit = "metric" } = await request.json();

    if (!weight || !height) {
      return NextResponse.json(
        {
          success: false,
          message: "Weight dan height wajib diisi",
        },
        { status: 400 }
      );
    }

    let weightKg, heightM;

    // Convert units if necessary
    if (unit === "imperial") {
      // Convert pounds to kg
      weightKg = weight * 0.453592;
      // Convert feet and inches to meters
      const feet = Math.floor(height);
      const inches = (height - feet) * 12;
      heightM = (feet * 0.3048) + (inches * 0.0254);
    } else {
      weightKg = weight;
      heightM = height / 100; // Convert cm to meters
    }

    // Calculate BMI
    const bmi = weightKg / (heightM * heightM);

    // Determine BMI category
    let category, healthRisk, recommendation;

    if (bmi < 18.5) {
      category = "Underweight";
      healthRisk = "Low";
      recommendation = "Consider gaining weight through healthy eating and strength training";
    } else if (bmi >= 18.5 && bmi < 25) {
      category = "Normal weight";
      healthRisk = "Low";
      recommendation = "Maintain your current weight with balanced diet and regular exercise";
    } else if (bmi >= 25 && bmi < 30) {
      category = "Overweight";
      healthRisk = "Medium";
      recommendation = "Focus on weight loss through diet and exercise";
    } else if (bmi >= 30 && bmi < 35) {
      category = "Obese (Class I)";
      healthRisk = "High";
      recommendation = "Consult a healthcare provider for weight loss guidance";
    } else if (bmi >= 35 && bmi < 40) {
      category = "Obese (Class II)";
      healthRisk = "Very High";
      recommendation = "Seek medical advice for weight management";
    } else {
      category = "Obese (Class III)";
      healthRisk = "Very High";
      recommendation = "Immediate medical consultation recommended";
    }

    const result = {
      bmi: parseFloat(bmi.toFixed(1)),
      category,
      healthRisk,
      recommendation,
      weight_kg: parseFloat(weightKg.toFixed(1)),
      height_m: parseFloat(heightM.toFixed(2)),
      unit_used: unit,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error calculating BMI:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghitung BMI",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 