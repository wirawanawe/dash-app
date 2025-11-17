import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Background worker removed - sync hanya dilakukan via tombol atau scheduled sync (via /api/sync/trigger)

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Bind to all interfaces
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Background worker removed - jobs akan diproses via API endpoints atau manual trigger
  console.log('ℹ️  Background worker removed. Jobs will be processed on-demand via API.');
  
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