#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to skip
const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build'];

// Function to check if file should be processed
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return extensions.includes(ext);
}

// Function to remove console statements
function removeConsoleStatements(content) {
  // Remove console.log, console.debug, console.warn, console.error statements
  // Handles both single and multi-line console statements
  
  // Pattern 1: Simple console statements on a single line
  content = content.replace(/^\s*console\.(log|debug|warn|error)\([^;]*\);?\s*$/gm, '');
  
  // Pattern 2: Multi-line console statements
  content = content.replace(/^\s*console\.(log|debug|warn|error)\([^)]*\([^)]*\)[^)]*\);?\s*$/gm, '');
  
  // Pattern 3: Console statements with template literals
  content = content.replace(/^\s*console\.(log|debug|warn|error)\([^;]*`[^`]*`[^;]*\);?\s*$/gm, '');
  
  // Pattern 4: More aggressive pattern - any console statement
  // This will handle most cases including nested parentheses
  let prevContent;
  let iterations = 0;
  const maxIterations = 10;
  
  do {
    prevContent = content;
    // Remove console.xxx with simple arguments
    content = content.replace(/(\s*)console\.(log|debug|warn|error)\s*\([^)]*\)\s*;?\s*\n/g, '');
    
    iterations++;
  } while (prevContent !== content && iterations < maxIterations);
  
  // Remove debugger statements
  content = content.replace(/^\s*debugger\s*;?\s*$/gm, '');
  
  // Clean up multiple empty lines (replace 3+ empty lines with 2)
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  return content;
}

// Function to process a file
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const newContent = removeConsoleStatements(content);
    
    if (content !== newContent) {
      await writeFile(filePath, newContent, 'utf8');
      console.log(`✓ Processed: ${filePath}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Function to recursively process directory
async function processDirectory(dirPath) {
  let count = 0;
  
  try {
    const entries = await readdir(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      
      // Skip directories we don't want to process
      if (skipDirs.includes(entry)) {
        continue;
      }
      
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        count += await processDirectory(fullPath);
      } else if (stats.isFile() && shouldProcessFile(fullPath)) {
        count += await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return count;
}

// Main function
async function main() {
  const startDir = process.argv[2] || '.';
  
  console.log(`Starting to remove console statements from: ${startDir}`);
  console.log('This may take a while...\n');
  
  const count = await processDirectory(startDir);
  
  console.log(`\nDone! Processed ${count} files.`);
}

main().catch(console.error);

