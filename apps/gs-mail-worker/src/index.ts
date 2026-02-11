import { Hono } from 'hono';
import PostalMime from 'postal-mime';

const app = new Hono();

app.get('/', (c) => c.text('GoldShore Mail Worker'));

app.post('/email', async (c) => {
  const rawEmail = await c.req.arrayBuffer();
  const parser = new PostalMime();
  const email = await parser.parse(rawEmail);
  console.log('Received email:', email.subject);
  return c.json({ status: 'ok' });
});

export default {
  fetch: app.fetch,
  async email(message: any, env: any, ctx: any) {
    console.log('Received email via SMTP handler');
  }
};
