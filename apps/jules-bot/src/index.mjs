// apps/jules-bot/src/index.mjs
// This is a placeholder/starter implementation for the Jules/Palette bot server.
// It includes the logic for handling the /palette improve command.

import http from 'http';
import crypto from 'node:crypto';

// Assuming some environment variables are set:
// GITHUB_TOKEN
// GITHUB_ORG
// GITHUB_REPO
// WEBHOOK_SECRET

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = process.env.GITHUB_ORG;
const GITHUB_REPO = process.env.GITHUB_REPO;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Validate required environment variables
if (!GITHUB_TOKEN) {
  console.error("Missing required environment variable: GITHUB_TOKEN");
  process.exit(1);
}
if (!GITHUB_ORG) {
  console.error("Missing required environment variable: GITHUB_ORG");
  process.exit(1);
}
if (!GITHUB_REPO) {
  console.error("Missing required environment variable: GITHUB_REPO");
  process.exit(1);
}
if (!WEBHOOK_SECRET) {
  console.error("Missing required environment variable: WEBHOOK_SECRET");
  process.exit(1);
}

// Helper to post a comment using fetch (no external dependencies)
async function postComment(prNumber, body) {
  const url = `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/issues/${prNumber}/comments`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    const safePrNumber = String(prNumber).replace(/\r|\n/g, '');
    console.error(`Failed to post comment to PR #${safePrNumber}: ${res.status} ${res.statusText}: ${await res.text()}`);
  }
}

// Helper to dispatch the Palette action
async function dispatchPaletteAction(type, data) {
  const url = `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/dispatches`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: type,
      client_payload: data,
    }),
  });

  if (!res.ok) {
    console.error(`Failed to dispatch Palette Action: ${res.status} ${await res.text()}`);
  }
}

// Main event handler logic
async function handleEvent(eventName, payload) {
  const { action } = payload;

  // --- Palette: PR comment command ---
  if (eventName === 'issue_comment' && action === 'created') {
    const body = (payload.comment.body || '').trim().toLowerCase();
    const isPR = !!payload.issue.pull_request;
    const prNumber = isPR ? payload.issue.number : null;

    if (!prNumber) return;

    // Command: /palette improve
    if (body.startsWith('/palette')) {
      await postComment(prNumber, '🎨 Palette: scanning this PR for a micro-UX improvement…');

      await dispatchPaletteAction('PALETTE_RUN', {
        pr: prNumber,
      });

      await postComment(
        prNumber,
        '🎨 Palette: requested a UX sweep via GitHub Actions. I will open a small UX PR if I find a clean win.'
      );
    }
  }
}

// Helper: Verify GitHub Webhook Signature (Sentinel Protection)
function verifySignature(secret, header, payload) {
  if (!header || !header.startsWith('sha256=')) return false;

  const sigHex = header.slice(7); // Remove 'sha256='
  if (!sigHex) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');

  const sigBuffer = Buffer.from(sigHex, 'hex');
  const digestBuffer = Buffer.from(digest, 'hex');

  // Avoid timing attacks and length errors
  if (sigBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}

const MAX_BODY_SIZE = 1024 * 1024; // 1MB max body size
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    let body = '';
    let bodyTooLarge = false;
    req.on('data', chunk => {
      if (bodyTooLarge) return;
      body += chunk.toString('utf8');
      if (body.length > MAX_BODY_SIZE) {
        bodyTooLarge = true;
        res.writeHead(413, { 'Content-Type': 'text/plain' });
        res.end('Payload Too Large');
        req.destroy();
      }
    });
    req.on('end', async () => {
      if (bodyTooLarge) return;

      // Verify Signature
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Missing Signature');
        return;
      }

      try {
        if (!verifySignature(WEBHOOK_SECRET, signature, body)) {
          console.warn('Invalid signature attempt');
          res.writeHead(401, { 'Content-Type': 'text/plain' });
          res.end('Invalid Signature');
          return;
        }

        const payload = JSON.parse(body);
        const eventName = req.headers['x-github-event'];
        await handleEvent(eventName, payload);
        res.writeHead(200);
        res.end('OK');
      } catch (err) {
        console.error('Signature verification or handling error:', err);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
   const PORT = process.env.PORT || 3000;
   server.listen(PORT, () => {
     console.log(`Bot server listening on port ${PORT}`);
   });
}

export { handleEvent, dispatchPaletteAction };
