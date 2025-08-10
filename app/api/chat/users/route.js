import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyJwtToken } from '@/lib/auth';

// GET list of mobile users for doctor to chat with
export async function GET(request) {
  try {
    // Get tokens from cookies (check both token and api_token)
    const token = request.cookies.get("token");
    const apiToken = request.cookies.get("api_token");
    
    let payload = null;
    let userData = null;

    // Try internal token first
    if (token) {
      try {
        payload = await verifyJwtToken(token.value);
        if (payload) {
          userData = {
            id: payload.id || payload.sub || payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role || "USER",
            clinic_id: payload.clinic_id || null,
          };
        }
      } catch (error) {
        console.error("Error verifying internal token:", error);
      }
    }

    // If internal token failed, try external API token
    if (!userData && apiToken) {
      try {
        // Set timeout for external API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const apiResponse = await fetch(
          "https://api1-dev.doctorphc.id/laboratorium/me",
          {
            headers: {
              Authorization: `Bearer ${apiToken.value}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (apiResponse.ok) {
          const externalUserData = await apiResponse.json();
          userData = {
            id: externalUserData.data?.ID || externalUserData.ID,
            name: externalUserData.data?.FullName || externalUserData.FullName || "Unknown",
            email: externalUserData.data?.email || externalUserData.email,
            role: externalUserData.data?.level?.LevelName || externalUserData.level?.LevelName || "USER",
            clinic_id: null,
          };
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching from external API:", error);
        }
      }
    }

    // If no valid authentication found
    if (!userData || !userData.id || !userData.name || userData.name === "Unknown") {
      return NextResponse.json(
        { message: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    // Check if user is a doctor
    if (userData.role !== 'DOCTOR' && userData.role !== 'doctor') {
      return NextResponse.json(
        { message: 'Unauthorized - Doctor access required' },
        { status: 401 }
      );
    }

    const doctorId = userData.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Build search conditions
    let whereConditions = ['mu.is_active = TRUE'];
    let params = [];

    if (search) {
      whereConditions.push(`(mu.name LIKE ? OR mu.email LIKE ? OR mu.phone LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mobile_users mu
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get users with chat info
    const usersQuery = `
      SELECT 
        mu.id,
        mu.name,
        mu.email,
        mu.phone,

        mu.created_at,
        mu.updated_at,
        c.id as existing_chat_id,
        c.status as chat_status,
        c.last_message_at,
        (
          SELECT COUNT(*) 
          FROM chat_messages cm 
          WHERE cm.chat_id = c.id 
          AND cm.sender_type = 'user' 
          AND cm.is_read = FALSE
        ) as unread_count
      FROM mobile_users mu
      LEFT JOIN chats c ON mu.id = c.user_id AND c.doctor_id = ?
      ${whereClause}
      ORDER BY mu.name ASC
      LIMIT ? OFFSET ?
    `;

    const users = await query(usersQuery, [...params, doctorId, Number(limit), Number(offset)]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in GET /api/chat/users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 