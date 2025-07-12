#!/usr/bin/env node

import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔍 Production Debug Tool");
console.log("========================");

// Load environment variables
const envFiles = [".env.production", ".env.local", ".env"];
let envLoaded = false;

for (const envFile of envFiles) {
  const envPath = resolve(__dirname, envFile);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment from: ${envFile}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log("❌ No environment file found!");
}

// Check environment variables
console.log("\n📋 Environment Variables:");
console.log("==========================");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
console.log(`DB_HOST: ${process.env.DB_HOST || "not set"}`);
console.log(`DB_USER: ${process.env.DB_USER || "not set"}`);
console.log(
  `DB_PASSWORD: ${process.env.DB_PASSWORD ? "***set***" : "not set"}`
);
console.log(`DB_NAME: ${process.env.DB_NAME || "not set"}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? "***set***" : "not set"}`);
console.log(`PORT: ${process.env.PORT || "not set"}`);

// Test database connection
async function testDatabase() {
  console.log("\n🔌 Testing Database Connection:");
  console.log("===============================");

  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "phc_dashboard",
    connectTimeout: 5000,
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log("✅ Database connection successful!");

    // Test query
    const [rows] = await connection.execute("SELECT 1 as test");
    console.log("✅ Query test successful!");

    // Check users table
    try {
      const [users] = await connection.execute(
        "SELECT COUNT(*) as count FROM users"
      );
      console.log(`✅ Users table accessible, ${users[0].count} users found`);
    } catch (error) {
      console.log("❌ Users table not accessible:", error.message);
    }

    await connection.end();
  } catch (error) {
    console.log("❌ Database connection failed!");
    console.log("Error:", error.message);

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n🛠️  Fix: Check database credentials in environment file");
    } else if (error.code === "ECONNREFUSED") {
      console.log("\n🛠️  Fix: Check if MySQL service is running");
    }
  }
}

// Test JWT
function testJWT() {
  console.log("\n🔑 Testing JWT Configuration:");
  console.log("=============================");

  if (!process.env.JWT_SECRET) {
    console.log("❌ JWT_SECRET not set!");
    console.log("🛠️  Fix: Set JWT_SECRET in environment file");
    return false;
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.log(
      "⚠️  JWT_SECRET is too short (should be at least 32 characters)"
    );
    console.log("🛠️  Fix: Use a longer, more secure JWT_SECRET");
  } else {
    console.log("✅ JWT_SECRET is properly configured");
  }

  return true;
}

// Test login endpoint
async function testLogin() {
  console.log("\n🔐 Testing Login Endpoint:");
  console.log("==========================");

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@phc.com",
        password: "admin123",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Login endpoint responding correctly");
      console.log("Response:", data.success ? "Success" : "Failed");
    } else {
      console.log("❌ Login endpoint error:", response.status);
    }
  } catch (error) {
    console.log("❌ Cannot reach login endpoint:", error.message);
    console.log(
      "🛠️  Fix: Make sure the application is running on localhost:3000"
    );
  }
}

// Test /api/auth/me endpoint
async function testMe() {
  console.log("\n👤 Testing /api/auth/me Endpoint:");
  console.log("=================================");

  try {
    const response = await fetch("http://localhost:3000/api/auth/me");

    if (response.ok) {
      const data = await response.json();
      console.log("✅ /api/auth/me endpoint responding");
      console.log("Response:", data ? "User data returned" : "No user data");
    } else {
      console.log("❌ /api/auth/me endpoint error:", response.status);
    }
  } catch (error) {
    console.log("❌ Cannot reach /api/auth/me endpoint:", error.message);
  }
}

// Run all tests
async function runTests() {
  testJWT();
  await testDatabase();
  await testLogin();
  await testMe();

  console.log("\n🎯 Recommendations:");
  console.log("===================");
  console.log("1. Ensure .env.production file exists with correct credentials");
  console.log(
    "2. Use PM2 ecosystem.config.js for better environment management"
  );
  console.log("3. Check PM2 logs: pm2 logs dash-app");
  console.log("4. Restart PM2 after environment changes: pm2 restart dash-app");
  console.log(
    "5. Monitor health endpoint: curl http://localhost:3000/api/health"
  );
}

runTests().catch(console.error);
