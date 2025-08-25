#!/usr/bin/env node

/**
 * Fix All Mission Duplicates Script
 * 
 * This script fixes all duplicate missions in the database by:
 * 1. Finding all duplicate missions
 * 2. Keeping only the oldest mission for each duplicate group
 * 3. Consolidating user_missions to the main mission
 * 4. Removing duplicate missions
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

async function fixAllMissionDuplicates() {
  let connection;
  
  try {
    console.log('🔧 Starting All Mission Duplicates Fix...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');
    
    // Step 1: Find all duplicate missions
    console.log('🔍 Step 1: Finding all duplicate missions...');
    const [duplicates] = await connection.execute(`
      SELECT title, category, target_value, unit, COUNT(*) as count
      FROM missions 
      GROUP BY title, category, target_value, unit 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate missions found. Nothing to fix.');
      return;
    }
    
    console.log(`❌ Found ${duplicates.length} groups of duplicate missions:`);
    duplicates.forEach(dup => {
      console.log(`   - ${dup.title} (${dup.category}, ${dup.target_value} ${dup.unit}): ${dup.count} duplicates`);
    });
    
    let totalFixed = 0;
    let totalUserMissionsConsolidated = 0;
    let totalUserMissionsDeleted = 0;
    let totalMissionsDeleted = 0;
    
    // Step 2: Process each duplicate group
    for (const duplicateGroup of duplicates) {
      console.log(`\n🔄 Processing: ${duplicateGroup.title} (${duplicateGroup.category}, ${duplicateGroup.target_value} ${duplicateGroup.unit})`);
      
      // Get all missions in this duplicate group
      const [missions] = await connection.execute(`
        SELECT id, title, category, target_value, unit, created_at
        FROM missions 
        WHERE title = ? AND category = ? AND target_value = ? AND unit = ?
        ORDER BY id
      `, [duplicateGroup.title, duplicateGroup.category, duplicateGroup.target_value, duplicateGroup.unit]);
      
      // Keep the oldest mission (lowest ID)
      const mainMission = missions[0];
      const duplicateMissionIds = missions.slice(1).map(m => m.id);
      
      console.log(`   🎯 Main mission to keep: ID ${mainMission.id}`);
      console.log(`   🗑️ Duplicate missions to remove: ${duplicateMissionIds.join(', ')}`);
      
      // Step 3: Get all user_missions for these missions
      const [userMissions] = await connection.execute(`
        SELECT um.id, um.user_id, um.mission_id, um.status, um.progress, um.current_value, um.mission_date
        FROM user_missions um 
        WHERE um.mission_id IN (${missions.map(m => m.id).join(',')})
        ORDER BY um.mission_id, um.mission_date
      `);
      
      console.log(`   📊 Found ${userMissions.length} user_missions for this group`);
      
      // Group user_missions by user and date
      const userMissionsByUserAndDate = {};
      userMissions.forEach(um => {
        const key = `${um.user_id}-${um.mission_date}`;
        if (!userMissionsByUserAndDate[key]) {
          userMissionsByUserAndDate[key] = [];
        }
        userMissionsByUserAndDate[key].push(um);
      });
      
      // Step 4: Consolidate user_missions
      let consolidatedCount = 0;
      let deletedCount = 0;
      
      for (const [key, missions] of Object.entries(userMissionsByUserAndDate)) {
        const [userId, missionDate] = key.split('-');
        
        // Find the main mission user_mission
        const mainUserMission = missions.find(um => um.mission_id === mainMission.id);
        
        if (mainUserMission) {
          // Main mission exists, delete duplicates
          const duplicateUserMissions = missions.filter(um => um.mission_id !== mainMission.id);
          
          for (const duplicateUM of duplicateUserMissions) {
            await connection.execute('DELETE FROM user_missions WHERE id = ?', [duplicateUM.id]);
            deletedCount++;
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
          
          // Delete remaining duplicates
          const remainingDuplicates = missions.slice(1);
          for (const duplicateUM of remainingDuplicates) {
            await connection.execute('DELETE FROM user_missions WHERE id = ?', [duplicateUM.id]);
            deletedCount++;
          }
        }
      }
      
      // Step 5: Delete duplicate missions
      for (const missionId of duplicateMissionIds) {
        await connection.execute('DELETE FROM missions WHERE id = ?', [missionId]);
      }
      
      console.log(`   ✅ Consolidated ${consolidatedCount} user_missions`);
      console.log(`   ✅ Deleted ${deletedCount} duplicate user_missions`);
      console.log(`   ✅ Deleted ${duplicateMissionIds.length} duplicate missions`);
      
      totalFixed++;
      totalUserMissionsConsolidated += consolidatedCount;
      totalUserMissionsDeleted += deletedCount;
      totalMissionsDeleted += duplicateMissionIds.length;
    }
    
    // Step 6: Verify the fix
    console.log('\n✅ Step 6: Verifying the fix...');
    const [remainingDuplicates] = await connection.execute(`
      SELECT title, category, target_value, unit, COUNT(*) as count
      FROM missions 
      GROUP BY title, category, target_value, unit 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC
    `);
    
    console.log(`\n📊 Fix Summary:`);
    console.log(`   - Duplicate groups processed: ${totalFixed}`);
    console.log(`   - User missions consolidated: ${totalUserMissionsConsolidated}`);
    console.log(`   - Duplicate user missions deleted: ${totalUserMissionsDeleted}`);
    console.log(`   - Duplicate missions deleted: ${totalMissionsDeleted}`);
    console.log(`   - Remaining duplicates: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('\n🎉 Success! All duplicate missions have been fixed.');
    } else {
      console.log('\n⚠️ Warning: Still have some duplicates. Manual review needed.');
      remainingDuplicates.forEach(dup => {
        console.log(`   - ${dup.title} (${dup.category}, ${dup.target_value} ${dup.unit}): ${dup.count} duplicates`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing mission duplicates:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 Database connection closed');
    }
  }
}

// Run the fix
fixAllMissionDuplicates()
  .then(() => {
    console.log('\n✅ All mission duplicates fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ All mission duplicates fix failed:', error);
    process.exit(1);
  });
