import test from 'node:test';
import assert from 'node:assert/strict';
import { themeService, THEME_STORAGE_KEY } from './themeService';

test('themeService defaults to dark in non-DOM environment and toggles cleanly with mocked DOM/storage', () => {
  assert.equal(themeService.getTheme(), 'dark');

  const store = new Map<string, string>();
  const classes = new Set<string>(['dark']);
  let dispatchedMode = '';

  const origWindow = (globalThis as any).window;
  const origDocument = (globalThis as any).document;
  const origLocalStorage = (globalThis as any).localStorage;

  try {
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    };
    (globalThis as any).document = {
      documentElement: {
        classList: {
          add: (...tokens: string[]) => tokens.forEach((t) => classes.add(t)),
          remove: (...tokens: string[]) => tokens.forEach((t) => classes.delete(t)),
          contains: (token: string) => classes.has(token),
        },
        style: { colorScheme: 'dark' },
      },
    };
    (globalThis as any).window = {
      dispatchEvent: (ev: CustomEvent) => {
        dispatchedMode = ev.detail;
        return true;
      },
    };

    const next1 = themeService.toggleTheme();
    assert.equal(next1, 'light');
    assert.equal(store.get(THEME_STORAGE_KEY), 'light');
    assert.equal(classes.has('light'), true);
    assert.equal(classes.has('dark'), false);
    assert.equal(dispatchedMode, 'light');

    const next2 = themeService.toggleTheme();
    assert.equal(next2, 'dark');
    assert.equal(store.get(THEME_STORAGE_KEY), 'dark');
    assert.equal(classes.has('dark'), true);
    assert.equal(classes.has('light'), false);
    assert.equal(dispatchedMode, 'dark');
  } finally {
    (globalThis as any).window = origWindow;
    (globalThis as any).document = origDocument;
    (globalThis as any).localStorage = origLocalStorage;
  }
});
