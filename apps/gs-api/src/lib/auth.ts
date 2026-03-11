const HEX_PAIR_LENGTH = 2;

const hexToBuffer = (hex: string): ArrayBuffer => {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % HEX_PAIR_LENGTH !== 0) {
    throw new Error('Invalid signature format');
  }

  const bytes = new Uint8Array(hex.length / HEX_PAIR_LENGTH);
  for (let index = 0; index < bytes.length; index += 1) {
    const offset = index * HEX_PAIR_LENGTH;
    bytes[index] = Number.parseInt(hex.slice(offset, offset + HEX_PAIR_LENGTH), 16);
  }

  return bytes.buffer;
};

export async function verifySignature(request: Request, secret: string) {
  const signature = request.headers.get('X-Proxy-Signature');
  if (!signature || !secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const data = new URL(request.url).pathname;

  try {
    return await crypto.subtle.verify('HMAC', key, hexToBuffer(signature), encoder.encode(data));
  } catch {
    return false;
  }
}
