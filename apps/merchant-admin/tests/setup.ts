process.env.MERCHANT_DATABASE_URL ||=
  process.env.MERCHANT_TEST_DATABASE_URL ?? 'postgresql://mtm:mtm@localhost:5432/commerce_merchant_test?schema=public';

import '@testing-library/jest-dom/vitest';

process.env.AUTH_SECRET ||= 'test-secret';

// antd components (Table, DatePicker, Upload) rely on browser APIs jsdom lacks.
// Some tests opt into the node environment, so guard these browser-only globals.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = () => {};
  }
}
