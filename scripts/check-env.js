import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the absolute path to the root project
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

// Load environment variables from different sources
dotenv.config({ path: resolve(rootDir, ".env") });
dotenv.config({ path: resolve(rootDir, ".env.local") });

console.log("Checking environment variables...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log(
  "JWT_SECRET first 10 chars:",
  process.env.JWT_SECRET
    ? process.env.JWT_SECRET.substring(0, 10) + "..."
    : "Not set"
);

// Write JWT_SECRET to .env file if not present
import { writeFileSync, existsSync, readFileSync } from "fs";

if (!process.env.JWT_SECRET) {
  console.log("JWT_SECRET is not set, checking if .env file exists");

  const envPath = resolve(rootDir, ".env");

  if (existsSync(envPath)) {
    console.log(".env file exists, reading content");
    const envContent = readFileSync(envPath, "utf8");

    if (!envContent.includes("JWT_SECRET=")) {
      console.log("Adding JWT_SECRET to .env file");
      const updatedContent =
        envContent +
        "\n# JWT Settings\nJWT_SECRET=supersecretkey123456789supersecretkey\n";

      try {
        writeFileSync(envPath, updatedContent);
        console.log("Updated .env file with JWT_SECRET");
      } catch (err) {
        console.error("Error writing to .env file:", err);
      }
    } else {
      console.log(
        "JWT_SECRET already exists in .env file but is not being loaded correctly"
      );
    }
  } else {
    console.log(".env file doesn't exist, creating it");

    const envContent = `# Database Configuration
DB_HOST=${process.env.DB_HOST || "localhost"}
DB_USER=${process.env.DB_USER || "root"}
DB_PASSWORD=${process.env.DB_PASSWORD || ""}
DB_NAME=${process.env.DB_NAME || "phc_dashboard"}

# JWT Settings
JWT_SECRET=supersecretkey123456789supersecretkey

# Application Settings
NODE_ENV=${process.env.NODE_ENV || "development"}
`;

    try {
      writeFileSync(envPath, envContent);
      console.log("Created .env file with JWT_SECRET");
    } catch (err) {
      console.error("Error creating .env file:", err);
    }
  }
}
