import '@testing-library/jest-dom/vitest';

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
