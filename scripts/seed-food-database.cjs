const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'pr1k1t1w',
  database: 'phc_dashboard'
};

// Comprehensive food database with Indonesian and international foods
const foodData = [
  // ========================================
  // INDONESIAN DISHES
  // ========================================
  {
    name: 'Nasi Goreng',
    name_indonesian: 'Nasi Goreng',
    category: 'Rice Dishes',
    calories_per_100g: 186,
    protein_per_100g: 4.2,
    carbs_per_100g: 35.0,
    fat_per_100g: 3.8,
    fiber_per_100g: 2.1,
    sugar_per_100g: 1.2,
    sodium_per_100g: 450.0,
    serving_size: '1 porsi (200g)',
    serving_weight: 200,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Ayam Goreng',
    name_indonesian: 'Ayam Goreng',
    category: 'Protein',
    calories_per_100g: 239,
    protein_per_100g: 23.0,
    carbs_per_100g: 0.0,
    fat_per_100g: 14.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 0.0,
    sodium_per_100g: 380.0,
    serving_size: '1 potong (100g)',
    serving_weight: 100,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Gado-gado',
    name_indonesian: 'Gado-gado',
    category: 'Vegetables',
    calories_per_100g: 145,
    protein_per_100g: 6.8,
    carbs_per_100g: 12.0,
    fat_per_100g: 8.5,
    fiber_per_100g: 4.2,
    sugar_per_100g: 2.1,
    sodium_per_100g: 320.0,
    serving_size: '1 porsi (250g)',
    serving_weight: 250,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Sate Ayam',
    name_indonesian: 'Sate Ayam',
    category: 'Protein',
    calories_per_100g: 185,
    protein_per_100g: 18.5,
    carbs_per_100g: 2.1,
    fat_per_100g: 10.2,
    fiber_per_100g: 0.8,
    sugar_per_100g: 1.5,
    sodium_per_100g: 420.0,
    serving_size: '10 tusuk (150g)',
    serving_weight: 150,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Soto Ayam',
    name_indonesian: 'Soto Ayam',
    category: 'Soup',
    calories_per_100g: 85,
    protein_per_100g: 8.2,
    carbs_per_100g: 6.5,
    fat_per_100g: 3.8,
    fiber_per_100g: 1.2,
    sugar_per_100g: 0.8,
    sodium_per_100g: 280.0,
    serving_size: '1 mangkuk (300g)',
    serving_weight: 300,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Rendang',
    name_indonesian: 'Rendang',
    category: 'Protein',
    calories_per_100g: 320,
    protein_per_100g: 25.0,
    carbs_per_100g: 2.1,
    fat_per_100g: 22.0,
    fiber_per_100g: 1.8,
    sugar_per_100g: 0.5,
    sodium_per_100g: 450.0,
    serving_size: '1 porsi (100g)',
    serving_weight: 100,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Mie Goreng',
    name_indonesian: 'Mie Goreng',
    category: 'Noodles',
    calories_per_100g: 165,
    protein_per_100g: 5.2,
    carbs_per_100g: 28.0,
    fat_per_100g: 4.8,
    fiber_per_100g: 2.1,
    sugar_per_100g: 1.8,
    sodium_per_100g: 380.0,
    serving_size: '1 porsi (200g)',
    serving_weight: 200,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Bakso',
    name_indonesian: 'Bakso',
    category: 'Protein',
    calories_per_100g: 145,
    protein_per_100g: 12.5,
    carbs_per_100g: 8.2,
    fat_per_100g: 6.8,
    fiber_per_100g: 1.2,
    sugar_per_100g: 0.8,
    sodium_per_100g: 320.0,
    serving_size: '1 mangkuk (250g)',
    serving_weight: 250,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Tempe Goreng',
    name_indonesian: 'Tempe Goreng',
    category: 'Protein',
    calories_per_100g: 195,
    protein_per_100g: 18.2,
    carbs_per_100g: 8.5,
    fat_per_100g: 10.8,
    fiber_per_100g: 1.4,
    sugar_per_100g: 0.5,
    sodium_per_100g: 280.0,
    serving_size: '1 potong (50g)',
    serving_weight: 50,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Tahu Goreng',
    name_indonesian: 'Tahu Goreng',
    category: 'Protein',
    calories_per_100g: 145,
    protein_per_100g: 12.8,
    carbs_per_100g: 4.2,
    fat_per_100g: 8.5,
    fiber_per_100g: 0.3,
    sugar_per_100g: 0.2,
    sodium_per_100g: 320.0,
    serving_size: '1 potong (75g)',
    serving_weight: 75,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // FRUITS
  // ========================================
  {
    name: 'Banana',
    name_indonesian: 'Pisang',
    category: 'Fruits',
    calories_per_100g: 89,
    protein_per_100g: 1.1,
    carbs_per_100g: 23.0,
    fat_per_100g: 0.3,
    fiber_per_100g: 2.6,
    sugar_per_100g: 12.0,
    sodium_per_100g: 1.0,
    serving_size: '1 buah sedang (118g)',
    serving_weight: 118,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Apple',
    name_indonesian: 'Apel',
    category: 'Fruits',
    calories_per_100g: 52,
    protein_per_100g: 0.3,
    carbs_per_100g: 14.0,
    fat_per_100g: 0.2,
    fiber_per_100g: 2.4,
    sugar_per_100g: 10.0,
    sodium_per_100g: 1.0,
    serving_size: '1 buah sedang (182g)',
    serving_weight: 182,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Orange',
    name_indonesian: 'Jeruk',
    category: 'Fruits',
    calories_per_100g: 47,
    protein_per_100g: 0.9,
    carbs_per_100g: 12.0,
    fat_per_100g: 0.1,
    fiber_per_100g: 2.4,
    sugar_per_100g: 9.0,
    sodium_per_100g: 0.0,
    serving_size: '1 buah sedang (131g)',
    serving_weight: 131,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Mango',
    name_indonesian: 'Mangga',
    category: 'Fruits',
    calories_per_100g: 60,
    protein_per_100g: 0.8,
    carbs_per_100g: 15.0,
    fat_per_100g: 0.4,
    fiber_per_100g: 1.6,
    sugar_per_100g: 14.0,
    sodium_per_100g: 1.0,
    serving_size: '1 buah sedang (200g)',
    serving_weight: 200,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Pineapple',
    name_indonesian: 'Nanas',
    category: 'Fruits',
    calories_per_100g: 50,
    protein_per_100g: 0.5,
    carbs_per_100g: 13.0,
    fat_per_100g: 0.1,
    fiber_per_100g: 1.4,
    sugar_per_100g: 10.0,
    sodium_per_100g: 1.0,
    serving_size: '1 cup (165g)',
    serving_weight: 165,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // VEGETABLES
  // ========================================
  {
    name: 'Broccoli',
    name_indonesian: 'Brokoli',
    category: 'Vegetables',
    calories_per_100g: 34,
    protein_per_100g: 2.8,
    carbs_per_100g: 7.0,
    fat_per_100g: 0.4,
    fiber_per_100g: 2.6,
    sugar_per_100g: 1.5,
    sodium_per_100g: 33.0,
    serving_size: '1 cup (91g)',
    serving_weight: 91,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Spinach',
    name_indonesian: 'Bayam',
    category: 'Vegetables',
    calories_per_100g: 23,
    protein_per_100g: 2.9,
    carbs_per_100g: 3.6,
    fat_per_100g: 0.4,
    fiber_per_100g: 2.2,
    sugar_per_100g: 0.4,
    sodium_per_100g: 79.0,
    serving_size: '1 cup (30g)',
    serving_weight: 30,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Carrot',
    name_indonesian: 'Wortel',
    category: 'Vegetables',
    calories_per_100g: 41,
    protein_per_100g: 0.9,
    carbs_per_100g: 9.6,
    fat_per_100g: 0.2,
    fiber_per_100g: 2.8,
    sugar_per_100g: 4.7,
    sodium_per_100g: 69.0,
    serving_size: '1 cup (128g)',
    serving_weight: 128,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Tomato',
    name_indonesian: 'Tomat',
    category: 'Vegetables',
    calories_per_100g: 18,
    protein_per_100g: 0.9,
    carbs_per_100g: 3.9,
    fat_per_100g: 0.2,
    fiber_per_100g: 1.2,
    sugar_per_100g: 2.6,
    sodium_per_100g: 5.0,
    serving_size: '1 buah sedang (123g)',
    serving_weight: 123,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Cucumber',
    name_indonesian: 'Mentimun',
    category: 'Vegetables',
    calories_per_100g: 16,
    protein_per_100g: 0.7,
    carbs_per_100g: 3.6,
    fat_per_100g: 0.1,
    fiber_per_100g: 0.5,
    sugar_per_100g: 1.7,
    sodium_per_100g: 2.0,
    serving_size: '1 buah sedang (300g)',
    serving_weight: 300,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // PROTEIN SOURCES
  // ========================================
  {
    name: 'Chicken Breast',
    name_indonesian: 'Dada Ayam',
    category: 'Protein',
    calories_per_100g: 165,
    protein_per_100g: 31.0,
    carbs_per_100g: 0.0,
    fat_per_100g: 3.6,
    fiber_per_100g: 0.0,
    sugar_per_100g: 0.0,
    sodium_per_100g: 74.0,
    serving_size: '1 potong (174g)',
    serving_weight: 174,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Salmon',
    name_indonesian: 'Ikan Salmon',
    category: 'Protein',
    calories_per_100g: 208,
    protein_per_100g: 20.0,
    carbs_per_100g: 0.0,
    fat_per_100g: 12.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 0.0,
    sodium_per_100g: 59.0,
    serving_size: '1 fillet (154g)',
    serving_weight: 154,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Egg',
    name_indonesian: 'Telur',
    category: 'Protein',
    calories_per_100g: 155,
    protein_per_100g: 13.0,
    carbs_per_100g: 1.1,
    fat_per_100g: 11.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 1.1,
    sodium_per_100g: 124.0,
    serving_size: '1 butir (50g)',
    serving_weight: 50,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Tofu',
    name_indonesian: 'Tahu',
    category: 'Protein',
    calories_per_100g: 76,
    protein_per_100g: 8.1,
    carbs_per_100g: 1.9,
    fat_per_100g: 4.8,
    fiber_per_100g: 0.3,
    sugar_per_100g: 0.6,
    sodium_per_100g: 7.0,
    serving_size: '1 potong (100g)',
    serving_weight: 100,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Tempe',
    name_indonesian: 'Tempe',
    category: 'Protein',
    calories_per_100g: 192,
    protein_per_100g: 20.3,
    carbs_per_100g: 7.6,
    fat_per_100g: 10.8,
    fiber_per_100g: 1.4,
    sugar_per_100g: 0.5,
    sodium_per_100g: 9.0,
    serving_size: '1 potong (100g)',
    serving_weight: 100,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // GRAINS & CARBS
  // ========================================
  {
    name: 'White Rice',
    name_indonesian: 'Nasi Putih',
    category: 'Grains',
    calories_per_100g: 130,
    protein_per_100g: 2.7,
    carbs_per_100g: 28.0,
    fat_per_100g: 0.3,
    fiber_per_100g: 0.4,
    sugar_per_100g: 0.1,
    sodium_per_100g: 1.0,
    serving_size: '1 cup (158g)',
    serving_weight: 158,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Brown Rice',
    name_indonesian: 'Nasi Merah',
    category: 'Grains',
    calories_per_100g: 111,
    protein_per_100g: 2.6,
    carbs_per_100g: 23.0,
    fat_per_100g: 0.9,
    fiber_per_100g: 1.8,
    sugar_per_100g: 0.4,
    sodium_per_100g: 5.0,
    serving_size: '1 cup (195g)',
    serving_weight: 195,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Potato',
    name_indonesian: 'Kentang',
    category: 'Grains',
    calories_per_100g: 77,
    protein_per_100g: 2.0,
    carbs_per_100g: 17.0,
    fat_per_100g: 0.1,
    fiber_per_100g: 2.2,
    sugar_per_100g: 0.8,
    sodium_per_100g: 6.0,
    serving_size: '1 buah sedang (173g)',
    serving_weight: 173,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Sweet Potato',
    name_indonesian: 'Ubi Jalar',
    category: 'Grains',
    calories_per_100g: 86,
    protein_per_100g: 1.6,
    carbs_per_100g: 20.1,
    fat_per_100g: 0.1,
    fiber_per_100g: 3.0,
    sugar_per_100g: 4.2,
    sodium_per_100g: 55.0,
    serving_size: '1 buah sedang (114g)',
    serving_weight: 114,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Bread',
    name_indonesian: 'Roti',
    category: 'Grains',
    calories_per_100g: 265,
    protein_per_100g: 9.0,
    carbs_per_100g: 49.0,
    fat_per_100g: 3.2,
    fiber_per_100g: 2.7,
    sugar_per_100g: 5.0,
    sodium_per_100g: 491.0,
    serving_size: '1 slice (30g)',
    serving_weight: 30,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // DAIRY & ALTERNATIVES
  // ========================================
  {
    name: 'Milk',
    name_indonesian: 'Susu',
    category: 'Dairy',
    calories_per_100g: 42,
    protein_per_100g: 3.4,
    carbs_per_100g: 5.0,
    fat_per_100g: 1.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 5.0,
    sodium_per_100g: 44.0,
    serving_size: '1 cup (244g)',
    serving_weight: 244,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Yogurt',
    name_indonesian: 'Yogurt',
    category: 'Dairy',
    calories_per_100g: 59,
    protein_per_100g: 10.0,
    carbs_per_100g: 3.6,
    fat_per_100g: 0.4,
    fiber_per_100g: 0.0,
    sugar_per_100g: 3.2,
    sodium_per_100g: 36.0,
    serving_size: '1 cup (245g)',
    serving_weight: 245,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Cheese',
    name_indonesian: 'Keju',
    category: 'Dairy',
    calories_per_100g: 402,
    protein_per_100g: 25.0,
    carbs_per_100g: 1.3,
    fat_per_100g: 33.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 0.5,
    sodium_per_100g: 621.0,
    serving_size: '1 slice (28g)',
    serving_weight: 28,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // NUTS & SEEDS
  // ========================================
  {
    name: 'Almonds',
    name_indonesian: 'Kacang Almond',
    category: 'Nuts',
    calories_per_100g: 579,
    protein_per_100g: 21.0,
    carbs_per_100g: 22.0,
    fat_per_100g: 50.0,
    fiber_per_100g: 12.0,
    sugar_per_100g: 4.8,
    sodium_per_100g: 1.0,
    serving_size: '1/4 cup (28g)',
    serving_weight: 28,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Peanuts',
    name_indonesian: 'Kacang Tanah',
    category: 'Nuts',
    calories_per_100g: 567,
    protein_per_100g: 26.0,
    carbs_per_100g: 16.0,
    fat_per_100g: 49.0,
    fiber_per_100g: 8.5,
    sugar_per_100g: 4.7,
    sodium_per_100g: 18.0,
    serving_size: '1/4 cup (36g)',
    serving_weight: 36,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Cashews',
    name_indonesian: 'Kacang Mete',
    category: 'Nuts',
    calories_per_100g: 553,
    protein_per_100g: 18.0,
    carbs_per_100g: 30.0,
    fat_per_100g: 44.0,
    fiber_per_100g: 3.3,
    sugar_per_100g: 5.9,
    sodium_per_100g: 12.0,
    serving_size: '1/4 cup (32g)',
    serving_weight: 32,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // BEVERAGES
  // ========================================
  {
    name: 'Coffee',
    name_indonesian: 'Kopi',
    category: 'Beverages',
    calories_per_100g: 2,
    protein_per_100g: 0.3,
    carbs_per_100g: 0.0,
    fat_per_100g: 0.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 0.0,
    sodium_per_100g: 5.0,
    serving_size: '1 cup (240g)',
    serving_weight: 240,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Tea',
    name_indonesian: 'Teh',
    category: 'Beverages',
    calories_per_100g: 1,
    protein_per_100g: 0.0,
    carbs_per_100g: 0.2,
    fat_per_100g: 0.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 0.0,
    sodium_per_100g: 3.0,
    serving_size: '1 cup (240g)',
    serving_weight: 240,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Orange Juice',
    name_indonesian: 'Jus Jeruk',
    category: 'Beverages',
    calories_per_100g: 45,
    protein_per_100g: 0.7,
    carbs_per_100g: 10.4,
    fat_per_100g: 0.2,
    fiber_per_100g: 0.2,
    sugar_per_100g: 8.4,
    sodium_per_100g: 1.0,
    serving_size: '1 cup (248g)',
    serving_weight: 248,
    is_verified: true,
    source: 'manual'
  },

  // ========================================
  // SNACKS & SWEETS
  // ========================================
  {
    name: 'Potato Chips',
    name_indonesian: 'Keripik Kentang',
    category: 'Snacks',
    calories_per_100g: 536,
    protein_per_100g: 7.0,
    carbs_per_100g: 53.0,
    fat_per_100g: 35.0,
    fiber_per_100g: 4.4,
    sugar_per_100g: 0.2,
    sodium_per_100g: 536.0,
    serving_size: '1 oz (28g)',
    serving_weight: 28,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Chocolate',
    name_indonesian: 'Cokelat',
    category: 'Snacks',
    calories_per_100g: 545,
    protein_per_100g: 4.9,
    carbs_per_100g: 61.0,
    fat_per_100g: 31.0,
    fiber_per_100g: 7.0,
    sugar_per_100g: 48.0,
    sodium_per_100g: 24.0,
    serving_size: '1 bar (100g)',
    serving_weight: 100,
    is_verified: true,
    source: 'manual'
  },
  {
    name: 'Ice Cream',
    name_indonesian: 'Es Krim',
    category: 'Snacks',
    calories_per_100g: 207,
    protein_per_100g: 3.5,
    carbs_per_100g: 24.0,
    fat_per_100g: 11.0,
    fiber_per_100g: 0.0,
    sugar_per_100g: 21.0,
    sodium_per_100g: 80.0,
    serving_size: '1/2 cup (66g)',
    serving_weight: 66,
    is_verified: true,
    source: 'manual'
  }
];

async function seedFoodDatabase() {
  let connection;
  
  try {
    console.log('🌱 Starting food database seeding...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Clear existing food data
    console.log('🗑️  Clearing existing food data...');
    await connection.execute('DELETE FROM food_database');
    console.log('✅ Cleared existing food data');

    // Insert new food data
    console.log('📝 Inserting food data...');
    const insertQuery = `
      INSERT INTO food_database (
        name, name_indonesian, category, calories_per_100g, protein_per_100g, 
        carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
        serving_size, serving_weight, is_verified, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const food of foodData) {
      await connection.execute(insertQuery, [
        food.name,
        food.name_indonesian,
        food.category,
        food.calories_per_100g,
        food.protein_per_100g,
        food.carbs_per_100g,
        food.fat_per_100g,
        food.fiber_per_100g,
        food.sugar_per_100g,
        food.sodium_per_100g,
        food.serving_size,
        food.serving_weight,
        food.is_verified,
        food.source
      ]);
    }

    console.log(`✅ Successfully inserted ${foodData.length} food items`);

    // Verify the data
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM food_database');
    console.log(`📊 Total food items in database: ${countResult[0].count}`);

    // Show categories
    const [categoriesResult] = await connection.execute('SELECT category, COUNT(*) as count FROM food_database GROUP BY category ORDER BY count DESC');
    console.log('\n📋 Food categories:');
    categoriesResult.forEach(row => {
      console.log(`   ${row.category}: ${row.count} items`);
    });

    console.log('\n🎉 Food database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding food database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeding function
if (require.main === module) {
  seedFoodDatabase()
    .then(() => {
      console.log('✅ Food database seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Food database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedFoodDatabase, foodData }; 