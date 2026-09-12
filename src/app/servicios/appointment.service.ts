import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Appointment } from '../components/appointment-dialog/appointment-dialog';

export interface CreateAppointmentRequest {
  pacienteId: number;
  medicoId: number;
  fechaHora: string;
  motivo?: string;
}

export interface UpdateAppointmentDiagnosisRequest {
  diagnostico: string;
  comentariosMedico: string;
  tratamiento: string;
}

export interface AppointmentResponse {
  id: number;
  pacienteId: number;
  pacienteNombreCompleto: string;
  medicoId: number;
  medicoNombreCompleto: string;
  medicoEspecialidad: string;
  fechaHora: string;
  motivo: string;
  estado: string;
  comentariosMedico?: string;
  tratamiento?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly appointmentsUrl = 'http://localhost:8080/api/citas/rango';
  private readonly createAppointmentUrl = 'http://localhost:8080/api/citas';
  private readonly appointmentsState = signal<Appointment[]>([]);

  readonly appointments = this.appointmentsState.asReadonly();

  getAppointmentsByRange(inicio: string, fin: string): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);

    return this.http.get<Appointment[]>(this.appointmentsUrl, { params }).pipe(
      tap((appointments) => this.appointmentsState.set(appointments)),
    );
  }

  addAppointment(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.createAppointmentUrl, request).pipe(
      tap((appointment) => this.appointmentsState.update((appointments) => [...appointments, appointment])),
    );
  }

  updateAppointmentDiagnosis(
    appointmentId: number,
    request: UpdateAppointmentDiagnosisRequest,
  ): Observable<Appointment> {
    return this.http.patch<Appointment>(
      `http://localhost:8080/api/citas/${appointmentId}/diagnostico`,
      request,
    ).pipe(
      tap((updatedAppointment) => this.appointmentsState.update((appointments) =>
        appointments.map((appointment) => appointment.id === updatedAppointment.id ? updatedAppointment : appointment),
      )),
    );
  }

  getAppointmentsByPatient(patientId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`http://localhost:8080/api/citas/paciente/${patientId}`);
  }
}