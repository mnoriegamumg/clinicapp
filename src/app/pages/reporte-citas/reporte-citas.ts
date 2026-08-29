import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type AppointmentStatus = 'Programada' | 'Completada' | 'Cancelada';

type AppointmentRecord = {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
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
  protected readonly statusOptions: Array<'Todos' | AppointmentStatus> = [
    'Todos',
    'Programada',
    'Completada',
    'Cancelada',
  ];

  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly selectedStatus = signal<'Todos' | AppointmentStatus>('Todos');

  private readonly today = new Date();

  private readonly appointments: AppointmentRecord[] = [
    {
      id: 1,
      patient: 'Ana López',
      doctor: 'Dra. García',
      date: this.formatDateValue(new Date(this.today.getFullYear(), this.today.getMonth(), 3)),
      time: '09:00',
      status: 'Programada',
    },
    {
      id: 2,
      patient: 'Carlos Ramírez',
      doctor: 'Dr. Torres',
      date: this.formatDateValue(new Date(this.today.getFullYear(), this.today.getMonth(), 6)),
      time: '11:30',
      status: 'Completada',
    },
    {
      id: 3,
      patient: 'María Pérez',
      doctor: 'Dra. Ruiz',
      date: this.formatDateValue(new Date(this.today.getFullYear(), this.today.getMonth(), 10)),
      time: '15:00',
      status: 'Programada',
    },
    {
      id: 4,
      patient: 'José García',
      doctor: 'Dr. Morales',
      date: this.formatDateValue(new Date(this.today.getFullYear(), this.today.getMonth(), 14)),
      time: '10:15',
      status: 'Cancelada',
    },
    {
      id: 5,
      patient: 'Fernanda Díaz',
      doctor: 'Dra. Santos',
      date: this.formatDateValue(new Date(this.today.getFullYear(), this.today.getMonth(), 18)),
      time: '13:45',
      status: 'Completada',
    },
  ];

  protected readonly filteredAppointments = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    const status = this.selectedStatus();

    return this.appointments.filter((appointment) => {
      const matchesStatus = status === 'Todos' || appointment.status === status;
      const matchesStart = !start || appointment.date >= start;
      const matchesEnd = !end || appointment.date <= end;

      return matchesStatus && matchesStart && matchesEnd;
    });
  });

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T12:00:00`));
  }

  protected statusClass(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      Programada: 'status-programada',
      Completada: 'status-completada',
      Cancelada: 'status-cancelada',
    };

    return map[status];
  }

  private formatDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
