import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output, signal, ViewChild } from '@angular/core';
import jsPDF from 'jspdf';
import { AppointmentResponse, AppointmentService } from '../../servicios/appointment.service';
import { openPdfForPrinting } from '../../servicios/pdf-print';

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

  protected printHistory(): void {
    const patient = this.patient();
    if (!patient) {
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 24;

    pdf.setTextColor(26, 107, 196);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('PROSAMED', margin, y);

    y += 14;
    pdf.setTextColor(18, 48, 71);
    pdf.setFontSize(22);
    pdf.text('Historial médico', margin, y);

    y += 14;
    pdf.setDrawColor(220, 234, 250);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 14;
    y = this.addPdfField(pdf, 'Paciente', patient.name, margin, y);
    y = this.addPdfField(pdf, 'DPI', patient.dpi, margin, y + 12);
    y = this.addPdfField(pdf, 'Edad', `${patient.age} años`, margin, y + 12);

    y += 14;
    pdf.setTextColor(26, 107, 196);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`CITAS REGISTRADAS (${this.appointments().length})`, margin, y);
    y += 10;

    for (const appointment of this.appointments()) {
      const appointmentLines = [
        appointment.motivo || 'Consulta general',
        `${appointment.medicoNombreCompleto || 'Médico no registrado'} · ${appointment.medicoEspecialidad || 'Especialidad no registrada'}`,
        `${this.formatAppointmentDate(appointment.fechaHora)} · ${appointment.estado || 'Estado no registrado'}`,
        `Tratamiento: ${appointment.tratamiento || 'No registrado'}`,
        `Comentarios del médico: ${appointment.comentariosMedico || 'No registrados'}`,
      ];
      const blockHeight = 10 + appointmentLines.reduce((height, line) => height + pdf.splitTextToSize(line, contentWidth - 8).length * 5, 0);

      if (y + blockHeight > pageHeight - 24) {
        pdf.addPage();
        y = 24;
      }

      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(220, 234, 250);
      pdf.roundedRect(margin, y - 5, contentWidth, blockHeight, 3, 3, 'FD');
      pdf.setTextColor(18, 48, 71);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(pdf.splitTextToSize(appointmentLines[0], contentWidth - 8), margin + 4, y + 2);
      y += 8;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      for (const line of appointmentLines.slice(1)) {
        const wrappedLine = pdf.splitTextToSize(line, contentWidth - 8);
        pdf.text(wrappedLine, margin + 4, y);
        y += wrappedLine.length * 5;
      }
      y += 10;
    }

    if (!this.appointments().length) {
      pdf.setTextColor(100, 128, 148);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('No hay citas registradas para este paciente.', margin, y);
    }

    openPdfForPrinting(pdf);
  }

  private addPdfField(pdf: jsPDF, label: string, value: string, x: number, y: number): number {
    pdf.setTextColor(100, 128, 148);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(label.toUpperCase(), x, y);
    pdf.setTextColor(18, 48, 71);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(value, x, y + 6);
    return y + 6;
  }

  private formatAppointmentDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Fecha no registrada';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}