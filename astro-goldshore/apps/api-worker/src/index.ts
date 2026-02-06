import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello from astro-gs-api!'))

app.get('/health', (c) => {
  return c.json({
    ok: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  })
})

export default app