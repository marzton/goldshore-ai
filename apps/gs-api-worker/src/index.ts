import { Hono } from 'hono';
import users from './routes/users';
import health from './routes/health';
import ai from './routes/ai';

type Env = {
  API_KV: KVNamespace;
  DB: D1Database;
  ASSETS: R2Bucket;
  AI: any;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('GoldShore API'));

// Core routes
app.route('/health', health);
app.route('/ai', ai);
app.route('/users', users);

// V1 Routes
const v1 = new Hono<{ Bindings: Env }>();

v1.route('/users', users);
v1.get('/agents', (c) => c.json({ agents: ['agent-alpha', 'agent-beta'] }));
v1.get('/models', (c) => c.json({ models: ['gpt-4', 'claude-3'] }));
v1.get('/logs', (c) => c.json({ logs: ['log1', 'log2'] }));

app.route('/v1', v1);

// user
import user from './routes/user';
app.route('/user', user);

// system
import system from './routes/system';
app.route('/system', system);

export default app;
