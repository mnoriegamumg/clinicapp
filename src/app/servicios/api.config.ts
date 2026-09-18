import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Base URL of the backend API (protocol + host, no trailing slash).
 *
 * Injected instead of hardcoding the host in each service so the value can be
 * swapped per environment (see `src/environments`) and overridden in tests.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
