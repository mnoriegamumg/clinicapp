import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface UsuarioResponse {
  id?: number | string;
  usuarioId?: number | string;
  username?: string;
  usuario?: string;
  nombre?: string;
  email?: string;
  role?: string;
  rol?: string;
  activo?: boolean;
  createdAt?: string;
}

export interface CreateUsuarioRequest {
  username: string;
  nombre?: string;
  email?: string;
  password: string;
  rol: string;
}

export interface UpdateUsuarioRequest extends Partial<Omit<CreateUsuarioRequest, 'password'>> {
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/usuarios';

  getUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.baseUrl);
  }

  createUsuario(request: CreateUsuarioRequest): Observable<unknown> {
    return this.http.post<unknown>(this.baseUrl, request);
  }

  updateUsuario(id: string, request: UpdateUsuarioRequest): Observable<unknown> {
    return this.http.put<unknown>(`${this.baseUrl}/${id}`, request);
  }

  deleteUsuario(id: string): Observable<unknown> {
    return this.http.delete<unknown>(`${this.baseUrl}/${id}`);
  }
}
