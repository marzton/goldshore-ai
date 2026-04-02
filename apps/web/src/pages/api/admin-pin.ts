import type { APIRoute } from 'astro';
import { isValidEmail } from '../../utils/security';

const getEmail = async (request: Request) => {
  if (!request.headers.get('content-type')?.includes('form')) {
    return '';
  }
  const form = await request.formData();
  const email = form.get('email');
  return typeof email === 'string' ? email.trim() : '';
};

export const POST: APIRoute = async ({ request, locals }) => {
  const email = await getEmail(request);

  if (!email || !isValidEmail(email)) {
    return new Response('Enter a valid email address.', { status: 400 });
  }

  const env = (locals.runtime?.env ?? {}) as {
    CLOUDFLARE_PIN_ENDPOINT?: string;
    CLOUDFLARE_PIN_TOKEN?: string;
    KV?: KVNamespace;
  };

  const payload = {
    email,
    requestedAt: new Date().toISOString(),
    source: 'goldshore-web-admin-modal'
  };

  if (env.KV) {
    try {
      await env.KV.put(`admin-pin:${crypto.randomUUID()}`, JSON.stringify(payload), {
        expirationTtl: 60 * 60 * 24
      });
    } catch (error) {
      console.error('Failed to store admin pin request in KV.', error);
      return new Response('Pin service is temporarily unavailable. Please retry shortly.', { status: 503 });
    }
  }

  if (env.CLOUDFLARE_PIN_ENDPOINT) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (env.CLOUDFLARE_PIN_TOKEN) {
        (headers as Record<string, string>).Authorization = `Bearer ${env.CLOUDFLARE_PIN_TOKEN}`;
      }

      const response = await fetch(env.CLOUDFLARE_PIN_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return new Response('Pin request reached Cloudflare but did not complete. Please retry.', { status: 502 });
      }

      return new Response('Pin request sent. Check your inbox for the Cloudflare access code.', { status: 200 });
    } catch (error) {
      console.error('Cloudflare pin request failed.', error);
      return new Response('Cloudflare pin service is unavailable right now. Please retry shortly.', { status: 503 });
    }
  }

  return new Response('Pin request queued. Configure CLOUDFLARE_PIN_ENDPOINT to enable direct delivery.', {
    status: 202
  });
};

export const GET: APIRoute = async () => new Response('Method not allowed.', { status: 405 });
