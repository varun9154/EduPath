/* src/lib/accessGuard.ts */

/**
 * EduPath Authentication Guard
 *
 * Public website visitors can view the home page.
 *
 * Student authentication is required before accessing:
 * - Courses
 * - Entrance Exams
 * - Resources
 * - Colleges
 * - Journey / Roadmap
 * - Mock Tests
 * - AI Counsellor
 * - Demo Booking
 *
 * Admin authentication is handled separately by the admin APIs/dashboard.
 */

/**
 * Routes that require authentication.
 *
 * IMPORTANT:
 * Keep "/" public.
 * Do not add "/login" or "/register" here,
 * otherwise users could get stuck in the login guard.
 */
const PROTECTED_ROUTE_PREFIXES = [
  '/courses',
  '/entrance-exams',
  '/resources',
  '/colleges',
  '/journey',
  '/roadmap',
  '/mock-tests',
  '/ai-counsellor',
  '/demo',
];

/**
 * Admin-only routes.
 *
 * These should additionally be protected by server-side
 * admin session validation.
 */
const ADMIN_ROUTE_PREFIXES = [
  '/admin',
];

/**
 * Normalise pathname before checking it.
 */
function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  const pathOnly = pathname.split('?')[0].split('#')[0];

  const normalized = pathOnly
    .replace(/\/+$/, '')
    .replace(/^\/+/, '/');

  return normalized || '/';
}

/**
 * Check whether a pathname requires authentication.
 */
export function isProtectedRoute(pathname: string): boolean {
  const normalized = normalizePath(pathname);

  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) =>
      normalized === prefix ||
      normalized.startsWith(`${prefix}/`)
  );
}

/**
 * Check whether a pathname is an admin-only route.
 */
export function isAdminRoute(pathname: string): boolean {
  const normalized = normalizePath(pathname);

  return ADMIN_ROUTE_PREFIXES.some(
    (prefix) =>
      normalized === prefix ||
      normalized.startsWith(`${prefix}/`)
  );
}

/**
 * Account types supported by the EduPath login page.
 *
 * The application now uses ONE login page:
 *
 * /login
 *
 * The user selects Student/Admin from the dropdown.
 */
export type AccountType = 'Student' | 'Admin';

/**
 * Generate login query parameters.
 *
 * Example:
 *
 * Student:
 * /login?account=student
 *
 * Admin:
 * /login?account=admin
 */
export function accountTypeQuery(account: AccountType): string {
  return `?account=${account.toLowerCase()}`;
}

/**
 * Generate the complete login URL while preserving
 * the page the user originally wanted to access.
 */
export function createLoginRedirect(
  targetPath: string,
  account: AccountType = 'Student'
): string {
  const safeTarget = targetPath || '/';

  return `/login${accountTypeQuery(account)}&redirect=${encodeURIComponent(
    safeTarget
  )}`;
}

/**
 * Client-side navigation helper.
 *
 * Returns:
 *
 * - target path → public route
 * - null → authentication required
 */
export function guardNavigation(target: string): string | null {
  return isProtectedRoute(target) ? null : target;
}

/**
 * Return the login URL for a protected resource.
 */
export function getProtectedRouteLoginUrl(
  targetPath: string
): string {
  return createLoginRedirect(targetPath, 'Student');
}