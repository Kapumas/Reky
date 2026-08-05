export const DASHBOARD_AUTH_HEADER = 'x-dashboard-password';

export function isDashboardConfigured(): boolean {
  return !!process.env.DASHBOARD_PASSWORD;
}

export function isValidDashboardPassword(password: string | null | undefined): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  return !!expected && !!password && password === expected;
}
