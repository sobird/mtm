/**
 * Central TanStack Query keys. Parameterized keys always nest their input so a
 * query and all of its filtered variants can be invalidated together.
 */
export const queryKeys = {
  account: ['account'] as const,
  menu: ['menu'] as const,
  menuBadges: ['menuBadges'] as const,
  merchant: ['merchant'] as const,
  coupons: (params?: Record<string, unknown>) => ['coupons', params ?? {}] as const,
  coupon: (id: string | number) => ['coupon', id] as const,
  campaigns: (params?: Record<string, unknown>) => ['campaigns', params ?? {}] as const,
  messages: ['messages'] as const,
  violationOverview: ['violationOverview'] as const,
  analysis: (key: string) => ['analysis', key] as const,
  productSelling: ['productSelling'] as const,
  gold: ['gold'] as const,
  merchantTasks: ['merchantTasks'] as const,
};
