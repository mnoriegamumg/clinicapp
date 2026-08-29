import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface PatientResponse {
  id?: number | string;
  pacienteId?: number | string;
  patientId?: number | string;
  dpi?: string;
  nombres?: string;
  nombre?: string;
  apellidos?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  domicilio?: string;
}

export interface CreatePatientRequest {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  direccion?: string;
  dpi: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/pacientes';

  searchByDpi(dpi: string): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.baseUrl}/dpi/${dpi}`);
  }

  createPatient(request: CreatePatientRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/crear`, request);
  }

  updatePatient(dpi: string, request: UpdatePatientRequest): Observable<unknown> {
    return this.http.put<unknown>(`${this.baseUrl}/actualizar/${dpi}`, request);
  }
}
