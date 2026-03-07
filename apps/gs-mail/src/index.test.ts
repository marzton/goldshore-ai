import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index';

class MockMessage {
  from: string;
  to: string;
  headers: Headers;
  forwardedTo: string[] = [];
  rejection?: string;

  constructor(from: string, to: string, subject: string) {
    this.from = from;
    this.to = to;
    this.headers = new Headers({ subject });
  }

  async forward(target: string): Promise<void> {
    this.forwardedTo.push(target);
  }

  setReject(reason: string): void {
    this.rejection = reason;
  }
}

class MockKV {
  private payload: string | null;
  puts: Array<{ key: string; value: string }> = [];

  constructor(payload: string | null) {
    this.payload = payload;
  }

  async get(): Promise<string | null> {
    return this.payload;
  }

  async put(key: string, value: string): Promise<void> {
    this.puts.push({ key, value });
    this.payload = value;
  }
}

const uuidFromIndex = (index: number) => `${index.toString(16).padStart(8, '0')}-aaaa-4aaa-8aaa-${index
  .toString(16)
  .padStart(12, '0')}`;

afterEach(() => {
  mock.restoreAll();
});

describe('gs-mail email handler persistence', () => {
  it('prepends a new log entry to existing EMAIL_INBOX_LOGS', async () => {
    mock.method(globalThis.crypto, 'randomUUID', () => '11111111-1111-4111-8111-111111111111');

    const kv = new MockKV(
      JSON.stringify([
        {
          id: uuidFromIndex(1),
          from: 'old@goldshore.ai',
          to: 'inbox@goldshore.ai',
          subject: 'Older',
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    const waits: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p) } as ExecutionContext;
    const message = new MockMessage('sender@goldshore.ai', 'inbox@goldshore.ai', 'Hello');

    await worker.email(message as unknown as ForwardableEmailMessage, { GS_CONFIG: kv as unknown as KVNamespace, MAIL_FORWARD_TO: 'ops@goldshore.ai' }, ctx);
    await Promise.all(waits);

    assert.equal(message.forwardedTo[0], 'ops@goldshore.ai');
    const payload = JSON.parse(kv.puts[0].value);
    assert.equal(payload.length, 2);
    assert.equal(payload[0].id, '11111111-1111-4111-8111-111111111111');
    assert.equal(payload[1].id, uuidFromIndex(1));
  });

  it('keeps only the most recent 100 entries', async () => {
    mock.method(globalThis.crypto, 'randomUUID', () => '22222222-2222-4222-8222-222222222222');

    const existing = Array.from({ length: 100 }, (_, index) => ({
      id: uuidFromIndex(index + 10),
      from: `from-${index}@goldshore.ai`,
      to: 'inbox@goldshore.ai',
      subject: `Subject ${index}`,
      timestamp: new Date(2026, 0, 1, 0, index).toISOString(),
    }));

    const kv = new MockKV(JSON.stringify(existing));
    const waits: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p) } as ExecutionContext;
    const message = new MockMessage('next@goldshore.ai', 'inbox@goldshore.ai', 'Newest');

    await worker.email(message as unknown as ForwardableEmailMessage, { GS_CONFIG: kv as unknown as KVNamespace }, ctx);
    await Promise.all(waits);

    const payload = JSON.parse(kv.puts[0].value);
    assert.equal(payload.length, 100);
    assert.equal(payload[0].id, '22222222-2222-4222-8222-222222222222');
    assert.equal(payload[99].id, uuidFromIndex(108));
  });

  it('handles malformed existing KV payloads without crashing', async () => {
    mock.method(globalThis.crypto, 'randomUUID', () => '33333333-3333-4333-8333-333333333333');
    const parseErrorSpy = mock.method(console, 'error', () => {});

    const kv = new MockKV('{ malformed json');
    const waits: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p) } as ExecutionContext;
    const message = new MockMessage('safe@goldshore.ai', 'inbox@goldshore.ai', 'Recover');

    await worker.email(message as unknown as ForwardableEmailMessage, { GS_CONFIG: kv as unknown as KVNamespace }, ctx);
    await Promise.all(waits);

    const payload = JSON.parse(kv.puts[0].value);
    assert.equal(payload.length, 1);
    assert.equal(payload[0].id, '33333333-3333-4333-8333-333333333333');
    assert.ok(parseErrorSpy.mock.calls.some((call) => String(call.arguments[0]).includes('Failed to parse EMAIL_INBOX_LOGS payload')));
  });
});
