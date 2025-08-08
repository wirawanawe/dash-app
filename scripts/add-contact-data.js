import { query } from '../lib/db.js';

async function addContactData() {
  try {
    console.log('📞 Adding contact data to phc_office_admin table...');

    // Clear existing data first
    await query('DELETE FROM phc_office_admin');
    console.log('✅ Cleared existing data');

    // Insert new contact data
    const contactData = [
      {
        office_name: 'Kantor Pusat PHC',
        phone: '+62-21-12345678',
        email: 'admin@phc.com',
        address: 'Jl. Sudirman No. 123, Jakarta Pusat',
        city: 'Jakarta Pusat',
        postal_code: '12190',
        contact_person: 'Admin PHC',
        is_active: true
      },
      {
        office_name: 'PHC Support Center',
        phone: '+62-21-87654321',
        email: 'support@phc.com',
        address: 'Jl. Thamrin No. 45, Jakarta Pusat',
        city: 'Jakarta Pusat',
        postal_code: '10350',
        contact_person: 'Customer Service PHC',
        is_active: true
      },
      {
        office_name: 'PHC Emergency Hotline',
        phone: '+62-21-99988877',
        email: 'emergency@phc.com',
        address: 'Jl. Gatot Subroto No. 67, Jakarta Selatan',
        city: 'Jakarta Selatan',
        postal_code: '12950',
        contact_person: 'Emergency Team PHC',
        is_active: true
      }
    ];

    for (const contact of contactData) {
      await query(`
        INSERT INTO phc_office_admin 
        (office_name, phone, email, address, city, postal_code, contact_person, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        contact.office_name,
        contact.phone,
        contact.email,
        contact.address,
        contact.city,
        contact.postal_code,
        contact.contact_person,
        contact.is_active
      ]);
    }

    console.log('✅ Added contact data successfully');

    // Verify the data
    const result = await query('SELECT * FROM phc_office_admin WHERE is_active = TRUE');
    console.log('📊 Current contact data:');
    console.table(result);

  } catch (error) {
    console.error('❌ Error adding contact data:', error);
  } finally {
    process.exit(0);
  }
}

addContactData();
