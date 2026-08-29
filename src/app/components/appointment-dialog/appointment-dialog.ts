import { ChangeDetectionStrategy, Component, ElementRef, inject, input, ViewChild } from '@angular/core';
import { AppointmentService } from '../../servicios/appointment.service';

export type Appointment = {
  dpi: string;
  patient: string;
  specialty: string;
  date: string;
  time: string;
  reason: string;
};

@Component({
  selector: 'app-appointment-dialog',
  templateUrl: './appointment-dialog.html',
  styleUrl: './appointment-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDialog {
  private readonly appointmentService = inject(AppointmentService);
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;

  readonly selectedDate = input('');
  protected isSaving = false;
  protected saveError = '';

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
    this.isSaving = true;
    this.saveError = '';

    this.appointmentService.addAppointment({
      pacienteId: Number(formData.get('pacienteId')),
      medicoId: Number(formData.get('medicoId')),
      fechaHora: `${date}T${time}:00`,
      dpi: String(formData.get('dpi') ?? ''),
      motivo: String(formData.get('reason') ?? ''),
    }).subscribe({
      next: () => {
        this.isSaving = false;
        form.reset();
        this.close();
      },
      error: () => {
        this.isSaving = false;
        this.saveError = 'No se pudo guardar la cita. Verifica los datos e inténtalo de nuevo.';
      },
    });
  }

  protected searchPacient(): void {
    // Implementation for searching patient by DPI

  }
}