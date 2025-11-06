import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { startBackgroundWorker } from './lib/backgroundWorker.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Bind to all interfaces
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Background worker disabled by default to prevent CPU overload
  // Enable only if needed by setting ENABLE_BACKGROUND_WORKER=true in .env
  if (process.env.ENABLE_BACKGROUND_WORKER === 'true') {
    console.log('🚀 Initializing background worker...');
    try {
      await startBackgroundWorker();
      console.log('✅ Background worker initialized');
    } catch (error) {
      console.error('❌ Failed to start background worker:', error);
      // Continue server startup even if worker fails
    }
  } else {
    console.log('⚠️  Background worker disabled (set ENABLE_BACKGROUND_WORKER=true to enable)');
  }
  
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Set proper headers for external access
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Server error:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error('Server failed to start:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`✅ Server ready on http://${hostname}:${port}`);
    });
}); 