import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST - Join a wellness challenge
export async function POST(request, { params }) {
  try {
    const { challengeId } = params;
    const { user_id } = await request.json();

    if (!user_id || !challengeId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID dan challenge ID wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if challenge exists and is active
    const challengeCheck = await query(
      "SELECT id, title, start_date, end_date, is_active FROM wellness_challenges WHERE id = ? AND is_active = 1",
      [challengeId]
    );

    if (challengeCheck.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Challenge tidak ditemukan atau tidak aktif",
        },
        { status: 404 }
      );
    }

    const challenge = challengeCheck[0];

    // Check if challenge is currently active
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    if (now < startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Challenge belum dimulai",
        },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Challenge sudah berakhir",
        },
        { status: 400 }
      );
    }

    // Check if user has already joined this challenge
    const existingJoin = await query(
      "SELECT id FROM wellness_user_challenges WHERE user_id = ? AND challenge_id = ?",
      [user_id, challengeId]
    );

    if (existingJoin.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda sudah bergabung dengan challenge ini",
        },
        { status: 409 }
      );
    }

    // Join the challenge
    const joinSql = `
      INSERT INTO wellness_user_challenges (
        user_id, challenge_id, progress, joined_at, created_at
      ) VALUES (?, ?, 0, NOW(), NOW())
    `;

    const result = await query(joinSql, [user_id, challengeId]);

    return NextResponse.json({
      success: true,
      message: "Berhasil bergabung dengan challenge",
      data: {
        join_id: result.insertId,
        challenge_title: challenge.title,
        progress: 0,
      },
    });
  } catch (error) {
    console.error("Error joining challenge:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal bergabung dengan challenge",
        error: error.message,
      },
      { status: 500 }
    );
  }
} 