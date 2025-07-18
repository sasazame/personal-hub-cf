import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRouter from './routes/auth';
import { todoRouter } from './routes/todos';
import { goalRouter } from './routes/goals';
import eventsRouter from './routes/events';
import notesRouter from './routes/notes';
import { momentsRouter } from './routes/moments';
import pomodoroRouter from './routes/pomodoro';
import { dashboard } from './routes/dashboard';
import searchRouter from './routes/search';
import { exportRouter } from './routes/export';
import type { D1Database } from '@cloudflare/workers-types';

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

// Mount todo routes
app.route('/api/todos', todoRouter);

// Mount goal routes
app.route('/api/goals', goalRouter);

// Mount events routes
app.route('/api/events', eventsRouter);

// Mount notes routes
app.route('/api/notes', notesRouter);

// Mount moments routes
app.route('/api/moments', momentsRouter);

// Mount pomodoro routes
app.route('/api/pomodoro', pomodoroRouter);

// Mount dashboard routes
app.route('/api/dashboard', dashboard);

// Mount search routes
app.route('/api/search', searchRouter);

// Mount export routes
app.route('/api/export', exportRouter);

export default app;