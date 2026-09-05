import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface DoctorResponse {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  especialidad: string;
  email: string;
  telefono: string;
  horarioInicio: string;
  horarioFin: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/medicos';

  getDoctors(): Observable<DoctorResponse[]> {
    return this.http.get<DoctorResponse[]>(this.baseUrl);
  }
}
