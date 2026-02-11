// apps/goldshore-api/src/index.ts

import { Hono } from 'hono';
import {
  createAuthMiddleware,
  requireRole,
  AuthContext,
} from '@goldshore/auth';

// Define a type for our Cloudflare Worker bindings
type Bindings = {
  CF_TEAM_DOMAIN: string;
  CF_ACCESS_AUD: string;
};

const app = new Hono<{ Bindings: Bindings } & AuthContext>();

// --- Middleware ---

// This middleware will run on every request, verifying the Cloudflare Access JWT.
// It reads the required configuration from the environment variables (bindings).
app.use('*', async (c, next) => {
  const authMiddleware = createAuthMiddleware({
    teamDomain: c.env.CF_TEAM_DOMAIN,
    audience: c.env.CF_ACCESS_AUD,
  });
  return authMiddleware(c, next);
});

// --- Public Routes ---

app.get('/', (c) => {
  return c.text('Hello from the GoldShore API!');
});

// --- Protected Routes ---

// A protected route that shows the user's identity.
// Any authenticated user can access this.
app.get('/v1/me', (c) => {
  const user = c.get('user');
  // The user is guaranteed to be present because the auth middleware ran
  return c.json(user);
});

// An admin-only route, protected by the `requireRole` middleware.
app.get('/v1/admin/dashboard', requireRole('admin'), (c) => {
  const user = c.get('user');
  return c.json({
    message: `Welcome to the admin dashboard, ${user?.email}!`,
    userInfo: user,
  });
});

export default app;
