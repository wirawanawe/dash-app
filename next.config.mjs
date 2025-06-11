/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    JWT_SECRET:
      process.env.JWT_SECRET || "supersecretkey123456789supersecretkey",
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_USER: process.env.DB_USER || "root",
    DB_PASSWORD: process.env.DB_PASSWORD || "",
    DB_NAME: process.env.DB_NAME || "phc_dashboard",
  },
  images: {
    domains: ["localhost", "your-domain.com"],
    unoptimized: true,
  },
  serverExternalPackages: [],
  serverRuntimeConfig: {
    timeout: 30000, // 30 seconds
  },
};

export default nextConfig;
