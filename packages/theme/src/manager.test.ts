import test from 'node:test';
import assert from 'node:assert';
import { ThemeManager } from './manager.ts';

test('ThemeManager.init', async (t) => {
  await t.test('sets theme from localStorage if present', (t) => {
    const getItemMock = t.mock.fn((key: string) => {
      if (key === 'goldshore:theme') return JSON.stringify({ mode: 'dark' });
      return null;
    });
    const setAttributeMock = t.mock.fn();
    const removeAttributeMock = t.mock.fn();
    const classListAddMock = t.mock.fn();

    // @ts-ignore
    global.localStorage = { getItem: getItemMock };
    // @ts-ignore
    global.document = {
      documentElement: {
        setAttribute: setAttributeMock,
        removeAttribute: removeAttributeMock,
        classList: {
          add: classListAddMock
        },
        style: {
          setProperty: t.mock.fn(),
          removeProperty: t.mock.fn(),
        }
      }
    } as any;

    ThemeManager.init();

    assert.strictEqual(getItemMock.mock.callCount(), 1);
    // setAttribute called for 'data-theme'
    assert.ok(setAttributeMock.mock.calls.some(call => call.arguments[0] === 'data-theme' && call.arguments[1] === 'dark'));
    // removeAttribute called for 'data-density' and 'data-accent'
    assert.ok(removeAttributeMock.mock.calls.some(call => call.arguments[0] === 'data-density'));
    assert.ok(removeAttributeMock.mock.calls.some(call => call.arguments[0] === 'data-accent'));
    assert.strictEqual(classListAddMock.mock.callCount(), 1);
    assert.strictEqual(classListAddMock.mock.calls[0].arguments[0], 'gs-theme-ready');
  });

  await t.test('does nothing if localStorage is empty', (t) => {
    const getItemMock = t.mock.fn(() => null);
    const setAttributeMock = t.mock.fn();
    const removeAttributeMock = t.mock.fn();
    const classListAddMock = t.mock.fn();

    // @ts-ignore
    global.localStorage = { getItem: getItemMock };
    // @ts-ignore
    global.document = {
      documentElement: {
        setAttribute: setAttributeMock,
        removeAttribute: removeAttributeMock,
        classList: {
          add: classListAddMock
        },
        style: {
          setProperty: t.mock.fn(),
          removeProperty: t.mock.fn(),
        }
      }
    } as any;

    ThemeManager.init();

    assert.strictEqual(getItemMock.mock.callCount(), 1);
    // Still calls applyTheme with defaults
    assert.ok(setAttributeMock.mock.calls.some(call => call.arguments[0] === 'data-theme' && call.arguments[1] === 'dark'));
  });
});

test('ThemeManager.setTheme', (t) => {
  const getItemMock = t.mock.fn(() => null);
  const setItemMock = t.mock.fn();
  const setAttributeMock = t.mock.fn();
  const removeAttributeMock = t.mock.fn();

  // @ts-ignore
  global.localStorage = {
    getItem: getItemMock,
    setItem: setItemMock
  };
  // @ts-ignore
  global.document = {
    documentElement: {
      setAttribute: setAttributeMock,
      removeAttribute: removeAttributeMock,
      style: {
        setProperty: t.mock.fn(),
        removeProperty: t.mock.fn(),
      }
    }
  } as any;

  ThemeManager.setTheme('light');

  assert.strictEqual(setItemMock.mock.callCount(), 1);
  assert.strictEqual(setItemMock.mock.calls[0].arguments[0], 'goldshore:theme');
  assert.strictEqual(JSON.parse(setItemMock.mock.calls[0].arguments[1]).mode, 'light');

  assert.ok(setAttributeMock.mock.calls.some(call => call.arguments[0] === 'data-theme' && call.arguments[1] === 'light'));
});
