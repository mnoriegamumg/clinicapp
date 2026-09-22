import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

export interface AuthUser {
  email: string;
  role?: string;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}

interface LoginResponse {
  usuario?: string;
  email?: string;
  token?: string;
  accessToken?: string;
  role?: string;
  roles?: string[];
  authorities?: string[];
  rol?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authUrl = 'http://localhost:8080/api/auth';
  private readonly loginUrl = `${this.authUrl}/login`;
  private readonly tokenKey = 'clinicapp.auth.token';
  private readonly authenticatedUser = signal<AuthUser | null>(this.readStoredUser());

  readonly currentUser = this.authenticatedUser.asReadonly();

  login(usuario: string, password: string): Observable<AuthUser> {
    return this.http.post<LoginResponse>(this.loginUrl, {
      username: usuario,
      password: password,
    }).pipe(
      tap((response) => {
        const token = response.token ?? response.accessToken;
        if (token && isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.tokenKey, token);
          sessionStorage.setItem(this.tokenKey, token);
        }
      }),
      map((response) => ({
        email: response.email ?? response.usuario ?? usuario,
        role: this.resolveRole(response),
      })),
      tap((user) => this.authenticatedUser.set(user)),
    );
  }

  logout(): void {
    this.authenticatedUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.tokenKey);
    }
  }

  changePassword(request: ChangePasswordRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.authUrl}/cambiar-password`, request);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(this.tokenKey) ?? sessionStorage.getItem(this.tokenKey);
  }

  private readStoredUser(): AuthUser | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    return {
      email: this.resolveEmailFromToken(token) ?? '',
      role: this.resolveRoleFromToken(token),
    };
  }

  private resolveEmailFromToken(token: string): string | undefined {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return undefined;
      }

      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const value = decoded.email ?? decoded.username ?? decoded.usuario ?? decoded.sub;

      return typeof value === 'string' ? value : undefined;
    } catch {
      return undefined;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  isMedico(): boolean {
    const role = this.currentUser()?.role ?? this.resolveRoleFromToken(this.getToken() ?? '');
    return role?.toLowerCase() === 'medico' || role?.toLowerCase() === 'doctor' || role?.toLowerCase() === 'médico';
  }

  isAdmin(): boolean {
    const role = this.currentUser()?.role ?? this.resolveRoleFromToken(this.getToken() ?? '');
    return role?.toUpperCase().includes('ADMIN') ?? false;
  }

  /**
   * Returns the id of the currently authenticated medico, decoded from the JWT.
   * Returns `null` when there is no token or the id claim is missing.
   */
  getMedicoId(): number | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    return this.resolveMedicoIdFromToken(token);
  }

  private resolveMedicoIdFromToken(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const rawId =
        decoded.medicoId ??
        decoded.medico_id ??
        decoded.doctorId ??
        decoded.usuarioId ??
        decoded.userId ??
        decoded.id ??
        decoded.sub;

      const id = Number(rawId);
      return Number.isFinite(id) ? id : null;
    } catch {
      return null;
    }
  }

  private resolveRole(response: LoginResponse): string | undefined {
    const role = response.role ?? response.rol ?? response.roles?.[0] ?? response.authorities?.[0];
    return this.normalizeRole(role);
  }

  private resolveRoleFromToken(token: string): string | undefined {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return undefined;
      }

      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const role = decoded.role ?? decoded.rol ?? decoded.roles ?? decoded.authorities;

      if (Array.isArray(role)) {
        return this.normalizeRole(role[0]);
      }

      return this.normalizeRole(role);
    } catch {
      return undefined;
    }
  }

  private normalizeRole(role: unknown): string | undefined {
    if (typeof role !== 'string') {
      return undefined;
    }

    const normalized = role.toLowerCase();
    if (normalized.includes('medico') || normalized.includes('doctor') || normalized.includes('médico')) {
      return 'MEDICO';
    }

    if (normalized.includes('paciente')) {
      return 'PACIENTE';
    }

    if (normalized.includes('admin')) {
      return 'ADMIN';
    }

    return role;
  }
}