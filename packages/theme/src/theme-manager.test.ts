import test from 'node:test';
import assert from 'node:assert';
import { loadThemeSettings, defaults } from './theme-manager.ts';

test('loadThemeSettings', async (t) => {

  await t.test('returns defaults when localStorage is undefined', () => {
    const originalLocalStorage = global.localStorage;
    // @ts-ignore
    delete global.localStorage;

    const settings = loadThemeSettings();
    assert.deepStrictEqual(settings, defaults);

    // Restore
    global.localStorage = originalLocalStorage;
  });

  await t.test('returns defaults when localStorage is empty', (t) => {
    const getItemMock = t.mock.fn(() => null);
    // @ts-ignore
    global.localStorage = { getItem: getItemMock };

    const settings = loadThemeSettings();
    assert.deepStrictEqual(settings, defaults);
    assert.strictEqual(getItemMock.mock.callCount(), 1);
    assert.strictEqual(getItemMock.mock.calls[0].arguments[0], 'goldshore:theme');
  });

  await t.test('returns saved settings when valid JSON is present', (t) => {
    const saved = {
      mode: 'light',
      density: 'compact',
      accent: 'gold',
    };
    const getItemMock = t.mock.fn(() => JSON.stringify(saved));
    // @ts-ignore
    global.localStorage = { getItem: getItemMock };

    const settings = loadThemeSettings();
    assert.deepStrictEqual(settings, saved);
  });

  await t.test('merges partial saved settings with defaults', (t) => {
    const saved = {
      mode: 'slate',
    };
    const getItemMock = t.mock.fn(() => JSON.stringify(saved));
    // @ts-ignore
    global.localStorage = { getItem: getItemMock };

    const settings = loadThemeSettings();
    assert.deepStrictEqual(settings, {
      ...defaults,
      mode: 'slate',
    });
  });

  await t.test('handles invalid JSON by returning defaults and warning', (t) => {
    const getItemMock = t.mock.fn(() => 'invalid-json');
    const warnMock = t.mock.fn();
    const originalWarn = console.warn;
    console.warn = warnMock;

    // @ts-ignore
    global.localStorage = { getItem: getItemMock };

    const settings = loadThemeSettings();
    assert.deepStrictEqual(settings, defaults);
    assert.strictEqual(warnMock.mock.callCount(), 1);

    // Restore
    console.warn = originalWarn;
  });
});
