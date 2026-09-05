import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Appointment } from '../../components/appointment-dialog/appointment-dialog';
import { AppointmentService } from '../../servicios/appointment.service';

type AppointmentStatus = 'PENDIENTE' | 'PROGRAMADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';

type AppointmentRecord = {
  id: number;
  patient: string;
  doctor: string;
  dateTime: string;
  reason: string;
  status: AppointmentStatus;
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
  protected readonly statusOptions: Array<'Todos' | AppointmentStatus> = [
    'Todos',
    'PENDIENTE',
    'PROGRAMADA',
    'CONFIRMADA',
    'COMPLETADA',
    'CANCELADA',
  ];

  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly selectedStatus = signal<'Todos' | AppointmentStatus>('Todos');
  protected readonly appointments = signal<AppointmentRecord[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal('');

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
      status: this.statusOptions.includes(status) && status !== 'Todos' ? status : 'PENDIENTE',
    };
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
      PROGRAMADA: 'status-programada',
      CONFIRMADA: 'status-programada',
      COMPLETADA: 'status-completada',
      CANCELADA: 'status-cancelada',
    };

    return map[status];
  }
}
