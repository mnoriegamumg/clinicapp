import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal, ViewChild } from '@angular/core';
import { PatientResponse, PatientService, UpdatePatientRequest } from '../../servicios/patient.service';

@Component({
  selector: 'app-patient-edit-dialog',
  templateUrl: './patient-edit-dialog.html',
  styleUrl: './patient-edit-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientEditDialog {
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;
  private readonly patientService = inject(PatientService);

  /** Raw patient record to edit. When set, the dialog opens automatically. */
  readonly patient = input<PatientResponse | null>(null);
  /** Emitted after a successful update, with the updated request payload. */
  readonly saved = output<UpdatePatientRequest>();
  /** Emitted when the dialog is closed without saving. */
  readonly closed = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly saveError = signal('');

  constructor() {
    effect(() => {
      if (this.patient()) {
        this.saveError.set('');
        this.dialog?.nativeElement.showModal();
      }
    });
  }

  protected close(): void {
    this.dialog?.nativeElement.close();
    this.closed.emit();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected nombre(): string {
    const patient = this.patient();
    return patient?.nombre ?? patient?.nombres ?? '';
  }

  protected apellido(): string {
    const patient = this.patient();
    return patient?.apellido ?? patient?.apellidos ?? '';
  }

  protected fechaNacimiento(): string {
    const patient = this.patient();
    return this.normalizeDate(patient?.fechaNacimiento ?? patient?.fecha_nacimiento ?? '');
  }

  protected direccion(): string {
    const patient = this.patient();
    return patient?.direccion ?? patient?.domicilio ?? '';
  }

  protected submit(form: HTMLFormElement): void {
    const patient = this.patient();
    if (!form.reportValidity() || this.isSaving() || !patient) {
      return;
    }

    const patientId = patient.id ?? patient.pacienteId ?? patient.patientId;
    if (patientId === undefined || patientId === null || patientId === '') {
      this.saveError.set('Este paciente no tiene un ID de referencia para actualizar.');
      return;
    }

    const formData = new FormData(form);
    const request: UpdatePatientRequest = {
      nombre: String(formData.get('nombre') ?? '').trim(),
      apellido: String(formData.get('apellido') ?? '').trim(),
      dpi: String(formData.get('dpi') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim() || undefined,
      telefono: String(formData.get('telefono') ?? '').trim() || undefined,
      fechaNacimiento: String(formData.get('fechaNacimiento') ?? '').trim() || undefined,
      direccion: String(formData.get('direccion') ?? '').trim() || undefined,
    };

    this.isSaving.set(true);
    this.saveError.set('');

    this.patientService.updatePatient(String(patientId), request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.emit(request);
        this.dialog?.nativeElement.close();
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('No se pudo actualizar el paciente. Inténtalo de nuevo.');
      },
    });
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
}
