import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output, signal, ViewChild } from '@angular/core';
import { AppointmentResponse, AppointmentService } from '../../servicios/appointment.service';

export type Patient = {
  id: number;
  name: string;
  dpi: string;
  age: number;
  phone: string;
  bloodType: string;
  allergies: string;
  lastVisit: string;
  diagnosis: string;
  treatment: string;
};

@Component({
  selector: 'app-medical-history-dialog',
  imports: [DatePipe],
  templateUrl: './medical-history-dialog.html',
  styleUrl: './medical-history-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalHistoryDialog {
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;
  private readonly appointmentService = inject(AppointmentService);

  readonly patient = input<Patient | null>(null);
  readonly closed = output<void>();
  protected readonly appointments = signal<AppointmentResponse[]>([]);

  constructor() {
    effect(() => {
      const patient = this.patient();
      if (!patient) {
        return;
      }

      this.appointmentService.getAppointmentsByPatient(patient.id).subscribe({
        next: (appointments) => {
          this.appointments.set(
            [...appointments].sort(
              (first, second) => new Date(second.fechaHora).getTime() - new Date(first.fechaHora).getTime(),
            ),
          );
          this.dialog?.nativeElement.showModal();
        },
      });
    });
  }

  open(): void {
    this.dialog?.nativeElement.showModal();
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
}