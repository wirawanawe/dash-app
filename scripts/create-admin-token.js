import { SignJWT } from "jose";

// JWT Secret
const JWT_SECRET =
  process.env.JWT_SECRET || "supersecretkey123456789supersecretkey";

// Admin user data
const adminUser = {
  id: "admin-001",
  name: "Administrator",
  email: "admin@phc.com",
  role: "ADMIN",
  clinicId: null,
};

async function createAdminToken() {
  try {
    console.log("Creating admin token...");
    console.log("Admin user:", adminUser);

    // Create a JWT token
    const token = await new SignJWT({
      userId: adminUser.id,
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      clinicId: adminUser.clinicId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(JWT_SECRET));

    console.log("\nAdmin token created successfully:");
    console.log(token);

    // Print the token in a format that can be used with curl
    console.log("\nTo use with curl:");
    console.log(
      `curl -X GET http://localhost:3000/api/auth/me -H "Cookie: token=${token}"`
    );

    // Print instructions for browser testing
    console.log("\nTo use in browser console:");
    console.log(`document.cookie = "token=${token}; path=/; max-age=86400"`);
    console.log("Then navigate to http://localhost:3000/dashboard");
  } catch (error) {
    console.error("Error creating admin token:", error);
  }
}

// Run the function
createAdminToken();
