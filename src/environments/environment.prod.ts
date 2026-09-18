/**
 * Production environment configuration.
 *
 * Replaces `environment.ts` during production builds. Point `apiBaseUrl` at the
 * real backend host before deploying.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:8080',
};
