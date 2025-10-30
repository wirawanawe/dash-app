import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Get clinic rooms for dashboard
export async function GET(request) {
  try {
    // Get all available rooms from database
    const roomsQuery = `
      SELECT 
        id,
        room_name,
        room_type,
        room_status,
        capacity,
        floor_number,
        building,
        is_active
      FROM clinic_rooms 
      WHERE is_active = 1
      ORDER BY room_name
    `;
    
    const availableRooms = await query(roomsQuery);
    
    // Transform data for frontend
    const transformedRooms = availableRooms.map(room => ({
      id: room.id,
      room_name: room.room_name,
      room_type: room.room_type,
      room_status: room.room_status,
      capacity: room.capacity,
      floor_number: room.floor_number,
      building: room.building,
      is_active: room.is_active
    }));

    return NextResponse.json({
      success: true,
      data: transformedRooms,
      total: transformedRooms.length
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data ruang klinik",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 