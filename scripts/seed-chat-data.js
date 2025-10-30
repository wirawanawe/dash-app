import { query } from '../lib/db.js';

const seedChatData = async () => {
  try {
    console.log('🌱 Seeding chat data...');

    // Get some mobile users
    const [users] = await query('SELECT id, name FROM mobile_users LIMIT 5');
    
    if (users.length === 0) {
      console.log('❌ No mobile users found. Please seed mobile users first.');
      return;
    }

    // Get some doctors
    const [doctors] = await query('SELECT id, name FROM doctors LIMIT 3');
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found. Please seed doctors first.');
      return;
    }

    console.log(`📱 Found ${users.length} mobile users`);
    console.log(`👨‍⚕️ Found ${doctors.length} doctors`);

    // Create sample chats
    const sampleChats = [
      {
        user_id: users[0].id,
        doctor_id: doctors[0].id,
        title: `Konsultasi dengan ${users[0].name}`,
        status: 'active',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updated_at: new Date(),
        last_message_at: new Date()
      },
      {
        user_id: users[1].id,
        doctor_id: doctors[0].id,
        title: `Follow-up ${users[1].name}`,
        status: 'active',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updated_at: new Date(),
        last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        user_id: users[2].id,
        doctor_id: doctors[1].id,
        title: `Konsultasi Umum ${users[2].name}`,
        status: 'closed',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        last_message_at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        user_id: users[3].id,
        doctor_id: doctors[2].id,
        title: `Konsultasi ${users[3].name}`,
        status: 'active',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updated_at: new Date(),
        last_message_at: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    ];

    // Insert chats
    for (const chat of sampleChats) {
      const [result] = await query(`
        INSERT INTO chats (user_id, doctor_id, title, status, created_at, updated_at, last_message_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        chat.user_id,
        chat.doctor_id,
        chat.title,
        chat.status,
        chat.created_at,
        chat.updated_at,
        chat.last_message_at
      ]);

      const chatId = result.insertId;
      console.log(`✅ Created chat ${chatId} for user ${chat.user_id} with doctor ${chat.doctor_id}`);

      // Create sample messages for each chat
      const sampleMessages = [
        {
          chat_id: chatId,
          sender_id: chat.user_id,
          sender_type: 'user',
          content: 'Halo dokter, saya ingin berkonsultasi tentang kesehatan saya.',
          sent_at: new Date(chat.created_at.getTime() + 5 * 60 * 1000) // 5 minutes after chat creation
        },
        {
          chat_id: chatId,
          sender_id: chat.doctor_id,
          sender_type: 'doctor',
          content: 'Halo! Silakan ceritakan keluhan Anda. Saya siap membantu.',
          sent_at: new Date(chat.created_at.getTime() + 10 * 60 * 1000) // 10 minutes after chat creation
        },
        {
          chat_id: chatId,
          sender_id: chat.user_id,
          sender_type: 'user',
          content: 'Saya mengalami sakit kepala dan demam sejak kemarin. Apakah ini gejala yang serius?',
          sent_at: new Date(chat.created_at.getTime() + 15 * 60 * 1000) // 15 minutes after chat creation
        },
        {
          chat_id: chatId,
          sender_id: chat.doctor_id,
          sender_type: 'doctor',
          content: 'Sakit kepala dan demam bisa disebabkan oleh berbagai hal. Berapa suhu tubuh Anda saat ini?',
          sent_at: new Date(chat.created_at.getTime() + 20 * 60 * 1000) // 20 minutes after chat creation
        },
        {
          chat_id: chatId,
          sender_id: chat.user_id,
          sender_type: 'user',
          content: 'Suhu tubuh saya sekitar 38.5°C. Saya juga merasa lemas dan tidak nafsu makan.',
          sent_at: new Date(chat.created_at.getTime() + 25 * 60 * 1000) // 25 minutes after chat creation
        }
      ];

      // Add more recent messages for active chats
      if (chat.status === 'active') {
        sampleMessages.push(
          {
            chat_id: chatId,
            sender_id: chat.doctor_id,
            sender_type: 'doctor',
            content: 'Dengan gejala yang Anda alami, kemungkinan Anda mengalami infeksi virus. Saya sarankan untuk istirahat yang cukup dan minum banyak air putih.',
            sent_at: new Date(chat.last_message_at.getTime() - 30 * 60 * 1000) // 30 minutes before last message
          },
          {
            chat_id: chatId,
            sender_id: chat.user_id,
            sender_type: 'user',
            content: 'Baik dokter, terima kasih atas sarannya. Apakah saya perlu minum obat tertentu?',
            sent_at: new Date(chat.last_message_at.getTime() - 15 * 60 * 1000) // 15 minutes before last message
          },
          {
            chat_id: chatId,
            sender_id: chat.doctor_id,
            sender_type: 'doctor',
            content: 'Untuk saat ini, Anda bisa minum paracetamol untuk menurunkan demam. Jika gejala memburuk dalam 3 hari, segera hubungi saya kembali.',
            sent_at: new Date(chat.last_message_at.getTime()) // Last message
          }
        );
      }

      // Insert messages
      for (const message of sampleMessages) {
        await query(`
          INSERT INTO chat_messages (chat_id, sender_id, sender_type, content, sent_at)
          VALUES (?, ?, ?, ?, ?)
        `, [
          message.chat_id,
          message.sender_id,
          message.sender_type,
          message.content,
          message.sent_at
        ]);
      }

      console.log(`✅ Added ${sampleMessages.length} messages to chat ${chatId}`);
    }

    console.log('🎉 Chat data seeded successfully!');
    
    // Display summary
    const [chatCount] = await query('SELECT COUNT(*) as count FROM chats');
    const [messageCount] = await query('SELECT COUNT(*) as count FROM chat_messages');
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total chats: ${chatCount[0].count}`);
    console.log(`- Total messages: ${messageCount[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding chat data:', error);
  }
};

// Run the script
seedChatData()
  .then(() => {
    console.log('✅ Chat seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Chat seeding failed:', error);
    process.exit(1);
  }); 