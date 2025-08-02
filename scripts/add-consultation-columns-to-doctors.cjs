const { query } = require('../lib/db');

async function addConsultationColumnsToDoctors() {
  try {
    console.log('Adding consultation-related columns to doctors table...');

    // Add consultation-related columns to doctors table
    const alterQueries = [
      // Add consultation availability flag
      `ALTER TABLE doctors ADD COLUMN is_available_for_consultation BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether doctor is available for online consultation'`,
      
      // Add consultation fee
      `ALTER TABLE doctors ADD COLUMN consultation_fee DECIMAL(10,2) DEFAULT NULL COMMENT 'Consultation fee in IDR'`,
      
      // Add consultation schedule (JSON format)
      `ALTER TABLE doctors ADD COLUMN consultation_schedule JSON DEFAULT NULL COMMENT 'Available consultation schedule'`,
      
      // Add rating and reviews
      `ALTER TABLE doctors ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Average rating (0-5)'`,
      
      // Add total reviews count
      `ALTER TABLE doctors ADD COLUMN total_reviews INT DEFAULT 0 COMMENT 'Total number of reviews'`,
      
      // Add doctor bio
      `ALTER TABLE doctors ADD COLUMN bio TEXT DEFAULT NULL COMMENT 'Doctor biography'`,
      
      // Add image URL
      `ALTER TABLE doctors ADD COLUMN image_url VARCHAR(500) DEFAULT NULL COMMENT 'Doctor profile image URL'`,
      
      // Add experience years
      `ALTER TABLE doctors ADD COLUMN experience_years INT DEFAULT 0 COMMENT 'Years of experience'`,
      
      // Add qualification
      `ALTER TABLE doctors ADD COLUMN qualification VARCHAR(255) DEFAULT NULL COMMENT 'Doctor qualification/degree'`
    ];

    for (const alterQuery of alterQueries) {
      try {
        await query(alterQuery);
        console.log('✓ Executed:', alterQuery.split('ADD COLUMN')[1]?.split(' ')[1] || 'query');
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log('⚠ Column already exists, skipping...');
        } else {
          console.error('✗ Error executing query:', error.message);
        }
      }
    }

    // Create doctor_specializations table if it doesn't exist
    const createSpecializationsTable = `
      CREATE TABLE IF NOT EXISTS doctor_specializations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        specialization_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_specialization (specialization_name)
      )
    `;

    await query(createSpecializationsTable);
    console.log('✓ Created doctor_specializations table');

    // Insert some sample consultation doctors
    const sampleDoctors = [
      {
        name: 'Dr. Sarah Johnson',
        specialization: 'General Practitioner',
        qualification: 'MD, General Medicine',
        experience_years: 8,
        consultation_fee: 150000,
        rating: 4.8,
        total_reviews: 127,
        bio: 'Experienced general practitioner with expertise in preventive care and chronic disease management.',
        is_available_for_consultation: true,
        consultation_schedule: JSON.stringify({
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '09:00', end: '12:00' }
        })
      },
      {
        name: 'Dr. Michael Chen',
        specialization: 'Cardiologist',
        qualification: 'MD, Cardiology',
        experience_years: 12,
        consultation_fee: 250000,
        rating: 4.9,
        total_reviews: 89,
        bio: 'Specialist in cardiovascular diseases with focus on preventive cardiology and heart health.',
        is_available_for_consultation: true,
        consultation_schedule: JSON.stringify({
          monday: { start: '10:00', end: '18:00' },
          wednesday: { start: '10:00', end: '18:00' },
          friday: { start: '10:00', end: '18:00' }
        })
      },
      {
        name: 'Dr. Lisa Rodriguez',
        specialization: 'Pediatrician',
        qualification: 'MD, Pediatrics',
        experience_years: 10,
        consultation_fee: 180000,
        rating: 4.7,
        total_reviews: 156,
        bio: 'Dedicated pediatrician specializing in child health, development, and preventive care.',
        is_available_for_consultation: true,
        consultation_schedule: JSON.stringify({
          tuesday: { start: '08:00', end: '16:00' },
          thursday: { start: '08:00', end: '16:00' },
          saturday: { start: '08:00', end: '14:00' }
        })
      },
      {
        name: 'Dr. Ahmad Rahman',
        specialization: 'Dermatologist',
        qualification: 'MD, Dermatology',
        experience_years: 15,
        consultation_fee: 200000,
        rating: 4.6,
        total_reviews: 203,
        bio: 'Expert in skin conditions, cosmetic dermatology, and skin cancer prevention.',
        is_available_for_consultation: true,
        consultation_schedule: JSON.stringify({
          monday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        })
      },
      {
        name: 'Dr. Maya Sari',
        specialization: 'Psychiatrist',
        qualification: 'MD, Psychiatry',
        experience_years: 9,
        consultation_fee: 220000,
        rating: 4.8,
        total_reviews: 94,
        bio: 'Mental health specialist focusing on anxiety, depression, and stress management.',
        is_available_for_consultation: true,
        consultation_schedule: JSON.stringify({
          tuesday: { start: '10:00', end: '18:00' },
          thursday: { start: '10:00', end: '18:00' },
          saturday: { start: '09:00', end: '15:00' }
        })
      }
    ];

    // Insert sample doctors
    for (const doctor of sampleDoctors) {
      const insertQuery = `
        INSERT INTO doctors (
          name, specialist, qualification, experience_years,
          consultation_fee, rating, total_reviews, bio,
          is_available_for_consultation, consultation_schedule
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await query(insertQuery, [
        doctor.name,
        doctor.specialization,
        doctor.qualification,
        doctor.experience_years,
        doctor.consultation_fee,
        doctor.rating,
        doctor.total_reviews,
        doctor.bio,
        doctor.is_available_for_consultation,
        doctor.consultation_schedule
      ]);

      console.log(`✓ Added sample doctor: ${doctor.name}`);
    }

    // Add specializations to doctor_specializations table
    const specializations = [
      { doctor_name: 'Dr. Sarah Johnson', specializations: ['General Practice', 'Preventive Care', 'Chronic Disease Management'] },
      { doctor_name: 'Dr. Michael Chen', specializations: ['Cardiology', 'Heart Disease', 'Preventive Cardiology'] },
      { doctor_name: 'Dr. Lisa Rodriguez', specializations: ['Pediatrics', 'Child Development', 'Vaccination'] },
      { doctor_name: 'Dr. Ahmad Rahman', specializations: ['Dermatology', 'Skin Conditions', 'Cosmetic Dermatology'] },
      { doctor_name: 'Dr. Maya Sari', specializations: ['Psychiatry', 'Anxiety', 'Depression', 'Stress Management'] }
    ];

    for (const spec of specializations) {
      const doctorId = await query('SELECT id FROM doctors WHERE name = ?', [spec.doctor_name]);
      
      if (doctorId.length > 0) {
        for (const specialization of spec.specializations) {
          await query(
            'INSERT INTO doctor_specializations (doctor_id, specialization_name) VALUES (?, ?)',
            [doctorId[0].id, specialization]
          );
        }
        console.log(`✓ Added specializations for: ${spec.doctor_name}`);
      }
    }

    console.log('✅ Successfully added consultation columns and sample data to doctors table');
    
  } catch (error) {
    console.error('❌ Error adding consultation columns:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addConsultationColumnsToDoctors()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addConsultationColumnsToDoctors }; 