import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { query } from '../lib/db.js';

async function addSampleMealData() {
  try {
    console.log('🍽️ Adding sample meal data...');

    // Get the first user (mobile or regular)
    const users = await query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const userId = users[0].id;
    const today = new Date().toISOString().split('T')[0];

    // Add sample meal tracking records
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealData = [
      {
        meal_type: 'breakfast',
        notes: 'Sample breakfast',
        foods: [
          { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
          { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 }
        ]
      },
      {
        meal_type: 'lunch',
        notes: 'Sample lunch',
        foods: [
          { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
          { name: 'Brown Rice', calories: 110, protein: 2.5, carbs: 23, fat: 0.9 },
          { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6 }
        ]
      },
      {
        meal_type: 'dinner',
        notes: 'Sample dinner',
        foods: [
          { name: 'Salmon', calories: 208, protein: 25, carbs: 0, fat: 12 },
          { name: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fat: 1.9 },
          { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }
        ]
      }
    ];

    for (const meal of mealData) {
      // Insert meal tracking record
      const mealResult = await query(
        'INSERT INTO meal_tracking (user_id, meal_type, recorded_at, notes) VALUES (?, ?, ?, ?)',
        [userId, meal.meal_type, `${today} 12:00:00`, meal.notes]
      );

      const mealId = mealResult.insertId;

      // Insert meal foods
      for (const food of meal.foods) {
        // First, add food to food_database if it doesn't exist
        const existingFood = await query(
          'SELECT id FROM food_database WHERE name = ?',
          [food.name]
        );

        let foodId;
        if (existingFood.length > 0) {
          foodId = existingFood[0].id;
        } else {
                  const foodResult = await query(
          'INSERT INTO food_database (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES (?, ?, ?, ?, ?, ?)',
          [food.name, 'general', food.calories, food.protein, food.carbs, food.fat]
        );
          foodId = foodResult.insertId;
        }

        // Insert meal food
        await query(
          'INSERT INTO meal_foods (meal_id, food_id, quantity, unit, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [mealId, foodId, 1, 'serving', food.calories, food.protein, food.carbs, food.fat]
        );
      }
    }

    console.log('✅ Sample meal data added successfully!');
    console.log(`📊 Added ${mealData.length} meals for user ID: ${userId}`);
    console.log(`📅 Date: ${today}`);

  } catch (error) {
    console.error('❌ Error adding sample meal data:', error);
  }
}

// Run the script
addSampleMealData(); 