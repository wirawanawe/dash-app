// Token decoding test to check how atob works in Node.js
// This simulates what happens in the /api/auth/me endpoint

// Function to mimic atob for Node.js
function nodeAtob(base64) {
  return Buffer.from(base64, "base64").toString();
}

// Function to simulate what the /api/auth/me endpoint does
function decodeTokenDemo(token) {
  try {
    console.log("Decoding token:", token.substring(0, 20) + "...");
    const [header, payload, signature] = token.split(".");

    // Method 1: Using Buffer.from
    console.log("\nMethod 1: Using Buffer.from");
    try {
      const decodedBuffer = Buffer.from(payload, "base64").toString();
      const dataBuffer = JSON.parse(decodedBuffer);
      console.log("Decoded payload:", dataBuffer);
    } catch (e) {
      console.error("Buffer.from method failed:", e);
    }

    // Method 2: Using atob-like function
    console.log("\nMethod 2: Using nodeAtob");
    try {
      const decodedAtob = nodeAtob(payload);
      const dataAtob = JSON.parse(decodedAtob);
      console.log("Decoded payload:", dataAtob);
    } catch (e) {
      console.error("nodeAtob method failed:", e);
    }

    // Method 3: Using global.atob if available (Node.js v20+)
    console.log("\nMethod 3: Using global.atob (if available)");
    try {
      if (global.atob) {
        const decodedGlobalAtob = global.atob(payload);
        const dataGlobalAtob = JSON.parse(decodedGlobalAtob);
        console.log("Decoded payload:", dataGlobalAtob);
      } else {
        console.log("global.atob is not available in this Node.js version");
      }
    } catch (e) {
      console.error("global.atob method failed:", e);
    }
  } catch (e) {
    console.error("Token decoding failed:", e);
  }
}

// Sample token with uppercase "ADMIN" role
const sampleToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjUsImlkIjo1LCJuYW1lIjoiU3VwZXIgQWRtaW4iLCJlbWFpbCI6InN1cGVyYWRtaW5AcGhjLmNvbSIsInJvbGUiOiJBRE1JTiIsImNsaW5pY0lkIjpudWxsLCJpYXQiOjE3NDY1MTU4NzksImV4cCI6MTc0NjYwMjI3OX0.sPvv7fPdgGrLJ0_GmFZe6ckc9-d6WHgfNl26J6PB8Yg";

decodeTokenDemo(sampleToken);

// Check Node.js version and atob availability
console.log("\nNode.js version:", process.version);
console.log("global.atob available:", typeof global.atob === "function");
