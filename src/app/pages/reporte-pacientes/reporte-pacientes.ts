import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type PatientReportRecord = {
  id: number;
  name: string;
  dpi: string;
  age: number;
  lastVisit: string;
  doctor: string;
};

@Component({
  selector: 'app-reporte-pacientes',
  standalone: true,
  templateUrl: './reporte-pacientes.html',
  styleUrl: './reporte-pacientes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportePacientes {
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');

  private readonly patients: PatientReportRecord[] = [
    {
      id: 1,
      name: 'Ana Lucía Morales',
      dpi: '2456 78901 0101',
      age: 34,
      lastVisit: '2026-08-12',
      doctor: 'Dra. García',
    },
    {
      id: 2,
      name: 'Carlos Méndez López',
      dpi: '3187 45620 0202',
      age: 47,
      lastVisit: '2026-08-05',
      doctor: 'Dr. Torres',
    },
    {
      id: 3,
      name: 'Sofía Ramírez Castillo',
      dpi: '4021 93517 0303',
      age: 12,
      lastVisit: '2026-08-28',
      doctor: 'Dra. Ruiz',
    },
    {
      id: 4,
      name: 'Mateo Flores Pérez',
      dpi: '7128 00641 0404',
      age: 29,
      lastVisit: '2026-08-18',
      doctor: 'Dr. Morales',
    },
  ];

  protected readonly filteredPatients = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    return this.patients.filter((patient) => {
      const matchesStart = !start || patient.lastVisit >= start;
      const matchesEnd = !end || patient.lastVisit <= end;
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
