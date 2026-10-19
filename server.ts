import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUsers } from './src/db/users.ts';
import { db } from './src/db/index.ts';
import { orders, smartBoxes } from './src/db/schema.ts';
import { desc } from 'drizzle-orm';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: '3al-BaB Platform API', time: new Date().toISOString() });
});

// Sync / Register authenticated user into PostgreSQL
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user found' });
    }
    const { role, name } = req.body;
    const user = await getOrCreateUser(req.user.uid, req.user.email || '', name, role);
    res.json({ success: true, user });
  } catch (err: any) {
    console.error('API /api/auth/sync error:', err);
    res.status(500).json({ error: err.message || 'Database sync failed' });
  }
});

// Get current user profile from DB
app.get('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user found' });
    }
    const userList = await getUsers();
    const currentUser = userList.find((u) => u.uid === req.user?.uid);
    res.json({ user: currentUser || null });
  } catch (err: any) {
    console.error('API /api/user/profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch user' });
  }
});

// Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const list = await db.select().from(orders).orderBy(desc(orders.createdAt));
    res.json(list);
  } catch (err: any) {
    console.error('API /api/orders error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

// Smart Boxes API
app.get('/api/smart-boxes', async (req, res) => {
  try {
    const boxes = await db.select().from(smartBoxes);
    res.json(boxes);
  } catch (err: any) {
    console.error('API /api/smart-boxes error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch smart boxes' });
  }
});

// Vite Middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`3al-BaB Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
