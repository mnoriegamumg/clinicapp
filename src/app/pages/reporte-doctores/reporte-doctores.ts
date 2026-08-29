import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type DoctorReportRecord = {
  id: number;
  name: string;
  specialty: string;
  email: string;
  joinedDate: string;
  schedule: string;
};

@Component({
  selector: 'app-reporte-doctores',
  standalone: true,
  templateUrl: './reporte-doctores.html',
  styleUrl: './reporte-doctores.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteDoctores {
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');

  private readonly doctors: DoctorReportRecord[] = [
    {
      id: 1,
      name: 'Dra. Ana García',
      specialty: 'Cardiología',
      email: 'ana.garcia@clinicapp.com',
      joinedDate: '2024-01-12',
      schedule: 'Lun - Vie / 08:00 - 14:00',
    },
    {
      id: 2,
      name: 'Dr. Carlos Torres',
      specialty: 'Dermatología',
      email: 'carlos.torres@clinicapp.com',
      joinedDate: '2023-11-04',
      schedule: 'Mar - Sab / 09:30 - 16:30',
    },
    {
      id: 3,
      name: 'Dra. Sofía Ruiz',
      specialty: 'Pediatría',
      email: 'sofia.ruiz@clinicapp.com',
      joinedDate: '2025-02-19',
      schedule: 'Lun - Jue / 10:00 - 17:00',
    },
    {
      id: 4,
      name: 'Dr. Mateo Morales',
      specialty: 'Medicina General',
      email: 'mateo.morales@clinicapp.com',
      joinedDate: '2022-07-08',
      schedule: 'Mié - Dom / 12:00 - 19:00',
    },
  ];

  protected readonly filteredDoctors = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    return this.doctors.filter((doctor) => {
      const matchesStart = !start || doctor.joinedDate >= start;
      const matchesEnd = !end || doctor.joinedDate <= end;
      return matchesStart && matchesEnd;
    });
  });

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T12:00:00`));
  }
}
