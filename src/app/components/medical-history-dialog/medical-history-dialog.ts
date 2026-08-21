import { ChangeDetectionStrategy, Component, ElementRef, input, ViewChild } from '@angular/core';

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
  templateUrl: './medical-history-dialog.html',
  styleUrl: './medical-history-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalHistoryDialog {
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;

  readonly patient = input<Patient | null>(null);

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
}