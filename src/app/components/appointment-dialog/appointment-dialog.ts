import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { Observable, of, switchMap, tap } from 'rxjs';
import { AppointmentService } from '../../servicios/appointment.service';
import { PatientResponse, PatientService } from '../../servicios/patient.service';
import { ViewRefreshService } from '../../servicios/view-refresh.service';

export type AppointmentStatus = 'ATENDIDA' | 'CANCELADA' | 'CONFIRMADA' | 'PENDIENTE';

export type Appointment = {
  id?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  estado?: AppointmentStatus;
  fechaHora?: string;
  motivo?: string;
  diagnostico?: string;
  comentariosMedico?: string;
  tratamiento?: string;
  medicoEspecialidad?: string;
  medicoId?: number;
  medicoNombreCompleto?: string;
  pacienteId?: number;
  pacienteNombreCompleto?: string;
  dpi?: string;
  patient?: string;
  specialty?: string;
  date?: string;
  time?: string;
  reason?: string;
};

@Component({
  selector: 'app-appointment-dialog',
  templateUrl: './appointment-dialog.html',
  styleUrl: './appointment-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDialog {
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly viewRefreshService = inject(ViewRefreshService);
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;

  readonly selectedDate = input('');
  protected isSaving = false;
  protected readonly saveError = signal('');
  protected patientLoading = false;
  protected patientSearchError = '';
  protected showAdditionalPatientData = false;
  protected noDpi = false;
  private searchTimeoutId: number | null = null;
  private patientId: number | null = null;

  /**
   * Toggles the "patient has no DPI" mode. When enabled, the DPI field is hidden
   * and the full patient form is always shown so a new patient can be created
   * (the DPI will be generated from a timestamp on submit).
   */
  protected toggleNoDpi(checked: boolean): void {
    this.noDpi = checked;
    this.patientSearchError = '';

    if (checked) {
      this.showAdditionalPatientData = true;
      this.patientId = null;
    } else {
      this.showAdditionalPatientData = false;
    }
  }

  open(): void {
    this.dialog?.nativeElement.showModal();
  }

  protected close(): void {
    this.dialog?.nativeElement.close();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected submit(form: HTMLFormElement): void {
    if (!form.reportValidity() || this.isSaving) {
      return;
    }

    const formData = new FormData(form);
    const date = String(formData.get('date') ?? '');
    const time = String(formData.get('time') ?? '');
    const nombres = String(formData.get('nombres') ?? '').trim();
    const apellidos = String(formData.get('apellidos') ?? '').trim();
    const dpi = this.noDpi ? String(Date.now()) : this.resolveDpi(String(formData.get('dpi') ?? ''));
    const email = String(formData.get('email') ?? '').trim();
    const telefono = String(formData.get('telefono') ?? '').trim();
    const fechaNacimiento = String(formData.get('fechaNacimiento') ?? '').trim();
    const direccion = String(formData.get('direccion') ?? '').trim();

    this.isSaving = true;
    this.saveError.set('');

    const createPatientRequest$ = this.showAdditionalPatientData
      ? this.patientService.createPatient({
          nombre: nombres,
          apellido: apellidos,
          email: email || undefined,
          telefono: telefono || undefined,
          fechaNacimiento: fechaNacimiento || undefined,
          direccion: direccion || undefined,
          dpi,
        })
      : of({ id: this.patientId ?? undefined });

    createPatientRequest$.pipe(
      tap(() => this.showAdditionalPatientData = false),
      switchMap((createdPatient) => {
        const pacienteId = this.extractPatientId(createdPatient ?? this.patientId);

        if (!pacienteId) {
          throw new Error('No se encontró el ID del paciente');
        }

        this.patientId = pacienteId;

        return this.appointmentService.addAppointment({
          pacienteId,
          medicoId: 1,
          fechaHora: `${date}T${time}:00`,
          motivo: String(formData.get('reason') ?? ''),
        });
      }),
    ).subscribe({
      next: () => {
        this.isSaving = false;
        form.reset();
        this.showAdditionalPatientData = false;
        this.noDpi = false;
        this.close();
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.saveError.set(this.getSaveErrorMessage(error));
      },
    });
  }

  private getSaveErrorMessage(error: unknown): string {
    const fallback = 'No se pudo guardar la cita. Verifica los datos e inténtalo de nuevo.';

    if (typeof error !== 'object' || error === null || !('error' in error)) {
      return fallback;
    }

    const response = error.error;

    if (typeof response !== 'object' || response === null) {
      return fallback;
    }

    const payload = response as Record<string, unknown>;
    const validationErrors = payload['errors'];

    if (typeof validationErrors === 'object' && validationErrors !== null && !Array.isArray(validationErrors)) {
      const messages = Object.entries(validationErrors as Record<string, unknown>).flatMap(([field, value]) => {
        const label = field === 'fechaHora' ? 'Fecha y hora' : field;
        const details = typeof value === 'string'
          ? [value]
          : Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string')
            : [];

        return details.map((detail) => `${label}: ${detail}`);
      });

      if (messages.length > 0) {
        const summary = typeof payload['error'] === 'string' ? payload['error'] : 'Error de validación';
        return `${summary}: ${messages.join(' ')}`;
      }
    }

    if (typeof payload['message'] === 'string') {
      return payload['message'];
    }

    return typeof payload['error'] === 'string' ? payload['error'] : fallback;
  }

  protected schedulePatientSearch(form: HTMLFormElement): void {
    const dpiInput = form.querySelector<HTMLInputElement>('input[name="dpi"]');
    const dpi = this.normalizeDpi(dpiInput?.value ?? '');

    if (this.searchTimeoutId) {
      window.clearTimeout(this.searchTimeoutId);
    }

    if (!dpi || dpi.length < 4) {
      this.showAdditionalPatientData = false;
      return;
    }

  }

  protected searchPatient(form: HTMLFormElement): void {
    const dpiInput = form.querySelector<HTMLInputElement>('input[name="dpi"]');
    const dpi = this.normalizeDpi(dpiInput?.value ?? '');

    if (!dpi) {
      this.showAdditionalPatientData = false;
      this.patientSearchError = '';
      this.viewRefreshService.refresh();
      return;
    }

    this.patientLoading = true;
    this.patientSearchError = '';
    this.showAdditionalPatientData = false;
    this.viewRefreshService.refresh();

    this.patientService.searchByDpi(dpi).subscribe({
      next: (patient) => {
        this.patientId = this.extractPatientId(patient);
        this.patientLoading = false;
        this.showAdditionalPatientData = false;
        this.populatePatientFields(form, patient);
        this.viewRefreshService.refresh();
      },
      error: (err) => {
        console.error(err);
        this.patientLoading = false;
        this.patientSearchError = 'No se encontró un paciente con este DPI. Completa los datos del paciente.';
        this.showAdditionalPatientData = true;
        this.clearPatientFields(form, true);
        this.viewRefreshService.refresh();
      },
      complete: () => {
        this.patientLoading = false;
        this.viewRefreshService.refresh();
      }
    });
  }

  private normalizeDpi(value: string): string {
    return value.replace(/\D/g, '').trim();
  }

  /**
   * Returns the normalized DPI, or a numeric timestamp-based fallback when the
   * patient has no DPI. `Date.now()` yields the milliseconds since 1970 as a
   * number-only string, which is unique enough to use as a placeholder id.
   */
  private resolveDpi(value: string): string {
    const dpi = this.normalizeDpi(value);
    return dpi || String(Date.now());
  }

  private extractPatientId(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    const record = value as Record<string, unknown>;
    const nestedPaciente = record['paciente'] as Record<string, unknown> | undefined;
    const candidate =
      record['id'] ??
      record['pacienteId'] ??
      record['patientId'] ??
      record['idPaciente'] ??
      nestedPaciente?.['id'] ??
      nestedPaciente?.['pacienteId'];

    if (typeof candidate === 'number') {
      return candidate;
    }

    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private populatePatientFields(form: HTMLFormElement, patient: PatientResponse): void {
    const nombres = patient.nombres ?? patient.nombre ?? '';
    const apellidos = patient.apellidos ?? patient.apellido ?? '';

    this.setFormField(form, 'nombres', nombres);
    this.setFormField(form, 'apellidos', apellidos);
    this.setFormField(form, 'email', patient.email ?? '');
    this.setFormField(form, 'telefono', patient.telefono ?? '');
    this.setFormField(form, 'fechaNacimiento', this.normalizeDate(patient.fechaNacimiento ?? patient.fecha_nacimiento ?? ''));
    this.setFormField(form, 'direccion', patient.direccion ?? patient.domicilio ?? '');
  }

  private clearPatientFields(form: HTMLFormElement, keepDpi = false): void {
    this.setFormField(form, 'nombres', '');
    this.setFormField(form, 'apellidos', '');
    this.setFormField(form, 'email', '');
    this.setFormField(form, 'telefono', '');
    this.setFormField(form, 'fechaNacimiento', '');
    this.setFormField(form, 'direccion', '');

    if (keepDpi) {
      const dpiInput = form.querySelector<HTMLInputElement>('input[name="dpi"]');
      if (dpiInput) {
        dpiInput.value = dpiInput.value;
      }
    }
  }

  private normalizeDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toISOString().slice(0, 10);
  }

  private setFormField(form: HTMLFormElement, fieldName: string, value: string): void {
    const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${fieldName}"]`);
    if (field) {
      field.value = value;
    }
  }
}