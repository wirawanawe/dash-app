module.exports = {
  apps: [
    {
      name: "dash-app",
      script: "npm",
      args: "start",
      cwd: "/Volumes/Data-2/PHC/Project/dash-app",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      merge_logs: true,
      kill_timeout: 5000,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],

  deploy: {
    production: {
      user: "your-user",
      host: "your-server-ip",
      ref: "origin/master",
      repo: "your-git-repo",
      path: "/var/www/dash-app",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.cjs --env production",
      "pre-setup": "",
    },
  },
};
