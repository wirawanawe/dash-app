module.exports = {
  apps: [
    {
      name: "dash-app",
      script: "npm",
      args: "start",
      cwd: "/path/to/your/project", // Update this path
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        DB_HOST: "localhost",
        DB_USER: "root",
        DB_PASSWORD: "", // Set your MySQL password here
        DB_NAME: "phc_dashboard",
        JWT_SECRET:
          "supersecretkey123456789supersecretkey123456789supersecretkey",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env_file: ".env.production",
      // Health check
      health_check_url: "http://localhost:3000/api/health",
      health_check_grace_period: 3000,
    },
  ],
};
