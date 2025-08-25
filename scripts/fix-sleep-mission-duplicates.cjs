#!/usr/bin/env node

/**
 * Fix Sleep Mission Duplicates Script
 * 
 * This script fixes the duplicate "Tidur 7 Jam Sehari" missions by:
 * 1. Keeping only one mission (ID 19)
 * 2. Consolidating user_missions from duplicate missions to the main mission
 * 3. Removing duplicate missions
 */

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phc_dashboard',
  port: process.env.DB_PORT || 3306
};

async function fixSleepMissionDuplicates() {
  let connection;
  
  try {
    console.log('🔧 Starting Sleep Mission Duplicates Fix...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Step 1: Check for duplicate sleep missions
    console.log('🔍 Step 1: Checking for duplicate sleep missions...');
    const [duplicateMissions] = await connection.execute(`
      SELECT id, title, category, target_value, unit, created_at
      FROM missions 
      WHERE title LIKE '%Tidur 7 Jam%'
      ORDER BY id
    `);
    
    if (duplicateMissions.length <= 1) {
      console.log('✅ No duplicate sleep missions found. Nothing to fix.');
      return;
    }
    
    console.log(`❌ Found ${duplicateMissions.length} duplicate missions:`);
    duplicateMissions.forEach(mission => {
      console.log(`   - ID ${mission.id}: ${mission.title} (${mission.target_value} ${mission.unit})`);
    });
    
    // Step 2: Identify the main mission (keep the oldest one)
    const mainMission = duplicateMissions[0]; // ID 19
    const duplicateMissionIds = duplicateMissions.slice(1).map(m => m.id); // IDs 42, 65
    
    console.log(`\n🎯 Main mission to keep: ID ${mainMission.id} - ${mainMission.title}`);
    console.log(`🗑️ Duplicate missions to remove: ${duplicateMissionIds.join(', ')}`);
    
    // Step 3: Check user_missions for duplicate missions
    console.log('\n🔍 Step 3: Checking user_missions for duplicate missions...');
    const [userMissions] = await connection.execute(`
      SELECT um.id, um.user_id, um.mission_id, m.title, um.status, um.progress, um.current_value, um.mission_date
      FROM user_missions um 
      JOIN missions m ON um.mission_id = m.id 
      WHERE m.title LIKE '%Tidur 7 Jam%'
      ORDER BY um.mission_id, um.mission_date
    `);
    
    console.log(`📊 Found ${userMissions.length} user_missions for sleep missions`);
    
    // Group user_missions by user and date
    const userMissionsByUserAndDate = {};
    userMissions.forEach(um => {
      const key = `${um.user_id}-${um.mission_date}`;
      if (!userMissionsByUserAndDate[key]) {
        userMissionsByUserAndDate[key] = [];
      }
      userMissionsByUserAndDate[key].push(um);
    });
    
    console.log(`📊 User missions grouped by user and date: ${Object.keys(userMissionsByUserAndDate).length} groups`);
    
    // Step 4: Consolidate user_missions
    console.log('\n🔄 Step 4: Consolidating user_missions...');
    let consolidatedCount = 0;
    let deletedCount = 0;
    
    for (const [key, missions] of Object.entries(userMissionsByUserAndDate)) {
      const [userId, missionDate] = key.split('-');
      
      // Find the main mission user_mission (mission_id = 19)
      const mainUserMission = missions.find(um => um.mission_id === mainMission.id);
      
      if (mainUserMission) {
        // Main mission exists, delete duplicates
        const duplicateUserMissions = missions.filter(um => um.mission_id !== mainMission.id);
        
        for (const duplicateUM of duplicateUserMissions) {
          await connection.execute('DELETE FROM user_missions WHERE id = ?', [duplicateUM.id]);
          deletedCount++;
          console.log(`   🗑️ Deleted duplicate user_mission ID ${duplicateUM.id} (mission_id: ${duplicateUM.mission_id})`);
        }
      } else {
        // Main mission doesn't exist, move the first duplicate to main mission
        const firstDuplicate = missions[0];
        await connection.execute(`
          UPDATE user_missions 
          SET mission_id = ? 
          WHERE id = ?
        `, [mainMission.id, firstDuplicate.id]);
        
        consolidatedCount++;
        console.log(`   🔄 Moved user_mission ID ${firstDuplicate.id} to main mission (ID ${mainMission.id})`);
        
        // Delete remaining duplicates
        const remainingDuplicates = missions.slice(1);
        for (const duplicateUM of remainingDuplicates) {
          await connection.execute('DELETE FROM user_missions WHERE id = ?', [duplicateUM.id]);
          deletedCount++;
          console.log(`   🗑️ Deleted duplicate user_mission ID ${duplicateUM.id} (mission_id: ${duplicateUM.mission_id})`);
        }
      }
    }
    
    // Step 5: Delete duplicate missions
    console.log('\n🗑️ Step 5: Deleting duplicate missions...');
    for (const missionId of duplicateMissionIds) {
      await connection.execute('DELETE FROM missions WHERE id = ?', [missionId]);
      console.log(`   🗑️ Deleted duplicate mission ID ${missionId}`);
    }
    
    // Step 6: Verify the fix
    console.log('\n✅ Step 6: Verifying the fix...');
    const [remainingMissions] = await connection.execute(`
      SELECT id, title, category, target_value, unit
      FROM missions 
      WHERE title LIKE '%Tidur 7 Jam%'
      ORDER BY id
    `);
    
    const [remainingUserMissions] = await connection.execute(`
      SELECT um.id, um.user_id, um.mission_id, m.title, um.status, um.progress, um.current_value, um.mission_date
      FROM user_missions um 
      JOIN missions m ON um.mission_id = m.id 
      WHERE m.title LIKE '%Tidur 7 Jam%'
      ORDER BY um.user_id, um.mission_date
    `);
    
    console.log(`\n📊 Fix Summary:`);
    console.log(`   - Remaining missions: ${remainingMissions.length}`);
    console.log(`   - Remaining user_missions: ${remainingUserMissions.length}`);
    console.log(`   - Consolidated user_missions: ${consolidatedCount}`);
    console.log(`   - Deleted duplicate user_missions: ${deletedCount}`);
    console.log(`   - Deleted duplicate missions: ${duplicateMissionIds.length}`);
    
    if (remainingMissions.length === 1) {
      console.log('\n🎉 Success! Duplicate sleep missions have been fixed.');
      console.log(`✅ Only one mission remains: ID ${remainingMissions[0].id} - ${remainingMissions[0].title}`);
    } else {
      console.log('\n⚠️ Warning: Still have multiple missions. Manual review needed.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing sleep mission duplicates:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 Database connection closed');
    }
  }
}

// Run the fix
fixSleepMissionDuplicates()
  .then(() => {
    console.log('\n✅ Sleep mission duplicates fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sleep mission duplicates fix failed:', error);
    process.exit(1);
  });
