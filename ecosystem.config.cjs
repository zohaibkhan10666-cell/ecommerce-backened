// PM2 ecosystem for load balancing - multi-instance cluster mode
// npm i -g pm2
// cd backened
// pm2 start ecosystem.config.cjs --env production
// pm2 save
// pm2 startup

module.exports = {
  apps: [{
    name: 'ecommerce-backend',
    script: './server.mjs',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster', // Built-in round-robin LB on single port
    env: {
      NODE_ENV: 'development',
      PORT: 8000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    viz: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    kill_timeout: 5000,
    node_args: ['--no-deprecation']
  }]
};

