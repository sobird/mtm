// The merchant-admin shell and the shared UI package must share a single toast
// context so components can be wrapped by either provider in tests or the app.
export { ToastProvider, useToast } from '@mtm/ui';
export type { ToastApi, ToastType } from '@mtm/ui';
