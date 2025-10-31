/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // Enable standalone output for production deployment
  // Bind to all interfaces for mobile app access
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  env: {
    // SECURITY: JWT_SECRET must be set in environment, no default fallback
    JWT_SECRET: process.env.JWT_SECRET,
    DB_HOST: process.env.DB_HOST || "dash.doctorphc.id",
    DB_USER: process.env.DB_USER || "root",
    DB_PASSWORD: process.env.DB_PASSWORD || "",
    DB_NAME: process.env.DB_NAME || "phc_dashboard",
  },
  images: {
          domains: ["dash.doctorphc.id", "your-domain.com"],
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  serverRuntimeConfig: {
    timeout: 30000, // 30 seconds
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
};

export default nextConfig;
