import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
      host: 'dash.doctorphc.id',
  user: 'root',
  password: 'pr1k1t1w',
  database: 'phc_dashboard'
};

async function checkUnusedTables() {
  let connection;
  
  try {
    console.log('🔍 Checking for unused tables...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get all tables from database
    const [tables] = await connection.execute('SHOW TABLES');
    const dbTables = tables.map(row => Object.values(row)[0]);
    
    console.log(`📊 Found ${dbTables.length} tables in database:`);
    dbTables.forEach(table => console.log(`  - ${table}`));
    
    // Get all files in the codebase
    const codebaseFiles = [];
    
    function scanDirectory(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql')) {
          codebaseFiles.push(filePath);
        }
      }
    }
    
    scanDirectory('.');
    
    console.log(`📁 Found ${codebaseFiles.length} code files`);
    
    // Check which tables are referenced in code
    const usedTables = new Set();
    const tableReferences = {};
    
    for (const file of codebaseFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const table of dbTables) {
          if (content.includes(table)) {
            usedTables.add(table);
            if (!tableReferences[table]) {
              tableReferences[table] = [];
            }
            tableReferences[table].push(file.replace('./', ''));
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    // Find unused tables
    const unusedTables = dbTables.filter(table => !usedTables.has(table));
    
    console.log('\n📋 Analysis Results:');
    console.log('==================');
    
    if (unusedTables.length > 0) {
      console.log(`❌ Found ${unusedTables.length} potentially unused tables:`);
      unusedTables.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log('✅ All tables appear to be used in the codebase');
    }
    
    console.log(`\n✅ Found ${usedTables.size} tables that are referenced in code:`);
    for (const table of usedTables) {
      console.log(`  - ${table} (referenced in ${tableReferences[table].length} files)`);
    }
    
    // Show detailed references for each table
    console.log('\n📄 Detailed table references:');
    console.log('============================');
    for (const table of usedTables) {
      console.log(`\n${table}:`);
      tableReferences[table].slice(0, 5).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (tableReferences[table].length > 5) {
        console.log(`  ... and ${tableReferences[table].length - 5} more files`);
      }
    }
    
    return { unusedTables, usedTables, tableReferences };
    
  } catch (error) {
    console.error('❌ Error checking unused tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the check
checkUnusedTables()
  .then(({ unusedTables, usedTables, tableReferences }) => {
    console.log('\n🎉 Table usage analysis completed!');
    
    if (unusedTables.length > 0) {
      console.log('\n💡 Recommendation:');
      console.log('Consider removing these unused tables if they are no longer needed:');
      unusedTables.forEach(table => console.log(`  - ${table}`));
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }); 