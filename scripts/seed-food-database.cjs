const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'pr1k1t1w',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: Number(process.env.DB_PORT || 3306),
};

const baseFoods = [
  {
    baseNameId: 'Jagung Manis',
    baseNameEn: 'Sweet Corn',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 3.4, carbs_per_100g: 21.0, fat_per_100g: 1.5, fiber_per_100g: 2.4, sugar_per_100g: 4.5, sodium_per_100g: 15 },
    methods: ['rebus', 'bakar', 'panggang'],
    seasonings: ['plain', 'bumbu-balado', 'bawang-putih-lada', 'rempah-kari', 'kecap-manis', 'santan', 'lada-hitam', 'bumbu-rica', 'ginseng-kaldu', 'sambal-matah'],
  },
  {
    baseNameId: 'Nasi Putih',
    baseNameEn: 'White Rice',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 2.4, carbs_per_100g: 28.6, fat_per_100g: 0.3, fiber_per_100g: 0.4, sugar_per_100g: 0.1, sodium_per_100g: 2 },
    methods: ['kukus', 'goreng', 'tumis'],
    seasonings: ['plain', 'bumbu-balado', 'bawang-putih-lada', 'rempah-kari', 'kecap-manis', 'santan', 'lada-hitam', 'bumbu-rica', 'ginseng-kaldu', 'saus-tiram'],
  },
  {
    baseNameId: 'Nasi Merah',
    baseNameEn: 'Red Rice',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 2.8, carbs_per_100g: 23.0, fat_per_100g: 1.0, fiber_per_100g: 1.8, sugar_per_100g: 0.5, sodium_per_100g: 3 },
    methods: ['kukus', 'tumis'],
    seasonings: ['plain', 'bumbu-balado', 'bawang-putih-lada', 'rempah-kari', 'kecap-manis', 'santan', 'bumbu-rica', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Singkong',
    baseNameEn: 'Cassava',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.2, carbs_per_100g: 27.8, fat_per_100g: 0.3, fiber_per_100g: 1.8, sugar_per_100g: 1.7, sodium_per_100g: 14 },
    methods: ['rebus', 'panggang', 'goreng'],
    seasonings: ['plain', 'bumbu-balado', 'kecap-manis', 'santan', 'bumbu-rica', 'ginseng-kaldu', 'rempah-kari', 'bawang-putih-lada', 'sambal-matah'],
  },
  {
    baseNameId: 'Kentang',
    baseNameEn: 'Potato',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 2.0, carbs_per_100g: 20.4, fat_per_100g: 0.1, fiber_per_100g: 1.7, sugar_per_100g: 1.2, sodium_per_100g: 7 },
    methods: ['rebus', 'panggang', 'goreng'],
    seasonings: ['plain', 'bumbu-balado', 'bawang-putih-lada', 'rempah-kari', 'kecap-manis', 'lada-hitam', 'bumbu-rica', 'santan', 'saus-tiram'],
  },
  {
    baseNameId: 'Ubi Jalar',
    baseNameEn: 'Sweet Potato',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.6, carbs_per_100g: 21.0, fat_per_100g: 0.1, fiber_per_100g: 3.0, sugar_per_100g: 4.2, sodium_per_100g: 36 },
    methods: ['kukus', 'panggang', 'bakar'],
    seasonings: ['plain', 'bumbu-balado', 'rempah-kari', 'santan', 'kecap-manis', 'bumbu-rica', 'ginseng-kaldu', 'bawang-putih-lada'],
  },
  {
    baseNameId: 'Oatmeal',
    baseNameEn: 'Oatmeal',
    category: 'Staples',
    servingSize: '1 mangkuk (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 3.2, carbs_per_100g: 16.8, fat_per_100g: 2.1, fiber_per_100g: 2.7, sugar_per_100g: 0.8, sodium_per_100g: 6 },
    methods: ['rebus', 'kukus'],
    seasonings: ['plain', 'santan', 'ginseng-kaldu', 'rempah-kari', 'kecap-manis'],
  },
  {
    baseNameId: 'Quinoa',
    baseNameEn: 'Quinoa',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 4.4, carbs_per_100g: 21.3, fat_per_100g: 1.9, fiber_per_100g: 2.8, sugar_per_100g: 0.9, sodium_per_100g: 7 },
    methods: ['rebus', 'kukus'],
    seasonings: ['plain', 'rempah-kari', 'bawang-putih-lada', 'santan', 'ginseng-kaldu', 'lada-hitam'],
  },
  {
    baseNameId: 'Beras Shirataki',
    baseNameEn: 'Shirataki Rice',
    category: 'Staples',
    servingSize: '1 porsi matang (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 0.2, carbs_per_100g: 8.0, fat_per_100g: 0.0, fiber_per_100g: 2.7, sugar_per_100g: 0.0, sodium_per_100g: 4 },
    methods: ['kukus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'ginseng-kaldu', 'saus-tiram', 'sambal-matah'],
  },
  {
    baseNameId: 'Lontong',
    baseNameEn: 'Rice Cake',
    category: 'Staples',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 2.5, carbs_per_100g: 26.0, fat_per_100g: 0.3, fiber_per_100g: 0.8, sugar_per_100g: 0.5, sodium_per_100g: 11 },
    methods: ['kukus', 'goreng'],
    seasonings: ['plain', 'bumbu-balado', 'bawang-putih-lada', 'kecap-manis', 'sambal-matah', 'bumbu-rica', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ketupat',
    baseNameEn: 'Rice Dumpling',
    category: 'Staples',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 3.0, carbs_per_100g: 29.0, fat_per_100g: 0.3, fiber_per_100g: 0.5, sugar_per_100g: 0.4, sodium_per_100g: 12 },
    methods: ['kukus', 'goreng'],
    seasonings: ['plain', 'bumbu-balado', 'kecap-manis', 'santan', 'bumbu-rica', 'rempah-kari', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Mi Jagung',
    baseNameEn: 'Corn Noodles',
    category: 'Staples',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 3.5, carbs_per_100g: 23.0, fat_per_100g: 1.9, fiber_per_100g: 2.0, sugar_per_100g: 1.3, sodium_per_100g: 40 },
    methods: ['rebus', 'goreng', 'tumis'],
    seasonings: ['plain', 'bumbu-balado', 'kecap-manis', 'bawang-putih-lada', 'saus-tiram', 'sambal-matah', 'bumbu-rica', 'rempah-kari', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Bubur Kacang Hijau',
    baseNameEn: 'Mung Bean Porridge',
    category: 'Legumes',
    servingSize: '1 mangkuk (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 5.0, carbs_per_100g: 20.0, fat_per_100g: 1.2, fiber_per_100g: 4.5, sugar_per_100g: 6.8, sodium_per_100g: 20 },
    methods: ['rebus'],
    seasonings: ['plain', 'santan', 'kecap-manis', 'rempah-kari', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ayam Dada',
    baseNameEn: 'Chicken Breast',
    category: 'Protein',
    servingSize: '1 fillet (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 31.0, carbs_per_100g: 0.0, fat_per_100g: 3.6, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 70 },
    methods: ['kukus', 'panggang', 'goreng', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'lada-hitam', 'bumbu-rica', 'sambal-matah', 'jahe-serai', 'rempah-kari', 'kecap-manis', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ayam Paha',
    baseNameEn: 'Chicken Thigh',
    category: 'Protein',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 23.0, carbs_per_100g: 0.0, fat_per_100g: 8.6, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 85 },
    methods: ['panggang', 'goreng', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'lada-hitam', 'bumbu-rica', 'rempah-kari', 'kecap-manis', 'saus-tiram', 'sambal-matah', 'bumbu-balado', 'jahe-serai'],
  },
  {
    baseNameId: 'Ayam Kampung',
    baseNameEn: 'Free-Range Chicken',
    category: 'Protein',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 26.0, carbs_per_100g: 0.0, fat_per_100g: 7.2, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 72 },
    methods: ['rebus', 'panggang', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'lada-hitam', 'bumbu-rica', 'jahe-serai', 'rempah-kari', 'sambal-matah', 'ginseng-kaldu', 'bumbu-balado'],
  },
  {
    baseNameId: 'Tempe',
    baseNameEn: 'Tempeh',
    category: 'Protein',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 19.0, carbs_per_100g: 9.0, fat_per_100g: 10.0, fiber_per_100g: 5.4, sugar_per_100g: 1.2, sodium_per_100g: 12 },
    methods: ['kukus', 'panggang', 'goreng', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'bumbu-rica', 'rempah-kari', 'kecap-manis', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'sambal-matah'],
  },
  {
    baseNameId: 'Tahu Putih',
    baseNameEn: 'Firm Tofu',
    category: 'Protein',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 8.0, carbs_per_100g: 2.0, fat_per_100g: 4.8, fiber_per_100g: 0.3, sugar_per_100g: 0.3, sodium_per_100g: 7 },
    methods: ['kukus', 'goreng', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'kecap-manis', 'santan', 'saus-tiram', 'bumbu-balado', 'bumbu-rica', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Tahu Sutra',
    baseNameEn: 'Silken Tofu',
    category: 'Protein',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 5.3, carbs_per_100g: 1.5, fat_per_100g: 3.5, fiber_per_100g: 0.2, sugar_per_100g: 0.2, sodium_per_100g: 5 },
    methods: ['kukus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'kecap-manis', 'santan', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Daging Sapi Tanpa Lemak',
    baseNameEn: 'Lean Beef',
    category: 'Protein',
    servingSize: '1 potong (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 26.0, carbs_per_100g: 0.0, fat_per_100g: 8.0, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 68 },
    methods: ['rebus', 'panggang', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'lada-hitam', 'bumbu-rica', 'rempah-kari', 'kecap-manis', 'sambal-matah', 'ginseng-kaldu', 'saus-tiram'],
  },
  {
    baseNameId: 'Daging Sapi Giling',
    baseNameEn: 'Ground Beef',
    category: 'Protein',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 24.0, carbs_per_100g: 0.0, fat_per_100g: 12.0, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 75 },
    methods: ['tumis', 'goreng'],
    seasonings: ['plain', 'bawang-putih-lada', 'lada-hitam', 'bumbu-rica', 'rempah-kari', 'kecap-manis', 'saus-tiram', 'sambal-matah', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Daging Kambing',
    baseNameEn: 'Goat Meat',
    category: 'Protein',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 25.0, carbs_per_100g: 0.0, fat_per_100g: 16.0, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 72 },
    methods: ['rebus', 'panggang', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'lada-hitam', 'bumbu-rica', 'rempah-kari', 'saus-tiram', 'sambal-matah', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Telur Ayam',
    baseNameEn: 'Chicken Egg',
    category: 'Protein',
    servingSize: '1 butir (60g) matang (per 100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 12.6, carbs_per_100g: 1.1, fat_per_100g: 10.6, fiber_per_100g: 0.0, sugar_per_100g: 1.1, sodium_per_100g: 124 },
    methods: ['rebus', 'goreng', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'bumbu-rica', 'rempah-kari', 'kecap-manis', 'sambal-matah', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Telur Puyuh',
    baseNameEn: 'Quail Egg',
    category: 'Protein',
    servingSize: '5 butir (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 13.0, carbs_per_100g: 0.4, fat_per_100g: 11.1, fiber_per_100g: 0.0, sugar_per_100g: 0.2, sodium_per_100g: 141 },
    methods: ['rebus', 'goreng'],
    seasonings: ['plain', 'bawang-putih-lada', 'kecap-manis', 'bumbu-rica', 'rempah-kari', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ikan Salmon',
    baseNameEn: 'Salmon',
    category: 'Seafood',
    servingSize: '1 fillet (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 22.0, carbs_per_100g: 0.0, fat_per_100g: 12.0, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 55 },
    methods: ['panggang', 'bakar', 'kukus'],
    seasonings: ['plain', 'bawang-putih-lada', 'lada-hitam', 'bumbu-rica', 'jahe-serai', 'sambal-matah', 'rempah-kari', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ikan Kembung',
    baseNameEn: 'Indian Mackerel',
    category: 'Seafood',
    servingSize: '1 ekor (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 20.0, carbs_per_100g: 0.0, fat_per_100g: 7.0, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 90 },
    methods: ['bakar', 'goreng', 'kukus'],
    seasonings: ['plain', 'bumbu-rica', 'bumbu-balado', 'jahe-serai', 'sambal-matah', 'rempah-kari', 'lada-hitam', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ikan Bandeng',
    baseNameEn: 'Milkfish',
    category: 'Seafood',
    servingSize: '1 ekor (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 20.0, carbs_per_100g: 0.0, fat_per_100g: 9.0, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 82 },
    methods: ['bakar', 'goreng', 'kukus'],
    seasonings: ['plain', 'bumbu-rica', 'bumbu-balado', 'jahe-serai', 'sambal-matah', 'rempah-kari', 'lada-hitam', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ikan Tuna',
    baseNameEn: 'Tuna',
    category: 'Seafood',
    servingSize: '1 fillet (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 29.0, carbs_per_100g: 0.0, fat_per_100g: 0.6, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 45 },
    methods: ['panggang', 'kukus', 'tumis'],
    seasonings: ['plain', 'lada-hitam', 'jahe-serai', 'bumbu-rica', 'rempah-kari', 'sambal-matah', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Udang Windu',
    baseNameEn: 'Tiger Prawn',
    category: 'Seafood',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 24.0, carbs_per_100g: 0.2, fat_per_100g: 0.3, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 111 },
    methods: ['rebus', 'goreng', 'tumis'],
    seasonings: ['plain', 'bumbu-rica', 'jahe-serai', 'sambal-matah', 'lada-hitam', 'rempah-kari', 'saus-tiram', 'bawang-putih-lada', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Cumi-Cumi',
    baseNameEn: 'Squid',
    category: 'Seafood',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 16.0, carbs_per_100g: 3.0, fat_per_100g: 1.4, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 233 },
    methods: ['rebus', 'goreng', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'bumbu-rica', 'sambal-matah', 'rempah-kari', 'jahe-serai', 'saus-tiram', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Ikan Lele',
    baseNameEn: 'Catfish',
    category: 'Seafood',
    servingSize: '1 ekor (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 18.0, carbs_per_100g: 0.0, fat_per_100g: 5.3, fiber_per_100g: 0.0, sugar_per_100g: 0.0, sodium_per_100g: 60 },
    methods: ['goreng', 'bakar', 'tumis'],
    seasonings: ['plain', 'bumbu-rica', 'bumbu-balado', 'lada-hitam', 'sambal-matah', 'jahe-serai', 'saus-tiram', 'ginseng-kaldu', 'rempah-kari'],
  },
  {
    baseNameId: 'Brokoli',
    baseNameEn: 'Broccoli',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 3.7, carbs_per_100g: 11.0, fat_per_100g: 0.6, fiber_per_100g: 3.8, sugar_per_100g: 2.5, sodium_per_100g: 33 },
    methods: ['kukus', 'tumis', 'rebus'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Wortel',
    baseNameEn: 'Carrot',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 0.9, carbs_per_100g: 10.0, fat_per_100g: 0.2, fiber_per_100g: 2.8, sugar_per_100g: 4.7, sodium_per_100g: 69 },
    methods: ['rebus', 'kukus', 'panggang'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Bayam',
    baseNameEn: 'Spinach',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 3.0, carbs_per_100g: 7.0, fat_per_100g: 0.4, fiber_per_100g: 2.6, sugar_per_100g: 0.4, sodium_per_100g: 126 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Kangkung',
    baseNameEn: 'Water Spinach',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 2.7, carbs_per_100g: 5.4, fat_per_100g: 0.4, fiber_per_100g: 2.0, sugar_per_100g: 0.4, sodium_per_100g: 50 },
    methods: ['tumis', 'rebus'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'kecap-manis', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Buncis',
    baseNameEn: 'Green Bean',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.9, carbs_per_100g: 7.9, fat_per_100g: 0.1, fiber_per_100g: 3.2, sugar_per_100g: 3.4, sodium_per_100g: 6 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Kembang Kol',
    baseNameEn: 'Cauliflower',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 2.0, carbs_per_100g: 10.0, fat_per_100g: 1.9, fiber_per_100g: 2.5, sugar_per_100g: 2.0, sodium_per_100g: 30 },
    methods: ['panggang', 'tumis', 'rebus'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Terong Ungu',
    baseNameEn: 'Eggplant',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.0, carbs_per_100g: 8.7, fat_per_100g: 0.2, fiber_per_100g: 2.5, sugar_per_100g: 3.2, sodium_per_100g: 3 },
    methods: ['bakar', 'tumis', 'panggang'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis', 'bumbu-rica'],
  },
  {
    baseNameId: 'Paprika Merah',
    baseNameEn: 'Red Bell Pepper',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.0, carbs_per_100g: 6.0, fat_per_100g: 0.3, fiber_per_100g: 2.1, sugar_per_100g: 4.2, sodium_per_100g: 2 },
    methods: ['panggang', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Jamur Kancing',
    baseNameEn: 'Button Mushroom',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 3.5, carbs_per_100g: 4.6, fat_per_100g: 2.1, fiber_per_100g: 2.3, sugar_per_100g: 2.0, sodium_per_100g: 18 },
    methods: ['tumis', 'panggang', 'rebus'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Sawi Putih',
    baseNameEn: 'Napa Cabbage',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.5, carbs_per_100g: 3.2, fat_per_100g: 0.2, fiber_per_100g: 1.2, sugar_per_100g: 1.5, sodium_per_100g: 21 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Kol Ungu',
    baseNameEn: 'Purple Cabbage',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.4, carbs_per_100g: 7.0, fat_per_100g: 0.2, fiber_per_100g: 2.5, sugar_per_100g: 3.2, sodium_per_100g: 28 },
    methods: ['rebus', 'tumis', 'panggang'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Labu Siam',
    baseNameEn: 'Chayote',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 0.7, carbs_per_100g: 4.5, fat_per_100g: 0.2, fiber_per_100g: 1.2, sugar_per_100g: 2.5, sodium_per_100g: 2 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Daun Singkong',
    baseNameEn: 'Cassava Leaves',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 4.0, carbs_per_100g: 7.0, fat_per_100g: 0.6, fiber_per_100g: 5.1, sugar_per_100g: 0.5, sodium_per_100g: 45 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Kacang Panjang',
    baseNameEn: 'Yardlong Bean',
    category: 'Vegetables',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 2.8, carbs_per_100g: 7.9, fat_per_100g: 0.4, fiber_per_100g: 2.7, sugar_per_100g: 3.4, sodium_per_100g: 10 },
    methods: ['tumis', 'rebus'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
  {
    baseNameId: 'Talas',
    baseNameEn: 'Taro',
    category: 'Staples',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 1.5, carbs_per_100g: 27.0, fat_per_100g: 0.2, fiber_per_100g: 4.1, sugar_per_100g: 1.5, sodium_per_100g: 11 },
    methods: ['rebus', 'goreng', 'panggang'],
    seasonings: ['plain', 'bumbu-balado', 'bawang-putih-lada', 'kecap-manis', 'rempah-kari', 'santan', 'bumbu-rica', 'ginseng-kaldu', 'sambal-matah'],
  },
  {
    baseNameId: 'Kacang Merah',
    baseNameEn: 'Red Bean',
    category: 'Legumes',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 8.7, carbs_per_100g: 22.8, fat_per_100g: 0.6, fiber_per_100g: 7.4, sugar_per_100g: 1.2, sodium_per_100g: 5 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'santan', 'rempah-kari', 'kecap-manis', 'bawang-putih-lada', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Kacang Hijau',
    baseNameEn: 'Mung Bean',
    category: 'Legumes',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 7.0, carbs_per_100g: 19.0, fat_per_100g: 0.6, fiber_per_100g: 7.6, sugar_per_100g: 4.1, sodium_per_100g: 7 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'santan', 'rempah-kari', 'kecap-manis', 'bawang-putih-lada', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Kacang Hitam',
    baseNameEn: 'Black Bean',
    category: 'Legumes',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 8.9, carbs_per_100g: 23.7, fat_per_100g: 0.5, fiber_per_100g: 8.7, sugar_per_100g: 0.6, sodium_per_100g: 6 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'santan', 'rempah-kari', 'kecap-manis', 'bawang-putih-lada', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Kacang Polong',
    baseNameEn: 'Green Pea',
    category: 'Legumes',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 5.4, carbs_per_100g: 14.5, fat_per_100g: 0.4, fiber_per_100g: 5.1, sugar_per_100g: 5.7, sodium_per_100g: 5 },
    methods: ['rebus', 'tumis'],
    seasonings: ['plain', 'santan', 'rempah-kari', 'kecap-manis', 'bawang-putih-lada', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu'],
  },
  {
    baseNameId: 'Edamame',
    baseNameEn: 'Edamame',
    category: 'Legumes',
    servingSize: '1 porsi (100g)',
    servingWeight: 100,
    nutritionPer100g: { protein_per_100g: 13.0, carbs_per_100g: 9.9, fat_per_100g: 5.2, fiber_per_100g: 5.2, sugar_per_100g: 2.5, sodium_per_100g: 6 },
    methods: ['rebus', 'kukus', 'tumis'],
    seasonings: ['plain', 'bawang-putih-lada', 'rempah-kari', 'santan', 'saus-tiram', 'bumbu-balado', 'ginseng-kaldu', 'kecap-manis'],
  },
];

const cookingMethods = {
  rebus: {
    id: 'rebus',
    nameId: 'Rebus',
    nameEn: 'Boiled',
    adjustments: {
      multipliers: {
        protein_per_100g: 0.98,
        carbs_per_100g: 0.99,
        fat_per_100g: 0.95,
        fiber_per_100g: 1.0,
        sugar_per_100g: 0.98,
        sodium_per_100g: 0.9,
      },
    },
  },
  kukus: {
    id: 'kukus',
    nameId: 'Kukus',
    nameEn: 'Steamed',
    adjustments: {
      multipliers: {
        protein_per_100g: 1.0,
        carbs_per_100g: 0.99,
        fat_per_100g: 0.96,
        fiber_per_100g: 1.04,
        sugar_per_100g: 0.97,
        sodium_per_100g: 0.92,
      },
    },
  },
  panggang: {
    id: 'panggang',
    nameId: 'Panggang',
    nameEn: 'Roasted',
    adjustments: {
      multipliers: {
        protein_per_100g: 1.05,
        carbs_per_100g: 0.98,
        fat_per_100g: 1.07,
        fiber_per_100g: 0.97,
        sugar_per_100g: 1.04,
        sodium_per_100g: 1.08,
      },
    },
  },
  bakar: {
    id: 'bakar',
    nameId: 'Bakar',
    nameEn: 'Grilled',
    adjustments: {
      multipliers: {
        protein_per_100g: 1.03,
        carbs_per_100g: 0.97,
        fat_per_100g: 1.12,
        fiber_per_100g: 0.95,
        sugar_per_100g: 1.05,
        sodium_per_100g: 1.12,
      },
    },
  },
  tumis: {
    id: 'tumis',
    nameId: 'Tumis',
    nameEn: 'Stir-fried',
    adjustments: {
      multipliers: {
        protein_per_100g: 1.0,
        carbs_per_100g: 0.98,
        fat_per_100g: 1.25,
        fiber_per_100g: 0.92,
        sugar_per_100g: 1.02,
        sodium_per_100g: 1.18,
      },
    },
  },
  goreng: {
    id: 'goreng',
    nameId: 'Goreng',
    nameEn: 'Fried',
    adjustments: {
      multipliers: {
        protein_per_100g: 0.97,
        carbs_per_100g: 0.95,
        fat_per_100g: 1.45,
        fiber_per_100g: 0.9,
        sugar_per_100g: 1.05,
        sodium_per_100g: 1.32,
      },
    },
  },
};

const portionVariants = [
  { id: 'snack', suffixEn: 'Snack Portion', suffixId: 'Porsi Camilan', weight: 60 },
  { id: 'small', suffixEn: 'Small Portion', suffixId: 'Porsi Kecil', weight: 80 },
  { id: 'regular', suffixEn: '', suffixId: '', weight: 100 },
  { id: 'large', suffixEn: 'Large Portion', suffixId: 'Porsi Besar', weight: 140 },
  { id: 'sharing', suffixEn: 'Sharing Portion', suffixId: 'Porsi Berbagi', weight: 180 },
  { id: 'meal-prep', suffixEn: 'Meal Prep Portion', suffixId: 'Porsi Bekal', weight: 220 },
  { id: 'high-energy', suffixEn: 'High Energy Portion', suffixId: 'Porsi Energi', weight: 260 },
  { id: 'family', suffixEn: 'Family Portion', suffixId: 'Porsi Keluarga', weight: 320 },
];

const seasoningItems = [
  {
    nameEn: 'Balado Spice Mix',
    nameId: 'Bumbu Balado',
    category: 'Seasoning',
    servingSize: '1 sendok makan (12g)',
    servingWeight: 12,
    nutritionPer100g: {
      protein_per_100g: 5.2,
      carbs_per_100g: 54.1,
      fat_per_100g: 14.3,
      fiber_per_100g: 11.8,
      sugar_per_100g: 18.6,
      sodium_per_100g: 1480,
    },
  },
  {
    nameEn: 'Rica-Rica Spice Mix',
    nameId: 'Bumbu Rica-Rica',
    category: 'Seasoning',
    servingSize: '1 sendok makan (12g)',
    servingWeight: 12,
    nutritionPer100g: {
      protein_per_100g: 4.1,
      carbs_per_100g: 46.5,
      fat_per_100g: 7.2,
      fiber_per_100g: 9.8,
      sugar_per_100g: 10.4,
      sodium_per_100g: 1320,
    },
  },
  {
    nameEn: 'Curry Spice Mix',
    nameId: 'Bumbu Kari',
    category: 'Seasoning',
    servingSize: '1 sendok makan (10g)',
    servingWeight: 10,
    nutritionPer100g: {
      protein_per_100g: 12.6,
      carbs_per_100g: 47.8,
      fat_per_100g: 14.4,
      fiber_per_100g: 23.7,
      sugar_per_100g: 6.1,
      sodium_per_100g: 890,
    },
  },
  {
    nameEn: 'Garlic Pepper Rub',
    nameId: 'Bumbu Bawang Putih & Lada',
    category: 'Seasoning',
    servingSize: '1 sendok teh (8g)',
    servingWeight: 8,
    nutritionPer100g: {
      protein_per_100g: 11.0,
      carbs_per_100g: 57.0,
      fat_per_100g: 2.2,
      fiber_per_100g: 8.7,
      sugar_per_100g: 5.4,
      sodium_per_100g: 1260,
    },
  },
  {
    nameEn: 'Sweet Soy Marinade Powder',
    nameId: 'Bumbu Marinasi Kecap Manis',
    category: 'Seasoning',
    servingSize: '1 sendok makan (15g)',
    servingWeight: 15,
    nutritionPer100g: {
      protein_per_100g: 5.5,
      carbs_per_100g: 60.2,
      fat_per_100g: 4.1,
      fiber_per_100g: 6.3,
      sugar_per_100g: 28.5,
      sodium_per_100g: 1420,
    },
  },
  {
    nameEn: 'All-Purpose Stir Fry Mix',
    nameId: 'Bumbu Tumis Serbaguna',
    category: 'Seasoning',
    servingSize: '1 sendok makan (10g)',
    servingWeight: 10,
    nutritionPer100g: {
      protein_per_100g: 8.4,
      carbs_per_100g: 41.6,
      fat_per_100g: 6.5,
      fiber_per_100g: 7.4,
      sugar_per_100g: 9.1,
      sodium_per_100g: 1180,
    },
  },
  {
    nameEn: 'Stew Spice Mix',
    nameId: 'Bumbu Sop & Sayur',
    category: 'Seasoning',
    servingSize: '1 sendok teh (6g)',
    servingWeight: 6,
    nutritionPer100g: {
      protein_per_100g: 7.5,
      carbs_per_100g: 45.6,
      fat_per_100g: 4.3,
      fiber_per_100g: 12.4,
      sugar_per_100g: 9.6,
      sodium_per_100g: 960,
    },
  },
  {
    nameEn: 'Roasted Chicken Blend',
    nameId: 'Bumbu Panggang Ayam',
    category: 'Seasoning',
    servingSize: '1 sendok makan (12g)',
    servingWeight: 12,
    nutritionPer100g: {
      protein_per_100g: 13.4,
      carbs_per_100g: 34.1,
      fat_per_100g: 7.8,
      fiber_per_100g: 8.9,
      sugar_per_100g: 5.1,
      sodium_per_100g: 980,
    },
  },
  {
    nameEn: 'Beef Rendang Spice',
    nameId: 'Bumbu Rendang Sapi',
    category: 'Seasoning',
    servingSize: '1 sendok makan (12g)',
    servingWeight: 12,
    nutritionPer100g: {
      protein_per_100g: 6.3,
      carbs_per_100g: 39.8,
      fat_per_100g: 15.6,
      fiber_per_100g: 11.0,
      sugar_per_100g: 8.7,
      sodium_per_100g: 1325,
    },
  },
  {
    nameEn: 'Grilled Fish Seasoning',
    nameId: 'Bumbu Bakar Ikan',
    category: 'Seasoning',
    servingSize: '1 sendok makan (15g)',
    servingWeight: 15,
    nutritionPer100g: {
      protein_per_100g: 9.5,
      carbs_per_100g: 36.2,
      fat_per_100g: 8.4,
      fiber_per_100g: 10.2,
      sugar_per_100g: 6.5,
      sodium_per_100g: 1240,
    },
  },
  {
    nameEn: 'Herbal Broth Powder',
    nameId: 'Kaldu Herbal',
    category: 'Seasoning',
    servingSize: '1 sendok teh (5g)',
    servingWeight: 5,
    nutritionPer100g: {
      protein_per_100g: 12.8,
      carbs_per_100g: 38.4,
      fat_per_100g: 6.9,
      fiber_per_100g: 5.1,
      sugar_per_100g: 6.0,
      sodium_per_100g: 4900,
    },
  },
  {
    nameEn: 'White Pepper Powder',
    nameId: 'Lada Putih Bubuk',
    category: 'Seasoning',
    servingSize: '1 sendok teh (3g)',
    servingWeight: 3,
    nutritionPer100g: {
      protein_per_100g: 10.4,
      carbs_per_100g: 64.8,
      fat_per_100g: 3.3,
      fiber_per_100g: 25.3,
      sugar_per_100g: 0.6,
      sodium_per_100g: 16,
    },
  },
  {
    nameEn: 'Turmeric Powder',
    nameId: 'Kunyit Bubuk',
    category: 'Seasoning',
    servingSize: '1 sendok teh (3g)',
    servingWeight: 3,
    nutritionPer100g: {
      protein_per_100g: 9.7,
      carbs_per_100g: 67.1,
      fat_per_100g: 3.3,
      fiber_per_100g: 22.7,
      sugar_per_100g: 3.2,
      sodium_per_100g: 38,
    },
  },
  {
    nameEn: 'Coriander Powder',
    nameId: 'Ketumbar Bubuk',
    category: 'Seasoning',
    servingSize: '1 sendok teh (3g)',
    servingWeight: 3,
    nutritionPer100g: {
      protein_per_100g: 12.4,
      carbs_per_100g: 54.0,
      fat_per_100g: 17.8,
      fiber_per_100g: 41.9,
      sugar_per_100g: 0.9,
      sodium_per_100g: 57,
    },
  },
  {
    nameEn: 'Ginger Powder',
    nameId: 'Jahe Bubuk',
    category: 'Seasoning',
    servingSize: '1 sendok teh (3g)',
    servingWeight: 3,
    nutritionPer100g: {
      protein_per_100g: 9.1,
      carbs_per_100g: 70.8,
      fat_per_100g: 4.1,
      fiber_per_100g: 12.1,
      sugar_per_100g: 3.4,
      sodium_per_100g: 27,
    },
  },
  {
    nameEn: 'Smoked Chili Flakes',
    nameId: 'Cabai Kering Asap',
    category: 'Seasoning',
    servingSize: '1 sendok teh (3g)',
    servingWeight: 3,
    nutritionPer100g: {
      protein_per_100g: 12.0,
      carbs_per_100g: 56.6,
      fat_per_100g: 17.3,
      fiber_per_100g: 34.8,
      sugar_per_100g: 7.4,
      sodium_per_100g: 90,
    },
  },
  {
    nameEn: 'Lemongrass Powder',
    nameId: 'Serai Bubuk',
    category: 'Seasoning',
    servingSize: '1 sendok teh (2g)',
    servingWeight: 2,
    nutritionPer100g: {
      protein_per_100g: 5.6,
      carbs_per_100g: 49.2,
      fat_per_100g: 0.5,
      fiber_per_100g: 12.4,
      sugar_per_100g: 1.8,
      sodium_per_100g: 16,
    },
  },
  {
    nameEn: 'Ground Bay Leaf',
    nameId: 'Daun Salam Bubuk',
    category: 'Seasoning',
    servingSize: '1 sendok teh (2g)',
    servingWeight: 2,
    nutritionPer100g: {
      protein_per_100g: 7.6,
      carbs_per_100g: 72.0,
      fat_per_100g: 8.4,
      fiber_per_100g: 26.3,
      sugar_per_100g: 4.3,
      sodium_per_100g: 23,
    },
  },
  {
    nameEn: 'Roasted Peanut Seasoning',
    nameId: 'Bumbu Kacang Sangrai',
    category: 'Seasoning',
    servingSize: '1 sendok makan (15g)',
    servingWeight: 15,
    nutritionPer100g: {
      protein_per_100g: 19.1,
      carbs_per_100g: 32.5,
      fat_per_100g: 38.2,
      fiber_per_100g: 9.6,
      sugar_per_100g: 12.4,
      sodium_per_100g: 880,
    },
  },
  {
    nameEn: 'Sweet and Sour Glaze Mix',
    nameId: 'Bumbu Saus Asam Manis',
    category: 'Seasoning',
    servingSize: '1 sendok makan (14g)',
    servingWeight: 14,
    nutritionPer100g: {
      protein_per_100g: 3.2,
      carbs_per_100g: 65.4,
      fat_per_100g: 2.6,
      fiber_per_100g: 3.9,
      sugar_per_100g: 46.5,
      sodium_per_100g: 1245,
    },
  },
];

const sauceItems = [
  {
    nameEn: 'Sweet Soy Sauce',
    nameId: 'Kecap Manis',
    category: 'Sauce',
    servingSize: '1 sendok makan (15ml)',
    servingWeight: 18,
    nutritionPer100g: {
      protein_per_100g: 6.5,
      carbs_per_100g: 56.8,
      fat_per_100g: 0.5,
      fiber_per_100g: 1.8,
      sugar_per_100g: 45.2,
      sodium_per_100g: 2680,
    },
  },
  {
    nameEn: 'Light Soy Sauce',
    nameId: 'Kecap Asin',
    category: 'Sauce',
    servingSize: '1 sendok makan (15ml)',
    servingWeight: 17,
    nutritionPer100g: {
      protein_per_100g: 8.1,
      carbs_per_100g: 5.6,
      fat_per_100g: 0.3,
      fiber_per_100g: 0.2,
      sugar_per_100g: 4.0,
      sodium_per_100g: 5740,
    },
  },
  {
    nameEn: 'Oyster Sauce',
    nameId: 'Saus Tiram',
    category: 'Sauce',
    servingSize: '1 sendok makan (16g)',
    servingWeight: 16,
    nutritionPer100g: {
      protein_per_100g: 5.5,
      carbs_per_100g: 23.2,
      fat_per_100g: 1.0,
      fiber_per_100g: 1.7,
      sugar_per_100g: 17.2,
      sodium_per_100g: 4800,
    },
  },
  {
    nameEn: 'Black Pepper Sauce',
    nameId: 'Saus Lada Hitam',
    category: 'Sauce',
    servingSize: '1 sendok makan (20g)',
    servingWeight: 20,
    nutritionPer100g: {
      protein_per_100g: 4.2,
      carbs_per_100g: 18.4,
      fat_per_100g: 2.3,
      fiber_per_100g: 2.1,
      sugar_per_100g: 9.6,
      sodium_per_100g: 3580,
    },
  },
  {
    nameEn: 'Teriyaki Sauce',
    nameId: 'Saus Teriyaki',
    category: 'Sauce',
    servingSize: '1 sendok makan (16g)',
    servingWeight: 16,
    nutritionPer100g: {
      protein_per_100g: 5.1,
      carbs_per_100g: 31.7,
      fat_per_100g: 0.4,
      fiber_per_100g: 1.1,
      sugar_per_100g: 26.0,
      sodium_per_100g: 3950,
    },
  },
  {
    nameEn: 'Barbecue Sauce',
    nameId: 'Saus Barbekyu',
    category: 'Sauce',
    servingSize: '1 sendok makan (17g)',
    servingWeight: 17,
    nutritionPer100g: {
      protein_per_100g: 3.2,
      carbs_per_100g: 41.2,
      fat_per_100g: 1.2,
      fiber_per_100g: 1.8,
      sugar_per_100g: 33.6,
      sodium_per_100g: 1760,
    },
  },
  {
    nameEn: 'Chili Sauce',
    nameId: 'Saus Cabe',
    category: 'Sauce',
    servingSize: '1 sendok makan (18g)',
    servingWeight: 18,
    nutritionPer100g: {
      protein_per_100g: 1.8,
      carbs_per_100g: 27.4,
      fat_per_100g: 0.7,
      fiber_per_100g: 2.4,
      sugar_per_100g: 20.5,
      sodium_per_100g: 1760,
    },
  },
  {
    nameEn: 'Sambal Oelek',
    nameId: 'Sambal Oelek',
    category: 'Sauce',
    servingSize: '1 sendok makan (18g)',
    servingWeight: 18,
    nutritionPer100g: {
      protein_per_100g: 3.9,
      carbs_per_100g: 16.5,
      fat_per_100g: 6.4,
      fiber_per_100g: 4.2,
      sugar_per_100g: 5.5,
      sodium_per_100g: 2280,
    },
  },
  {
    nameEn: 'Sambal Terasi',
    nameId: 'Sambal Terasi',
    category: 'Sauce',
    servingSize: '1 sendok makan (18g)',
    servingWeight: 18,
    nutritionPer100g: {
      protein_per_100g: 5.8,
      carbs_per_100g: 21.7,
      fat_per_100g: 9.3,
      fiber_per_100g: 3.6,
      sugar_per_100g: 9.4,
      sodium_per_100g: 2540,
    },
  },
  {
    nameEn: 'Tomato Sambal',
    nameId: 'Sambal Tomat',
    category: 'Sauce',
    servingSize: '1 sendok makan (18g)',
    servingWeight: 18,
    nutritionPer100g: {
      protein_per_100g: 2.2,
      carbs_per_100g: 19.7,
      fat_per_100g: 4.2,
      fiber_per_100g: 3.1,
      sugar_per_100g: 12.4,
      sodium_per_100g: 1660,
    },
  },
  {
    nameEn: 'Peanut Sauce',
    nameId: 'Saus Kacang',
    category: 'Sauce',
    servingSize: '2 sendok makan (30g)',
    servingWeight: 30,
    nutritionPer100g: {
      protein_per_100g: 14.8,
      carbs_per_100g: 24.1,
      fat_per_100g: 42.3,
      fiber_per_100g: 6.9,
      sugar_per_100g: 16.0,
      sodium_per_100g: 960,
    },
  },
  {
    nameEn: 'Garlic Butter Sauce',
    nameId: 'Saus Mentega Bawang',
    category: 'Sauce',
    servingSize: '1 sendok makan (20g)',
    servingWeight: 20,
    nutritionPer100g: {
      protein_per_100g: 2.1,
      carbs_per_100g: 9.3,
      fat_per_100g: 47.8,
      fiber_per_100g: 0.2,
      sugar_per_100g: 4.8,
      sodium_per_100g: 1280,
    },
  },
  {
    nameEn: 'Creamy Mushroom Sauce',
    nameId: 'Saus Jamur Krim',
    category: 'Sauce',
    servingSize: '1 sendok makan (25g)',
    servingWeight: 25,
    nutritionPer100g: {
      protein_per_100g: 4.3,
      carbs_per_100g: 9.7,
      fat_per_100g: 24.8,
      fiber_per_100g: 1.6,
      sugar_per_100g: 5.1,
      sodium_per_100g: 920,
    },
  },
  {
    nameEn: 'Thousand Island Dressing',
    nameId: 'Saus Thousand Island',
    category: 'Sauce',
    servingSize: '2 sendok makan (30g)',
    servingWeight: 30,
    nutritionPer100g: {
      protein_per_100g: 2.6,
      carbs_per_100g: 16.4,
      fat_per_100g: 42.8,
      fiber_per_100g: 0.9,
      sugar_per_100g: 12.6,
      sodium_per_100g: 910,
    },
  },
  {
    nameEn: 'Yogurt Salad Dressing',
    nameId: 'Saus Salad Yogurt',
    category: 'Sauce',
    servingSize: '2 sendok makan (30g)',
    servingWeight: 30,
    nutritionPer100g: {
      protein_per_100g: 5.2,
      carbs_per_100g: 13.4,
      fat_per_100g: 24.6,
      fiber_per_100g: 0.6,
      sugar_per_100g: 11.2,
      sodium_per_100g: 820,
    },
  },
  {
    nameEn: 'Spicy Coconut Sauce',
    nameId: 'Saus Santan Pedas',
    category: 'Sauce',
    servingSize: '1 sendok makan (22g)',
    servingWeight: 22,
    nutritionPer100g: {
      protein_per_100g: 3.6,
      carbs_per_100g: 15.7,
      fat_per_100g: 34.1,
      fiber_per_100g: 4.4,
      sugar_per_100g: 7.4,
      sodium_per_100g: 990,
    },
  },
];

const beverageItems = [
  {
    nameEn: 'Hot Sweet Tea',
    nameId: 'Teh Manis Hangat',
    category: 'Beverage',
    servingSize: '1 gelas (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 0,
      carbs_per_100g: 10.5,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      sugar_per_100g: 10.2,
      sodium_per_100g: 6,
    },
  },
  {
    nameEn: 'Iced Sweet Tea',
    nameId: 'Es Teh Manis',
    category: 'Beverage',
    servingSize: '1 gelas (300ml)',
    servingWeight: 300,
    nutritionPer100g: {
      protein_per_100g: 0,
      carbs_per_100g: 8.8,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      sugar_per_100g: 8.4,
      sodium_per_100g: 5,
    },
  },
  {
    nameEn: 'Unsweetened Black Tea',
    nameId: 'Teh Tawar Hangat',
    category: 'Beverage',
    servingSize: '1 cangkir (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 0,
      carbs_per_100g: 0,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      sugar_per_100g: 0,
      sodium_per_100g: 4,
    },
  },
  {
    nameEn: 'Green Tea',
    nameId: 'Teh Hijau Hangat',
    category: 'Beverage',
    servingSize: '1 cangkir (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 0,
      carbs_per_100g: 0,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      sugar_per_100g: 0,
      sodium_per_100g: 3,
    },
  },
  {
    nameEn: 'Black Coffee',
    nameId: 'Kopi Hitam',
    category: 'Beverage',
    servingSize: '1 cangkir (200ml)',
    servingWeight: 200,
    nutritionPer100g: {
      protein_per_100g: 0.2,
      carbs_per_100g: 0,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      sugar_per_100g: 0,
      sodium_per_100g: 4,
    },
  },
  {
    nameEn: 'Tubruk Coffee with Sugar',
    nameId: 'Kopi Tubruk Gula',
    category: 'Beverage',
    servingSize: '1 cangkir (200ml)',
    servingWeight: 200,
    nutritionPer100g: {
      protein_per_100g: 0.2,
      carbs_per_100g: 7.5,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      sugar_per_100g: 7.2,
      sodium_per_100g: 5,
    },
  },
  {
    nameEn: 'Coffee with Milk',
    nameId: 'Kopi Susu',
    category: 'Beverage',
    servingSize: '1 gelas (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 1.4,
      carbs_per_100g: 8.4,
      fat_per_100g: 1.6,
      fiber_per_100g: 0,
      sugar_per_100g: 7.2,
      sodium_per_100g: 58,
    },
  },
  {
    nameEn: 'Cafe Latte',
    nameId: 'Kopi Latte',
    category: 'Beverage',
    servingSize: '1 gelas (300ml)',
    servingWeight: 300,
    nutritionPer100g: {
      protein_per_100g: 1.9,
      carbs_per_100g: 7.8,
      fat_per_100g: 1.8,
      fiber_per_100g: 0,
      sugar_per_100g: 7.0,
      sodium_per_100g: 52,
    },
  },
  {
    nameEn: 'Cappuccino',
    nameId: 'Kopi Cappuccino',
    category: 'Beverage',
    servingSize: '1 cangkir (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 2.0,
      carbs_per_100g: 8.5,
      fat_per_100g: 2.4,
      fiber_per_100g: 0,
      sugar_per_100g: 7.6,
      sodium_per_100g: 63,
    },
  },
  {
    nameEn: 'Mocha Coffee',
    nameId: 'Kopi Mocha',
    category: 'Beverage',
    servingSize: '1 gelas (300ml)',
    servingWeight: 300,
    nutritionPer100g: {
      protein_per_100g: 2.1,
      carbs_per_100g: 13.8,
      fat_per_100g: 2.9,
      fiber_per_100g: 0.6,
      sugar_per_100g: 11.2,
      sodium_per_100g: 72,
    },
  },
  {
    nameEn: 'Sweetened Milk Tea',
    nameId: 'Teh Tarik',
    category: 'Beverage',
    servingSize: '1 gelas (280ml)',
    servingWeight: 280,
    nutritionPer100g: {
      protein_per_100g: 1.7,
      carbs_per_100g: 11.4,
      fat_per_100g: 1.8,
      fiber_per_100g: 0,
      sugar_per_100g: 10.2,
      sodium_per_100g: 44,
    },
  },
  {
    nameEn: 'Iced Lemon Tea',
    nameId: 'Es Teh Lemon',
    category: 'Beverage',
    servingSize: '1 gelas (300ml)',
    servingWeight: 300,
    nutritionPer100g: {
      protein_per_100g: 0,
      carbs_per_100g: 9.6,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      sugar_per_100g: 8.8,
      sodium_per_100g: 5,
    },
  },
  {
    nameEn: 'Fresh Orange Juice',
    nameId: 'Jus Jeruk Segar',
    category: 'Beverage',
    servingSize: '1 gelas (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 0.8,
      carbs_per_100g: 11.3,
      fat_per_100g: 0.2,
      fiber_per_100g: 0.4,
      sugar_per_100g: 9.2,
      sodium_per_100g: 2,
    },
  },
  {
    nameEn: 'Guava Juice',
    nameId: 'Jus Jambu Merah',
    category: 'Beverage',
    servingSize: '1 gelas (250ml)',
    servingWeight: 250,
    nutritionPer100g: {
      protein_per_100g: 0.6,
      carbs_per_100g: 14.0,
      fat_per_100g: 0.3,
      fiber_per_100g: 1.8,
      sugar_per_100g: 12.4,
      sodium_per_100g: 3,
    },
  },
  {
    nameEn: 'Avocado Juice with Milk',
    nameId: 'Jus Alpukat Susu',
    category: 'Beverage',
    servingSize: '1 gelas (280ml)',
    servingWeight: 280,
    nutritionPer100g: {
      protein_per_100g: 2.4,
      carbs_per_100g: 13.6,
      fat_per_100g: 6.8,
      fiber_per_100g: 3.4,
      sugar_per_100g: 10.2,
      sodium_per_100g: 38,
    },
  },
  {
    nameEn: 'Banana Smoothie',
    nameId: 'Smoothie Pisang',
    category: 'Beverage',
    servingSize: '1 gelas (300ml)',
    servingWeight: 300,
    nutritionPer100g: {
      protein_per_100g: 2.8,
      carbs_per_100g: 17.4,
      fat_per_100g: 2.3,
      fiber_per_100g: 2.6,
      sugar_per_100g: 11.8,
      sodium_per_100g: 36,
    },
  },
  {
    nameEn: 'Berry Smoothie',
    nameId: 'Smoothie Berry',
    category: 'Beverage',
    servingSize: '1 gelas (300ml)',
    servingWeight: 300,
    nutritionPer100g: {
      protein_per_100g: 2.5,
      carbs_per_100g: 15.2,
      fat_per_100g: 1.6,
      fiber_per_100g: 3.8,
      sugar_per_100g: 10.4,
      sodium_per_100g: 28,
    },
  },
  {
    nameEn: 'Chocolate Milk',
    nameId: 'Susu Cokelat',
    category: 'Beverage',
    servingSize: '1 gelas (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 3.4,
      carbs_per_100g: 12.6,
      fat_per_100g: 3.2,
      fiber_per_100g: 0.8,
      sugar_per_100g: 10.8,
      sodium_per_100g: 60,
    },
  },
  {
    nameEn: 'Plain Milk',
    nameId: 'Susu Putih',
    category: 'Beverage',
    servingSize: '1 gelas (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 3.3,
      carbs_per_100g: 4.8,
      fat_per_100g: 3.6,
      fiber_per_100g: 0,
      sugar_per_100g: 4.8,
      sodium_per_100g: 44,
    },
  },
  {
    nameEn: 'Soy Milk',
    nameId: 'Susu Kedelai',
    category: 'Beverage',
    servingSize: '1 gelas (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 3.4,
      carbs_per_100g: 6.0,
      fat_per_100g: 1.8,
      fiber_per_100g: 1.2,
      sugar_per_100g: 5.2,
      sodium_per_100g: 38,
    },
  },
  {
    nameEn: 'Coconut Water',
    nameId: 'Air Kelapa',
    category: 'Beverage',
    servingSize: '1 gelas (250ml)',
    servingWeight: 250,
    nutritionPer100g: {
      protein_per_100g: 0.7,
      carbs_per_100g: 5.5,
      fat_per_100g: 0.2,
      fiber_per_100g: 1.1,
      sugar_per_100g: 4.8,
      sodium_per_100g: 55,
    },
  },
  {
    nameEn: 'Lemon Infused Water',
    nameId: 'Infused Water Lemon',
    category: 'Beverage',
    servingSize: '1 botol (500ml)',
    servingWeight: 500,
    nutritionPer100g: {
      protein_per_100g: 0,
      carbs_per_100g: 0.8,
      fat_per_100g: 0,
      fiber_per_100g: 0.2,
      sugar_per_100g: 0.6,
      sodium_per_100g: 4,
    },
  },
  {
    nameEn: 'Herbal Turmeric Tamarind',
    nameId: 'Jamu Kunyit Asam',
    category: 'Beverage',
    servingSize: '1 gelas (220ml)',
    servingWeight: 220,
    nutritionPer100g: {
      protein_per_100g: 0.6,
      carbs_per_100g: 12.4,
      fat_per_100g: 0.4,
      fiber_per_100g: 2.0,
      sugar_per_100g: 9.8,
      sodium_per_100g: 18,
    },
  },
  {
    nameEn: 'Warm Ginger Drink',
    nameId: 'Wedang Jahe',
    category: 'Beverage',
    servingSize: '1 cangkir (220ml)',
    servingWeight: 220,
    nutritionPer100g: {
      protein_per_100g: 0.2,
      carbs_per_100g: 12.0,
      fat_per_100g: 0,
      fiber_per_100g: 0.4,
      sugar_per_100g: 11.2,
      sodium_per_100g: 8,
    },
  },
  {
    nameEn: 'Rosella Tea',
    nameId: 'Teh Rosella',
    category: 'Beverage',
    servingSize: '1 cangkir (240ml)',
    servingWeight: 240,
    nutritionPer100g: {
      protein_per_100g: 0,
      carbs_per_100g: 2.6,
      fat_per_100g: 0,
      fiber_per_100g: 0.4,
      sugar_per_100g: 1.8,
      sodium_per_100g: 4,
    },
  },
  {
    nameEn: 'Honey Lime Drink',
    nameId: 'Minuman Jeruk Nipis Madu',
    category: 'Beverage',
    servingSize: '1 gelas (250ml)',
    servingWeight: 250,
    nutritionPer100g: {
      protein_per_100g: 0.2,
      carbs_per_100g: 13.4,
      fat_per_100g: 0,
      fiber_per_100g: 0.4,
      sugar_per_100g: 12.0,
      sodium_per_100g: 6,
    },
  },
];

function round(value) {
  return Math.round(value * 100) / 100;
}

function sanitizeNutrients(nutrients) {
  const sanitized = { ...nutrients };

  const numericKeys = [
    'calories_per_100g',
    'protein_per_100g',
    'carbs_per_100g',
    'fat_per_100g',
    'fiber_per_100g',
    'sugar_per_100g',
    'sodium_per_100g',
  ];

  numericKeys.forEach((key) => {
    sanitized[key] = round(Math.max(0, sanitized[key] || 0));
  });

  sanitized.fiber_per_100g = round(
    Math.min(sanitized.fiber_per_100g, sanitized.carbs_per_100g * 0.9)
  );

  sanitized.sugar_per_100g = round(
    Math.min(sanitized.sugar_per_100g, sanitized.carbs_per_100g * 0.9)
  );

  sanitized.sodium_per_100g = round(Math.min(sanitized.sodium_per_100g, 6000));

  if (!sanitized.calories_per_100g) {
  sanitized.calories_per_100g = round(
    sanitized.protein_per_100g * 4 +
      sanitized.carbs_per_100g * 4 +
      sanitized.fat_per_100g * 9
  );
  }

  return sanitized;
}

function applyProfile(nutrition, profile = {}) {
  const result = { ...nutrition };

  if (profile.multipliers) {
    Object.entries(profile.multipliers).forEach(([key, multiplier]) => {
      if (result[key] !== undefined) {
        result[key] = round(result[key] * multiplier);
      }
    });
  }

  if (profile.additions) {
    Object.entries(profile.additions).forEach(([key, addition]) => {
      if (result[key] === undefined) {
        result[key] = 0;
      }
      result[key] = round(result[key] + addition);
    });
  }

  return result;
}

function createCookedIngredientEntries() {
  const entries = [];

  for (const base of baseFoods) {
    for (const methodId of base.methods) {
      const method = cookingMethods[methodId];
      if (!method) {
        continue;
      }

      const methodAdjusted = applyProfile(base.nutritionPer100g, method.adjustments);
      const sanitized = sanitizeNutrients({ ...methodAdjusted });

      for (const portion of portionVariants) {
        const englishName = `${method.nameEn} ${base.baseNameEn}${
          portion.suffixEn ? ` (${portion.suffixEn})` : ''
        }`;
        const indonesianName = `${base.baseNameId} ${method.nameId}${
          portion.suffixId ? ` - ${portion.suffixId}` : ''
        }`;

        entries.push({
          name: englishName,
          name_indonesian: indonesianName,
          category: base.category,
          calories_per_100g: sanitized.calories_per_100g,
          protein_per_100g: sanitized.protein_per_100g,
          carbs_per_100g: sanitized.carbs_per_100g,
          fat_per_100g: sanitized.fat_per_100g,
          fiber_per_100g: sanitized.fiber_per_100g,
          sugar_per_100g: sanitized.sugar_per_100g,
          sodium_per_100g: sanitized.sodium_per_100g,
          serving_size: `${portion.suffixId ? `1 ${portion.suffixId.toLowerCase()}` : '1 porsi standar'} (${portion.weight}g)`,
          serving_weight: portion.weight,
    is_verified: true,
          source: 'manual',
        });
      }
    }
  }

  return entries;
}

function createSimpleEntries(items) {
  return items.map((item) => {
    const sanitized = sanitizeNutrients({ ...item.nutritionPer100g });

    return {
      name: item.nameEn,
      name_indonesian: item.nameId,
      category: item.category,
      calories_per_100g: sanitized.calories_per_100g,
      protein_per_100g: sanitized.protein_per_100g,
      carbs_per_100g: sanitized.carbs_per_100g,
      fat_per_100g: sanitized.fat_per_100g,
      fiber_per_100g: sanitized.fiber_per_100g,
      sugar_per_100g: sanitized.sugar_per_100g,
      sodium_per_100g: sanitized.sodium_per_100g,
      serving_size: item.servingSize,
      serving_weight: item.servingWeight,
    is_verified: true,
          source: 'manual',
    };
  });
}

function buildFoodEntries(target = 1000) {
  const cookedIngredients = createCookedIngredientEntries();
  const seasonings = createSimpleEntries(seasoningItems);
  const sauces = createSimpleEntries(sauceItems);
  const beverages = createSimpleEntries(beverageItems);

  const combined = [
    ...cookedIngredients,
    ...seasonings,
    ...sauces,
    ...beverages,
  ];

  if (combined.length < target) {
    throw new Error(
      `Hanya berhasil membentuk ${combined.length} item, kurang dari target ${target}.`
    );
  }

  return combined.slice(0, target);
}

async function seedFoodDatabase(options = {}) {
  const { totalItems = 1000 } = options;
  let connection;
  
  try {
    console.log('🌱 Menyiapkan 1000 menu makanan sehat berbahasa Indonesia...');
    const foodEntries = buildFoodEntries(totalItems);

    if (foodEntries.length < totalItems) {
      throw new Error(`Hanya berhasil membentuk ${foodEntries.length} menu, kurang dari target ${totalItems}.`);
    }

    console.log('📋 Contoh menu:');
    console.table(
      foodEntries.slice(0, 5).map((item) => ({
        nama: item.name,
        kategori: item.category,
        kalori: item.calories_per_100g,
        protein: item.protein_per_100g,
        karbo: item.carbs_per_100g,
        lemak: item.fat_per_100g,
      }))
    );

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Terhubung ke database');

    console.log('🗑️  Mengosongkan tabel food_database...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE food_database');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tabel food_database berhasil dikosongkan');

    const insertSql = `
      INSERT INTO food_database (
        name,
        name_indonesian,
        category,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        fiber_per_100g,
        sugar_per_100g,
        sodium_per_100g,
        serving_size,
        serving_weight,
        is_verified,
        source
      ) VALUES ?
    `;

    const values = foodEntries.map((item) => [
      item.name,
      item.name_indonesian,
      item.category,
      item.calories_per_100g,
      item.protein_per_100g,
      item.carbs_per_100g,
      item.fat_per_100g,
      item.fiber_per_100g,
      item.sugar_per_100g,
      item.sodium_per_100g,
      item.serving_size,
      item.serving_weight,
      item.is_verified,
      item.source,
    ]);

    const chunkSize = 200;
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize);
      await connection.query(insertSql, [chunk]);
      console.log(`✅ Memasukkan ${Math.min(i + chunkSize, values.length)} / ${values.length} menu`);
    }

    const [countResult] = await connection.query('SELECT COUNT(*) AS jumlah FROM food_database');
    console.log(`📊 Total menu tersimpan: ${countResult[0].jumlah}`);

    const [categoryRows] = await connection.query(
      'SELECT category AS kategori, COUNT(*) AS jumlah FROM food_database GROUP BY category ORDER BY jumlah DESC'
    );
    console.log('📂 Sebaran kategori:');
    console.table(categoryRows);

    return { inserted: foodEntries.length };
  } catch (error) {
    console.error('❌ Gagal melakukan seeding food_database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Koneksi database ditutup');
    }
  }
}

if (require.main === module) {
  seedFoodDatabase()
    .then(() => {
      console.log('🎉 Pembaruan data food_database selesai');
      process.exit(0);
    })
    .catch((error) => {
      console.error('🚨 Pembaruan data food_database gagal:', error);
      process.exit(1);
    });
}

module.exports = {
  seedFoodDatabase,
  buildFoodEntries,
};

