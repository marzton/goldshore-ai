import { Hono } from 'hono'

type Env = {
  CONTACT_TO_EMAIL?: string
  CONTACT_FROM_EMAIL?: string
  CONTACT_FROM_NAME?: string
  CONTACT_SUBJECT_PREFIX?: string
}

type ContactPayload = {
  name?: string
  email?: string
  message?: string
}

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => c.text('Hello from astro-gs-api!'))

app.get('/health', (c) => {
  return c.json({
    ok: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  })
})

app.post('/contact', async (c) => {
  const body = await c.req.json<ContactPayload>().catch(() => null)

  if (!body?.name || !body?.email || !body?.message) {
    return c.json({ ok: false, error: 'name, email, and message are required' }, 400)
  }

  const { CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = c.env

  if (!CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    return c.json(
      {
        ok: false,
        error: 'mailer_not_configured',
        message: 'CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL must be set'
      },
      503
    )
  }

  const fromName = c.env.CONTACT_FROM_NAME || 'Gold Shore Contact Form'
  const subjectPrefix = c.env.CONTACT_SUBJECT_PREFIX || '[Gold Shore]'

  const mailChannelsResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: CONTACT_TO_EMAIL, name: 'Gold Shore Team' }]
        }
      ],
      from: {
        email: CONTACT_FROM_EMAIL,
        name: fromName
      },
      reply_to: {
        email: body.email,
        name: body.name
      },
      subject: `${subjectPrefix} New contact request from ${body.name}`,
      content: [
        {
          type: 'text/plain',
          value: `Name: ${body.name}\nEmail: ${body.email}\n\nMessage:\n${body.message}`
        }
      ]
    })
  })

  if (!mailChannelsResponse.ok) {
    const errorText = await mailChannelsResponse.text()
    return c.json({ ok: false, error: 'email_send_failed', detail: errorText }, 502)
  }

  return c.json({ ok: true })
})

export default app
