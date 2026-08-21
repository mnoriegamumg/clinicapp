import { ChangeDetectionStrategy, Component, ElementRef, input, output, ViewChild } from '@angular/core';

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
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;

  readonly selectedDate = input('');
  readonly appointmentCreated = output<Appointment>();

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
    const formData = new FormData(form);
    this.appointmentCreated.emit({
      dpi: String(formData.get('dpi') ?? ''),
      patient: String(formData.get('patient') ?? ''),
      specialty: String(formData.get('specialty') ?? ''),
      date: String(formData.get('date') ?? ''),
      time: String(formData.get('time') ?? ''),
      reason: String(formData.get('reason') ?? ''),
    });
    form.reset();
    this.close();
  }
}