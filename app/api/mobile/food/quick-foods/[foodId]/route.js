import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// DELETE - Remove food from quick foods
export async function DELETE(request, { params }) {
  try {
    const { foodId } = params;

    if (!foodId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Food ID is required" 
        },
        { status: 400 }
      );
    }

    // For now, just return success since we need to implement user-specific storage
    // This should be enhanced to remove the food from the authenticated user's quick foods
    return NextResponse.json({
      success: true,
      message: "Food removed from quick foods",
      data: { food_id: foodId }
    });
    
  } catch (error) {
    console.error("Error removing from quick foods:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal menghapus dari quick foods",
        error: error.message 
      },
      { status: 500 }
    );
  }
} 