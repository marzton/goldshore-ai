import { Hono } from 'hono'

type Env = {
  API: Fetcher
  GATEWAY_KV: KVNamespace
  AI: any
}

const app = new Hono<{ Bindings: Env }>()

app.get('/health', (c) => c.json({ status: 'ok', service: 'gs-gateway' }))

// Example specific routes for Gateway processing
app.get('/user/login', (c) => c.json({ message: 'Gateway Login Placeholder' }))
app.post('/v1/chat', (c) => c.json({ message: 'Gateway Chat Placeholder' }))

// Forwarding fallback
app.all('*', (c) => {
  return c.env.API.fetch(c.req.raw)
})

export default app
