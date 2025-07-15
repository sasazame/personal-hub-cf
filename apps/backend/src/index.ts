import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRouter from './routes/auth';

type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({ message: 'Hello from Personal Hub API!' });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount auth routes
app.route('/api/auth', authRouter);

export default app;