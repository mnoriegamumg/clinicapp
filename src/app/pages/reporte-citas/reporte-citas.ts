import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import jsPDF from 'jspdf';
import { Appointment, AppointmentStatus } from '../../components/appointment-dialog/appointment-dialog';
import { AppointmentService } from '../../servicios/appointment.service';
import { openPdfForPrinting } from '../../servicios/pdf-print';

type AppointmentRecord = {
  id: number;
  patient: string;
  doctor: string;
  dateTime: string;
  reason: string;
  status: AppointmentStatus;
  diagnosis: string;
  doctorComments: string;
  treatment: string;
};

@Component({
  selector: 'app-reporte-citas',
  standalone: true,
  templateUrl: './reporte-citas.html',
  styleUrl: './reporte-citas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteCitas {
  private readonly appointmentService = inject(AppointmentService);
  @ViewChild('prescriptionDialog') private readonly prescriptionDialog?: ElementRef<HTMLDialogElement>;
  protected readonly statusOptions: Array<'Todos' | AppointmentStatus> = [
    'Todos',
    'PENDIENTE',
    'CONFIRMADA',
    'ATENDIDA',
    'CANCELADA',
  ];

  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly selectedStatus = signal<'Todos' | AppointmentStatus>('Todos');
  protected readonly appointments = signal<AppointmentRecord[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal('');
  protected readonly selectedPrescription = signal<AppointmentRecord | null>(null);
  protected readonly cancelingId = signal<number | null>(null);
  protected readonly cancelError = signal('');

  protected readonly filteredAppointments = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    const status = this.selectedStatus();

    return this.appointments().filter((appointment) => {
      const matchesStatus = status === 'Todos' || appointment.status === status;
      const appointmentDate = appointment.dateTime.slice(0, 10);
      const matchesStart = !start || appointmentDate >= start;
      const matchesEnd = !end || appointmentDate <= end;

      return matchesStatus && matchesStart && matchesEnd;
    });
  });

  constructor() {
    effect(() => {
      const inicio = this.startDate();
      const fin = this.endDate();

      if (!inicio || !fin || inicio > fin) {
        this.appointments.set([]);
        this.loadError.set('');
        return;
      }

      this.isLoading.set(true);
      this.loadError.set('');
      this.appointmentService.getAppointmentsByRange(inicio, fin).subscribe({
        next: (appointments) => this.appointments.set(appointments.map((appointment) => this.toReportRecord(appointment))),
        error: () => {
          this.appointments.set([]);
          this.loadError.set('No se pudo cargar el reporte de citas. Inténtalo de nuevo.');
          this.isLoading.set(false);
        },
        complete: () => this.isLoading.set(false),
      });
    });
  }

  private toReportRecord(appointment: Appointment): AppointmentRecord {
    const status = (appointment.estado ?? 'PENDIENTE').toUpperCase() as AppointmentStatus;

    return {
      id: appointment.id ?? 0,
      patient: appointment.pacienteNombreCompleto ?? appointment.patient ?? 'Paciente sin nombre',
      doctor: appointment.medicoNombreCompleto ?? 'Médico sin nombre',
      dateTime: appointment.fechaHora ?? '',
      reason: appointment.motivo ?? 'Sin motivo',
      status: this.statusOptions.includes(status) ? status : 'PENDIENTE',
      diagnosis: appointment.diagnostico ?? 'No registrado',
      doctorComments: appointment.comentariosMedico ?? 'No registrados',
      treatment: appointment.tratamiento ?? 'No registrado',
    };
  }

  protected openPrescription(appointment: AppointmentRecord): void {
    this.selectedPrescription.set(appointment);
    this.prescriptionDialog?.nativeElement.showModal();
  }

  protected canCancel(appointment: AppointmentRecord): boolean {
    return appointment.status !== 'ATENDIDA' && appointment.status !== 'CANCELADA';
  }

  protected cancelAppointment(appointment: AppointmentRecord): void {
    if (!this.canCancel(appointment) || this.cancelingId() !== null) {
      return;
    }

    const confirmed = typeof window === 'undefined' || window.confirm('¿Cancelar esta cita?');
    if (!confirmed) {
      return;
    }

    this.cancelingId.set(appointment.id);
    this.cancelError.set('');

    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.appointments.update((appointments) =>
          appointments.filter((item) => item.id !== appointment.id),
        );
        this.cancelingId.set(null);
      },
      error: () => {
        this.cancelError.set('No se pudo cancelar la cita. Inténtalo de nuevo.');
        this.cancelingId.set(null);
      },
    });
  }

  protected closePrescription(): void {
    this.selectedPrescription.set(null);
    this.prescriptionDialog?.nativeElement.close();
  }

  protected printPrescription(): void {
    const prescription = this.selectedPrescription();
    if (!prescription) {
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 24;

    pdf.setTextColor(31, 111, 235);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROSAMED', margin, y);

    y += 14;
    pdf.setTextColor(10, 35, 67);
    pdf.setFontSize(22);
    pdf.text('Receta médica', margin, y);

    y += 14;
    pdf.setDrawColor(207, 226, 255);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 14;

    pdf.setFontSize(11);
    this.addPdfField(pdf, 'Paciente', prescription.patient, margin, y);
    y += 17;
    this.addPdfField(pdf, 'Médico', prescription.doctor, margin, y);
    y += 17;
    this.addPdfField(
      pdf,
      'Fecha y hora',
      `${this.formatDate(prescription.dateTime)} - ${this.formatTime(prescription.dateTime)}`,
      margin,
      y,
    );
    y += 22;

    y = this.addPdfSection(pdf, 'Diagnóstico', prescription.diagnosis, margin, y, pageWidth - margin * 2);
    y = this.addPdfSection(pdf, 'Tratamiento', prescription.treatment, margin, y + 8, pageWidth - margin * 2);
    this.addPdfSection(pdf, 'Comentarios del médico', prescription.doctorComments, margin, y + 8, pageWidth - margin * 2);

    pdf.setTextColor(100, 128, 148);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Documento generado por ProsaMed', margin, 280);
    openPdfForPrinting(pdf);
  }

  private addPdfField(pdf: jsPDF, label: string, value: string, x: number, y: number): void {
    pdf.setTextColor(77, 103, 136);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(label.toUpperCase(), x, y);
    pdf.setTextColor(16, 42, 67);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, x, y + 6);
  }

  private addPdfSection(pdf: jsPDF, title: string, value: string, x: number, y: number, width: number): number {
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

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closePrescription();
    }
  }

  protected formatDate(value: string): string {
    if (!value) {
      return 'No registrada';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'No registrada';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected formatTime(value: string): string {
    if (!value) {
      return 'No disponible';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'No disponible';
    }

    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected statusClass(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      PENDIENTE: 'status-programada',
      CONFIRMADA: 'status-programada',
      ATENDIDA: 'status-completada',
      CANCELADA: 'status-cancelada',
    };

    return map[status];
  }
}
