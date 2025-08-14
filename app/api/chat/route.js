import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCachedCount, invalidateTableCache } from "@/lib/cache";

export const dynamic = 'force-dynamic';


// GET - Get all chats with pagination and search
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    let limit = parseInt(searchParams.get("limit"), 10);
    
    // Set default limit to 50 if not specified or invalid
    if (!limit || limit < 1) {
      limit = 50; // Increased from 20 to 50
    }
    
    // Cap limit at 100 to prevent excessive data transfer
    const validLimit = Math.min(Math.max(1, limit), 100);

    const offset = (page - 1) * validLimit;

    let sql = `
      SELECT 
        c.id,
        c.user_id,
        c.doctor_id,
        c.status,
        c.created_at,
        c.updated_at,
        c.closed_at,
        mu.full_name as user_name,
        mu.email as user_email,
        u.full_name as doctor_name,
        u.email as doctor_email,
        (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id) as message_count,
        (SELECT MAX(created_at) FROM chat_messages WHERE chat_id = c.id) as last_message_time
      FROM chats c
      LEFT JOIN mobile_users mu ON c.user_id = mu.id
      LEFT JOIN users u ON c.doctor_id = u.id
      WHERE 1=1
    `;
    
    let params = [];

    // Add search filter
    if (search) {
      sql += " AND (mu.full_name LIKE ? OR mu.email LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add status filter
    if (status) {
      sql += " AND c.status = ?";
      params.push(status);
    }

    sql += " ORDER BY c.updated_at DESC LIMIT ? OFFSET ?";
    params.push(validLimit, offset);

    const chats = await query(sql, params);

    // Get total count using cached COUNT
    let whereClause = "WHERE 1=1";
    let countParams = [];
    
    if (search) {
      whereClause += " AND (mu.full_name LIKE ? OR mu.email LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereClause += " AND c.status = ?";
      countParams.push(status);
    }

    // Complex count query with joins
    const countSql = `
      SELECT COUNT(*) as total 
      FROM chats c
      LEFT JOIN mobile_users mu ON c.user_id = mu.id
      LEFT JOIN users u ON c.doctor_id = u.id
      ${whereClause}
    `;
    
    const total = await getCachedCount('chats', whereClause, countParams, query);

    return NextResponse.json({
      success: true,
      data: chats,
      pagination: {
        total,
        page,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit),
        hasNext: page < Math.ceil(total / validLimit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal mengambil data chat",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Create new chat
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.user_id || !body.doctor_id) {
      return NextResponse.json(
        { success: false, message: "User ID dan Doctor ID wajib diisi" },
        { status: 400 }
      );
    }

    // Check if chat already exists
    const existingChat = await query(
      "SELECT id FROM chats WHERE user_id = ? AND doctor_id = ? AND status = 'active'",
      [body.user_id, body.doctor_id]
    );

    if (existingChat.length > 0) {
      return NextResponse.json(
        { success: false, message: "Chat sudah ada untuk user dan doctor ini" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO chats (user_id, doctor_id, status, created_at, updated_at)
      VALUES (?, ?, 'active', NOW(), NOW())
    `;

    const params = [body.user_id, body.doctor_id];

    const result = await query(sql, params);
    
    // Invalidate cache after creating new chat
    invalidateTableCache('chats');

    return NextResponse.json({
      success: true,
      message: "Chat berhasil dibuat",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Gagal membuat chat",
        error: error.message 
      },
      { status: 500 }
    );
  }
}