import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import jsPDF from 'jspdf';
import { RouterLink } from '@angular/router';
import { Appointment, AppointmentDialog } from '../../components/appointment-dialog/appointment-dialog';
import { AppointmentService } from '../../servicios/appointment.service';
import { AuthService } from '../../servicios/auth.service';

type CalendarDay = {
  date: number;
  isoDate: string;
  isToday: boolean;
};

@Component({
  selector: 'app-calendar',
  imports: [RouterLink, AppointmentDialog],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  @ViewChild('doctorDialog') private readonly doctorDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('prescriptionDialog') private readonly prescriptionDialog?: ElementRef<HTMLDialogElement>;
  private readonly today = new Date();
  protected readonly currentMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  protected readonly selectedDate = signal(this.toIsoDate(this.today));
  protected readonly isMedico = signal(this.authService.isMedico());
  protected readonly selectedAppointmentForCare = signal<Appointment | null>(null);
  protected readonly selectedAppointmentForPrescription = signal<Appointment | null>(null);
  protected readonly doctorDiagnosis = signal('');
  protected readonly doctorComments = signal('');
  protected readonly doctorTreatment = signal('');
  protected isSavingDiagnosis = false;
  protected diagnosisSaveError = '';

  constructor() {
    effect(() => {
      const month = this.currentMonth();
      this.loadAppointments(month);
    });
  }

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
      .format(this.currentMonth())
      .replace(/^./, (letter) => letter.toUpperCase()),
  );

  protected readonly calendarDays = computed(() => {
    const month = this.currentMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days: Array<CalendarDay | null> = Array.from({ length: offset }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      days.push({
        date: day,
        isoDate: this.toIsoDate(date),
        isToday: this.toIsoDate(date) === this.toIsoDate(this.today),
      });
    }

    return days;
  });

  protected readonly selectedDateLabel = computed(() => {
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  });

  protected readonly selectedAppointments = computed(() =>
    this.appointmentService.appointments().filter((appointment) => {
      const appointmentDate = appointment.fechaHora ? appointment.fechaHora.slice(0, 10) : appointment.date;
      return appointmentDate === this.selectedDate();
    }),
  );

  protected previousMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  protected goToToday(): void {
    this.currentMonth.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.selectedDate.set(this.toIsoDate(this.today));
  }

  protected selectDate(day: CalendarDay): void {
    this.selectedDate.set(day.isoDate);
  }

  protected openAttendDialog(appointment: Appointment): void {
    this.selectedAppointmentForCare.set(appointment);
    this.doctorDiagnosis.set('');
    this.doctorComments.set('');
    this.doctorTreatment.set('');
    this.diagnosisSaveError = '';
    this.doctorDialog?.nativeElement.showModal();
  }

  protected closeAttendDialog(): void {
    this.selectedAppointmentForCare.set(null);
    this.doctorDiagnosis.set('');
    this.doctorComments.set('');
    this.doctorTreatment.set('');
    this.diagnosisSaveError = '';
    this.doctorDialog?.nativeElement.close();
  }

  protected openPrescriptionDialog(appointment: Appointment): void {
    this.selectedAppointmentForPrescription.set(appointment);
    this.prescriptionDialog?.nativeElement.showModal();
  }

  protected closePrescriptionDialog(): void {
    this.selectedAppointmentForPrescription.set(null);
    this.prescriptionDialog?.nativeElement.close();
  }

  protected generatePrescriptionPdf(): void {
    const appointment = this.selectedAppointmentForPrescription();
    if (!appointment) {
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 24;

    pdf.setTextColor(31, 111, 235);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('PROSAMED', margin, y);

    y += 14;
    pdf.setTextColor(10, 35, 67);
    pdf.setFontSize(22);
    pdf.text('Receta médica', margin, y);
    y += 14;
    pdf.setDrawColor(207, 226, 255);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 14;

    y = this.addPrescriptionPdfField(pdf, 'Paciente', appointment.pacienteNombreCompleto ?? appointment.patient ?? 'Paciente sin nombre', margin, y);
    y = this.addPrescriptionPdfField(pdf, 'Médico', appointment.medicoNombreCompleto ?? 'Médico sin nombre', margin, y + 12);
    y = this.addPrescriptionPdfField(pdf, 'Fecha y hora', this.formatPrescriptionDate(appointment.fechaHora, appointment.date, appointment.time), margin, y + 12);
    y += 14;

    y = this.addPrescriptionPdfSection(pdf, 'Diagnóstico', appointment.diagnostico ?? 'No registrado', margin, y, contentWidth);
    y = this.addPrescriptionPdfSection(pdf, 'Tratamiento', appointment.tratamiento ?? 'No registrado', margin, y + 8, contentWidth);
    this.addPrescriptionPdfSection(pdf, 'Comentarios del médico', appointment.comentariosMedico ?? 'No registrados', margin, y + 8, contentWidth);

    pdf.save(`receta-${appointment.id ?? 'cita'}.pdf`);
  }

  protected savePatientDiagnosis(): void {
    const appointment = this.selectedAppointmentForCare();
    if (!appointment?.id || this.isSavingDiagnosis) {
      return;
    }

    this.isSavingDiagnosis = true;
    this.diagnosisSaveError = '';

    this.appointmentService.updateAppointmentDiagnosis(appointment.id, {
      diagnostico: this.doctorDiagnosis().trim(),
      comentariosMedico: this.doctorComments().trim(),
      tratamiento: this.doctorTreatment().trim(),
    }).subscribe({
      next: () => {
        this.isSavingDiagnosis = false;
        this.closeAttendDialog();
      },
      error: () => {
        this.isSavingDiagnosis = false;
        this.diagnosisSaveError = 'No se pudo guardar la información médica. Inténtalo de nuevo.';
      },
    });
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      const dialog = event.currentTarget as HTMLDialogElement;
      if (dialog === this.prescriptionDialog?.nativeElement) {
        this.closePrescriptionDialog();
      } else {
        this.closeAttendDialog();
      }
    }
  }

  private addPrescriptionPdfField(pdf: jsPDF, label: string, value: string, x: number, y: number): number {
    pdf.setTextColor(77, 103, 136);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(label.toUpperCase(), x, y);
    pdf.setTextColor(16, 42, 67);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(value, x, y + 6);
    return y + 6;
  }

  private addPrescriptionPdfSection(pdf: jsPDF, title: string, value: string, x: number, y: number, width: number): number {
    pdf.setTextColor(41, 74, 117);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title.toUpperCase(), x, y);
    pdf.setTextColor(16, 42, 67);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(value, width);
    pdf.text(lines, x, y + 7);
    return y + 7 + lines.length * 6;
  }

  protected formatPrescriptionDate(fechaHora?: string, date?: string, time?: string): string {
    const value = fechaHora ?? (date && time ? `${date}T${time}` : date);
    if (!value) {
      return 'Fecha no registrada';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'Fecha no registrada';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate);
  }

  protected formatAppointmentTime(fechaHora?: string, fallback?: string): string {
    if (fechaHora) {
      const date = new Date(fechaHora);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }
    }

    return fallback ?? 'Hora no disponible';
  }

  private loadAppointments(month: Date): void {
    const inicio = this.toIsoDate(new Date(month.getFullYear(), month.getMonth(), 1));
    const fin = this.toIsoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    this.appointmentService.getAppointmentsByRange(inicio, fin).subscribe();
  }

  private toIsoDate(date: Date): string {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((value, index) => (index === 0 ? value : String(value).padStart(2, '0')))
      .join('-');
  }
}
