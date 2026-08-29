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
}