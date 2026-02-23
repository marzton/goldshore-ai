import test from 'node:test';
import assert from 'node:assert';
import { prefersReducedMotion, onReducedMotionChange } from './motion.ts';

test('prefersReducedMotion', async (t) => {
  await t.test('returns true if media query matches', (t) => {
    const matchMediaMock = t.mock.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    // @ts-ignore
    global.window = { matchMedia: matchMediaMock };

    assert.strictEqual(prefersReducedMotion(), true);
    assert.strictEqual(matchMediaMock.mock.callCount(), 1);
  });

  await t.test('returns false if media query does not match', (t) => {
    const matchMediaMock = t.mock.fn(() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    // @ts-ignore
    global.window = { matchMedia: matchMediaMock };

    assert.strictEqual(prefersReducedMotion(), false);
  });

  await t.test('returns false if window is undefined', () => {
    // @ts-ignore
    global.window = undefined;
    assert.strictEqual(prefersReducedMotion(), false);
  });
});

test('onReducedMotionChange', async (t) => {
  await t.test('registers and unregisters listener', (t) => {
    const addEventListenerMock = t.mock.fn();
    const removeEventListenerMock = t.mock.fn();
    const matchMediaMock = t.mock.fn(() => ({
      matches: false,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    }));

    // @ts-ignore
    global.window = { matchMedia: matchMediaMock };

    const callback = t.mock.fn();
    const cleanup = onReducedMotionChange(callback);

    assert.strictEqual(addEventListenerMock.mock.callCount(), 1);
    assert.strictEqual(addEventListenerMock.mock.calls[0].arguments[0], 'change');

    cleanup();
    assert.strictEqual(removeEventListenerMock.mock.callCount(), 1);
    assert.strictEqual(removeEventListenerMock.mock.calls[0].arguments[0], 'change');
  });

  await t.test('callback is executed when media query changes', (t) => {
    let listener: (event: any) => void = () => {};
    const addEventListenerMock = t.mock.fn((_type: string, l: any) => {
      listener = l;
    });

    const matchMediaMock = t.mock.fn(() => ({
      matches: false,
      addEventListener: addEventListenerMock,
      removeEventListener: () => {},
    }));

    // @ts-ignore
    global.window = { matchMedia: matchMediaMock };

    const callback = t.mock.fn();
    onReducedMotionChange(callback);

    listener({ matches: true });
    assert.strictEqual(callback.mock.callCount(), 1);
    assert.strictEqual(callback.mock.calls[0].arguments[0], true);

    listener({ matches: false });
    assert.strictEqual(callback.mock.callCount(), 2);
    assert.strictEqual(callback.mock.calls[1].arguments[0], false);
  });
});
