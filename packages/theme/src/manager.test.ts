import test from 'node:test';
import assert from 'node:assert';
import { ThemeManager } from './manager.ts';
import { initModal } from '../index.ts';

test('ThemeManager.init', async (t) => {
  await t.test('sets theme from localStorage if present', (t) => {
    const getItemMock = t.mock.fn((key: string) => {
      if (key === 'goldshore:theme') {
        return JSON.stringify({ mode: 'light', density: 'comfortable', accent: 'blue' });
      }
      return null;
    });
    const setAttributeMock = t.mock.fn();
    const removeAttributeMock = t.mock.fn();

    // @ts-ignore
    global.localStorage = { getItem: getItemMock };
    // @ts-ignore
    global.document = {
      documentElement: {
        setAttribute: setAttributeMock,
        removeAttribute: removeAttributeMock,
        classList: { add: t.mock.fn() },
        style: { setProperty: t.mock.fn(), removeProperty: t.mock.fn() }
      }
    } as any;

    ThemeManager.init();

    assert.strictEqual(getItemMock.mock.callCount(), 1);
    assert.ok(
      setAttributeMock.mock.calls.some(
        (call) => call.arguments[0] === 'data-theme' && call.arguments[1] === 'light',
      ),
    );
  });

  await t.test('uses defaults if localStorage is empty', (t) => {
    const getItemMock = t.mock.fn(() => null);
    const setAttributeMock = t.mock.fn();
    const removeAttributeMock = t.mock.fn();

    // @ts-ignore
    global.localStorage = { getItem: getItemMock };
    // @ts-ignore
    global.document = {
      documentElement: {
        setAttribute: setAttributeMock,
        removeAttribute: removeAttributeMock,
        classList: { add: t.mock.fn() },
        style: { setProperty: t.mock.fn(), removeProperty: t.mock.fn() }
      }
    } as any;

    ThemeManager.init();

    assert.strictEqual(getItemMock.mock.callCount(), 1);
    assert.ok(
      setAttributeMock.mock.calls.some(
        (call) => call.arguments[0] === 'data-theme' && call.arguments[1] === 'dark',
      ),
    );
  });
});

test('ThemeManager.setTheme', (t) => {
  const setItemMock = t.mock.fn();
  const getItemMock = t.mock.fn(() => JSON.stringify({ mode: 'dark', density: 'comfortable', accent: 'blue' }));
  const setAttributeMock = t.mock.fn();
  const removeAttributeMock = t.mock.fn();

  // @ts-ignore
  global.localStorage = { setItem: setItemMock, getItem: getItemMock };
  // @ts-ignore
  global.document = {
    documentElement: {
      setAttribute: setAttributeMock,
      removeAttribute: removeAttributeMock,
      classList: { add: t.mock.fn() },
      style: { setProperty: t.mock.fn(), removeProperty: t.mock.fn() }
    }
  } as any;

  ThemeManager.setTheme('light');

  assert.strictEqual(setItemMock.mock.callCount(), 1);
  assert.strictEqual(setItemMock.mock.calls[0].arguments[0], 'goldshore:theme');
  assert.ok(String(setItemMock.mock.calls[0].arguments[1]).includes('"mode":"light"'));

  assert.ok(
    setAttributeMock.mock.calls.some(
      (call) => call.arguments[0] === 'data-theme' && call.arguments[1] === 'light',
    ),
  );
});

test('initModal open/close restores focus and traps tab', () => {
  type Listener = (event: any) => void;

  class FakeClassList {
    private classes = new Set<string>();

    add(...tokens: string[]) {
      tokens.forEach((token) => this.classes.add(token));
    }

    remove(...tokens: string[]) {
      tokens.forEach((token) => this.classes.delete(token));
    }

    contains(token: string) {
      return this.classes.has(token);
    }
  }

  class FakeElement {
    classList = new FakeClassList();
    listeners: Record<string, Listener[]> = {};
    attrs = new Map<string, string>();
    innerHTML = '';
    isConnected = true;

    constructor(
      public readonly name: string,
      private readonly ownerDocument: any,
    ) {}

    addEventListener(type: string, listener: Listener) {
      this.listeners[type] ??= [];
      this.listeners[type].push(listener);
    }

    dispatch(type: string, event: any = {}) {
      const listeners = this.listeners[type] ?? [];
      for (const listener of listeners) listener(event);
    }

    querySelector<T = FakeElement>(selector: string): T | null {
      return (this.ownerDocument.queryFrom(this.name, selector) as T) ?? null;
    }

    querySelectorAll<T = FakeElement>(selector: string): T[] {
      return (this.ownerDocument.queryAllFrom(this.name, selector) as T[]) ?? [];
    }

    closest<T = FakeElement>(selector: string): T | null {
      if (selector === '[data-gs-modal-open]' && this.attrs.has('data-gs-modal-open')) {
        return this as unknown as T;
      }
      return null;
    }

    getAttribute(name: string) {
      return this.attrs.get(name) ?? null;
    }

    setAttribute(name: string, value: string) {
      this.attrs.set(name, value);
    }

    hasAttribute(name: string) {
      return this.attrs.has(name);
    }

    focus() {
      this.ownerDocument.activeElement = this;
    }
  }

  const listeners: Record<string, Listener[]> = {};
  const documentElement = new FakeElement('documentElement', null as any);
  const fakeDocument: any = {
    activeElement: null,
    documentElement,
    listeners,
    querySelector(selector: string) {
      if (selector === '[data-gs-modal]') return root;
      return null;
    },
    queryFrom(owner: string, selector: string) {
      if (owner === 'root' && selector === '[data-gs-modal-backdrop]') return backdrop;
      if (owner === 'root' && selector === '[data-gs-modal-close]') return close;
      if (owner === 'root' && selector === '[data-gs-modal-body]') return body;
      if (owner === 'root' && selector === '.gs-modal-panel') return panel;
      return null;
    },
    queryAllFrom(owner: string, selector: string) {
      if (owner === 'panel' && selector.includes('a[href]')) return [close, field];
      return [];
    },
    addEventListener(type: string, listener: Listener) {
      listeners[type] ??= [];
      listeners[type].push(listener);
    }
  };

  documentElement['ownerDocument'] = fakeDocument;

  const root = new FakeElement('root', fakeDocument);
  const backdrop = new FakeElement('backdrop', fakeDocument);
  const close = new FakeElement('close', fakeDocument);
  const body = new FakeElement('body', fakeDocument);
  const panel = new FakeElement('panel', fakeDocument);
  const field = new FakeElement('field', fakeDocument);
  const opener = new FakeElement('opener', fakeDocument);
  opener.setAttribute('data-gs-modal-open', 'subscribe');

  const windowListeners: Record<string, Listener[]> = {};
  const fakeWindow: any = {
    addEventListener(type: string, listener: Listener) {
      windowListeners[type] ??= [];
      windowListeners[type].push(listener);
    }
  };

  // @ts-ignore
  global.document = fakeDocument;
  // @ts-ignore
  global.window = fakeWindow;
  // @ts-ignore
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  };

  initModal();

  const clickListeners = listeners.click;
  assert.ok(clickListeners?.length);
  clickListeners[0]({ target: opener });

  assert.ok(root.classList.contains('is-open'));
  assert.ok(documentElement.classList.contains('gs-lock'));
  assert.strictEqual(fakeDocument.activeElement, close);

  const keydownListeners = windowListeners.keydown;
  assert.ok(keydownListeners?.length);

  close.focus();
  let prevented = false;
  keydownListeners[0]({ key: 'Tab', shiftKey: true, preventDefault: () => { prevented = true; } });
  assert.ok(prevented);
  assert.strictEqual(fakeDocument.activeElement, field);

  keydownListeners[0]({ key: 'Escape', preventDefault: () => {} });
  assert.ok(!root.classList.contains('is-open'));
  assert.ok(!documentElement.classList.contains('gs-lock'));
  assert.strictEqual(fakeDocument.activeElement, opener);

  // Escape while closed should be a no-op.
  keydownListeners[0]({ key: 'Escape', preventDefault: () => {} });
  assert.ok(!root.classList.contains('is-open'));
});
