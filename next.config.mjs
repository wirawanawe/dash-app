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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  serverExternalPackages: [],
  serverRuntimeConfig: {
    timeout: 30000, // 30 seconds
  },
  swcMinify: true,
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };

      config.resolve.symlinks = false;
    }

    return config;
  },
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  api: {
    responseLimit: "1mb",
  },
};

export default nextConfig;
