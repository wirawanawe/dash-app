import { query } from "../lib/db.js";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

// Database configuration
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "pr1k1t1w";
process.env.DB_NAME = process.env.DB_NAME || "phc_dashboard";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "supersecretkey123456789supersecretkey";

async function testLogin(email, password) {
  try {
    console.log("Testing login for:", email);
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log(
      "JWT_SECRET value (first 10 chars):",
      process.env.JWT_SECRET.substring(0, 10) + "..."
    );

    // Look up user in the database
    const users = await query(
      "SELECT id, name, email, password, role, clinic_id, is_active FROM users WHERE email = ?",
      [email]
    );

    console.log("User found in database:", !!users.length);

    if (!users.length) {
      console.error("User not found");
      return;
    }

    const user = users[0];
    console.log("User details:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      clinic_id: user.clinic_id,
    });

    // Test password comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.error("Password doesn't match");
      return;
    }

    // Test JWT token creation
    try {
      // Create a JWT token
      const token = await new SignJWT({
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase(),
        clinicId: user.clinic_id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

      console.log("Token created successfully");
      console.log("Token (first 50 chars):", token.substring(0, 50) + "...");

      // Decode token to inspect payload
      const [header, payload, signature] = token.split(".");
      const decodedData = JSON.parse(Buffer.from(payload, "base64").toString());
      console.log("Decoded token payload:", decodedData);
    } catch (tokenError) {
      console.error("Failed to create token:", tokenError);
    }
  } catch (error) {
    console.error("Test login error:", error);
  } finally {
    process.exit();
  }
}

// Run the test with our admin credentials
testLogin("superadmin@phc.com", "admin123");
