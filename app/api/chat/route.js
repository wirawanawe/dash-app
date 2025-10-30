import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyJwtToken } from '@/lib/auth';

// GET chat list for doctor (only shows chats where doctor is assigned)
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

    // Check if user can access chat (DOCTOR, ADMIN, SUPERADMIN)
    const canAccessChat = userData.role === 'DOCTOR' || userData.role === 'ADMIN' || userData.role === 'SUPERADMIN';
    
    if (!canAccessChat) {
      return NextResponse.json(
        { message: 'Unauthorized - Doctor, Admin, or Superadmin access required' },
        { status: 401 }
      );
    }

    const doctorId = userData.id;

    // Ensure doctorId is a valid number
    const validDoctorId = parseInt(doctorId);
    if (isNaN(validDoctorId) || validDoctorId <= 0) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid doctor ID' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const offset = (validPage - 1) * validLimit;

    // Build query conditions step by step
    let countWhere = 'WHERE c.doctor_id = ?';
    let dataWhere = 'WHERE c.doctor_id = ?';
    let countParams = [validDoctorId];
    let dataParams = [validDoctorId];

    // Add status filter if provided and not 'all'
    if (status && status !== 'all' && status.trim() !== '') {
      countWhere += ' AND c.status = ?';
      dataWhere += ' AND c.status = ?';
      countParams.push(status);
      dataParams.push(status);
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      // For count query - using EXISTS to avoid JOIN issues
      countWhere += ` AND EXISTS (
        SELECT 1 FROM mobile_users mu_search 
        WHERE mu_search.id = c.user_id 
        AND (c.title LIKE ? OR mu_search.name LIKE ? OR mu_search.email LIKE ?)
      )`;
      // For data query - using LEFT JOIN
      dataWhere += ' AND (c.title LIKE ? OR mu.name LIKE ? OR mu.email LIKE ?)';
      
      countParams.push(searchTerm, searchTerm, searchTerm);
      dataParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Build count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chats c
      ${countWhere}
    `;
    
    const countResult = await query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    // Build data query - simplified to avoid subquery issues
    const dataQuery = `
      SELECT 
        c.id,
        c.user_id,
        c.doctor_id,
        c.title,
        c.status,
        c.last_message_at,
        c.created_at,
        c.updated_at,
        COALESCE(mu.name, 'Unknown User') as user_name,
        COALESCE(mu.email, '') as user_email,
        COALESCE(mu.phone, '') as user_phone,
        COALESCE(d.name, 'Unknown Doctor') as doctor_name,
        COALESCE(d.specialist, '') as doctor_specialization,
        0 as unread_count,
        '' as last_message,
        NULL as last_message_time
      FROM chats c
      LEFT JOIN mobile_users mu ON c.user_id = mu.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      ${dataWhere}
      ORDER BY c.last_message_at DESC, c.updated_at DESC
      LIMIT ${validLimit} OFFSET ${offset}
    `;

    const chats = await query(dataQuery, dataParams);
    
    // Now get additional data for each chat in separate queries
    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      // Get unread count
      const [unreadResult] = await query(
        'SELECT COUNT(*) as count FROM chat_messages WHERE chat_id = ? AND sender_type = ? AND is_read = FALSE',
        [chat.id, 'user']
      );
      
      // Get last message
      const [lastMessageResult] = await query(
        'SELECT content, sent_at FROM chat_messages WHERE chat_id = ? ORDER BY sent_at DESC LIMIT 1',
        [chat.id]
      );
      
      return {
        ...chat,
        unread_count: unreadResult?.count || 0,
        last_message: lastMessageResult?.content || '',
        last_message_time: lastMessageResult?.sent_at || null
      };
    }));

    const totalPages = Math.ceil(total / validLimit);

    return NextResponse.json({
      chats: chatsWithDetails,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1
      }
    });

  } catch (error) {

    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST create new chat (doctor can initiate chat with user)
export async function POST(request) {
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

    // Check if user can access chat (DOCTOR, ADMIN, SUPERADMIN)
    const canAccessChat = userData.role === 'DOCTOR' || userData.role === 'ADMIN' || userData.role === 'SUPERADMIN';
    
    if (!canAccessChat) {
      return NextResponse.json(
        { message: 'Unauthorized - Doctor, Admin, or Superadmin access required' },
        { status: 401 }
      );
    }

    const doctorId = userData.id;

    const body = await request.json();
    const { user_id, title, initial_message } = body;

    if (!user_id) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [userExists] = await query('SELECT id FROM mobile_users WHERE id = ?', [user_id]);
    if (userExists.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if chat already exists between this doctor and user
    const [existingChat] = await query(
      'SELECT id FROM chats WHERE doctor_id = ? AND user_id = ? AND status = "active"',
      [doctorId, user_id]
    );

    if (existingChat.length > 0) {
      return NextResponse.json(
        { message: 'Chat already exists with this user' },
        { status: 409 }
      );
    }

    // Create new chat
    const insertChatQuery = `
      INSERT INTO chats (user_id, doctor_id, title, status, created_at, updated_at)
      VALUES (?, ?, ?, 'active', NOW(), NOW())
    `;

    const chatResult = await query(insertChatQuery, [
      user_id,
      doctorId,
      title || `Chat dengan ${userData.name}`
    ]);

    const chatId = chatResult.insertId;

    // If initial message is provided, create the first message
    if (initial_message) {
      const insertMessageQuery = `
        INSERT INTO chat_messages (chat_id, sender_id, sender_type, content, sent_at)
        VALUES (?, ?, 'doctor', ?, NOW())
      `;

      await query(insertMessageQuery, [chatId, doctorId, initial_message]);

      // Update last_message_at
      await query(
        'UPDATE chats SET last_message_at = NOW() WHERE id = ?',
        [chatId]
      );
    }

    // Get the created chat with user info
    const [newChat] = await query(`
      SELECT 
        c.id,
        c.user_id,
        c.doctor_id,
        c.title,
        c.status,
        c.last_message_at,
        c.created_at,
        c.updated_at,
        mu.name as user_name,
        mu.email as user_email,
        mu.phone as user_phone,
        d.name as doctor_name,
        d.specialist as doctor_specialization
      FROM chats c
      LEFT JOIN mobile_users mu ON c.user_id = mu.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE c.id = ?
    `, [chatId]);

    return NextResponse.json({
      message: 'Chat created successfully',
      chat: newChat
    });

  } catch (error) {

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}