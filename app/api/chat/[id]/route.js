import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyJwtToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';


// GET messages for a specific chat
export async function GET(request, { params }) {
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

    // Check if user can access chat (DOCTOR, ADMIN, SUPERADMIN)
    const canAccessChat = userData.role === 'DOCTOR' || userData.role === 'ADMIN' || userData.role === 'SUPERADMIN';
    
    if (!canAccessChat) {
      return NextResponse.json(
        { message: 'Unauthorized - Doctor, Admin, or Superadmin access required' },
        { status: 401 }
      );
    }

    const doctorId = userData.id;

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    const offset = (page - 1) * limit;

    // Verify doctor has access to this chat
    const [chatAccess] = await query(
      'SELECT id, doctor_id FROM chats WHERE id = ? AND doctor_id = ?',
      [id, doctorId]
    );

    if (!chatAccess) {
      return NextResponse.json(
        { message: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    // Get total count of messages
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chat_messages 
      WHERE chat_id = ?
    `;
    const countResult = await query(countQuery, [id]);
    const total = countResult[0]?.total || 0;

    // Get messages with pagination
    const messagesQuery = `
      SELECT 
        cm.id,
        cm.chat_id,
        cm.sender_id,
        cm.sender_type,
        cm.content,
        cm.file_url,
        cm.sent_at,
        cm.is_read,
        CASE 
          WHEN cm.sender_type = 'doctor' THEN d.name
          WHEN cm.sender_type = 'user' THEN mu.name
          ELSE 'Unknown'
        END as sender_name,
        CASE 
          WHEN cm.sender_type = 'doctor' THEN NULL
          WHEN cm.sender_type = 'user' THEN NULL
          ELSE NULL
        END as sender_avatar
      FROM chat_messages cm
      LEFT JOIN doctors d ON cm.sender_id = d.id AND cm.sender_type = 'doctor'
      LEFT JOIN mobile_users mu ON cm.sender_id = mu.id AND cm.sender_type = 'user'
      WHERE cm.chat_id = ?
      ORDER BY cm.sent_at ASC
      LIMIT ? OFFSET ?
    `;

    const messages = await query(messagesQuery, [id, Number(limit), Number(offset)]);

    // Mark user messages as read
    await query(
      'UPDATE chat_messages SET is_read = TRUE WHERE chat_id = ? AND sender_type = "user" AND is_read = FALSE',
      [id]
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      messages,
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
    console.error('Error in GET /api/chat/[id]:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST send message in chat
export async function POST(request, { params }) {
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

    // Check if user can access chat (DOCTOR, ADMIN, SUPERADMIN)
    const canAccessChat = userData.role === 'DOCTOR' || userData.role === 'ADMIN' || userData.role === 'SUPERADMIN';
    
    if (!canAccessChat) {
      return NextResponse.json(
        { message: 'Unauthorized - Doctor, Admin, or Superadmin access required' },
        { status: 401 }
      );
    }

    const doctorId = userData.id;

    const { id } = params;
    const body = await request.json();
    const { content, file_url } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: 'Message content is required' },
        { status: 400 }
      );
    }

    // Verify doctor has access to this chat
    const [chatAccess] = await query(
      'SELECT id, doctor_id, status FROM chats WHERE id = ? AND doctor_id = ?',
      [id, doctorId]
    );

    if (!chatAccess) {
      return NextResponse.json(
        { message: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    if (chatAccess.status === 'closed') {
      return NextResponse.json(
        { message: 'Cannot send message to closed chat' },
        { status: 400 }
      );
    }

    // Insert message
    const insertMessageQuery = `
      INSERT INTO chat_messages (chat_id, sender_id, sender_type, content, file_url, sent_at)
      VALUES (?, ?, 'doctor', ?, ?, NOW())
    `;

    const messageResult = await query(insertMessageQuery, [
      id,
      doctorId,
      content.trim(),
      file_url || null
    ]);

    // Update chat's last_message_at
    await query(
      'UPDATE chats SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?',
      [id]
    );

    // Get the created message with sender info
    const [messageData] = await query(`
      SELECT 
        cm.id,
        cm.chat_id,
        cm.sender_id,
        cm.sender_type,
        cm.content,
        cm.file_url,
        cm.sent_at,
        cm.is_read,
        d.name as sender_name
      FROM chat_messages cm
      LEFT JOIN doctors d ON cm.sender_id = d.id
      WHERE cm.id = ?
    `, [messageResult.insertId]);

    return NextResponse.json({
      message: 'Message sent successfully',
      messageData
    });

  } catch (error) {
    console.error('Error in POST /api/chat/[id]:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update chat status (close/reopen chat)
export async function PUT(request, { params }) {
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

    // Check if user can access chat (DOCTOR, ADMIN, SUPERADMIN)
    const canAccessChat = userData.role === 'DOCTOR' || userData.role === 'ADMIN' || userData.role === 'SUPERADMIN';
    
    if (!canAccessChat) {
      return NextResponse.json(
        { message: 'Unauthorized - Doctor, Admin, or Superadmin access required' },
        { status: 401 }
      );
    }

    const doctorId = userData.id;

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'closed'].includes(status)) {
      return NextResponse.json(
        { message: 'Status must be either "active" or "closed"' },
        { status: 400 }
      );
    }

    // Verify doctor has access to this chat
    const [chatAccess] = await query(
      'SELECT id, doctor_id FROM chats WHERE id = ? AND doctor_id = ?',
      [id, doctorId]
    );

    if (!chatAccess) {
      return NextResponse.json(
        { message: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    // Update chat status
    await query(
      'UPDATE chats SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({
      message: `Chat ${status === 'closed' ? 'closed' : 'reopened'} successfully`
    });

  } catch (error) {
    console.error('Error in PUT /api/chat/[id]:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 