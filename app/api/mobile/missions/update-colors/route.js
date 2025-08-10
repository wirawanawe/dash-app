import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    // Update missions dengan colors dan icons
    const updates = [
      { id: 1, color: '#10B981', icon: 'check-circle' }, // Minum Air 8 Gelas (daily_habit)
      { id: 2, color: '#F59E0B', icon: 'dumbbell' }, // Olahraga 30 Menit (fitness)
      { id: 3, color: '#8B5CF6', icon: 'brain' }, // Catat Mood Harian (mental_health)
      { id: 4, color: '#EF4444', icon: 'food-apple' }, // Konsumsi 5 Porsi Sayur/Buah (nutrition)
      { id: 5, color: '#10B981', icon: 'check-circle' }, // Tidur 8 Jam (daily_habit)
      { id: 6, color: '#8B5CF6', icon: 'brain' }, // Meditasi 10 Menit (mental_health)
      { id: 7, color: '#F59E0B', icon: 'dumbbell' }, // Jalan Kaki 10.000 Langkah (fitness)
    ];

    let updatedCount = 0;
    for (const update of updates) {
      const sql = 'UPDATE missions SET color = ?, icon = ? WHERE id = ?';
      await query(sql, [update.color, update.icon, update.id]);
      updatedCount++;
    }

    // Verifikasi update
    const [missions] = await query('SELECT id, title, category, color, icon FROM missions ORDER BY id');

    return NextResponse.json({
      message: `Successfully updated ${updatedCount} missions`,
      updatedMissions: missions
    });
  } catch (error) {
    console.error('Error updating missions:', error);
    return NextResponse.json(
      { error: 'Failed to update missions' },
      { status: 500 }
    );
  }
} 