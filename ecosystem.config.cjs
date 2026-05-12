/**
 * PM2 ecosystem config for VPS / semi-dedicated hosting.
 * Usage: pm2 start ecosystem.config.cjs
 *        pm2 save
 *        pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "affiliatedeals",
      script: "./artifacts/api-server/dist/index.mjs",
      interpreter: "node",
      interpreter_args: "--enable-source-maps",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
