import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DoctorResponse, DoctorService } from '../../servicios/doctor.service';

type DoctorReportRecord = {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  createdAt: string;
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
  private readonly doctorService = inject(DoctorService);
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly doctors = signal<DoctorReportRecord[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  constructor() {
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors.map((doctor) => this.toReportRecord(doctor)));
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('No se pudo cargar el reporte de doctores. Inténtalo de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  protected readonly filteredDoctors = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    return this.doctors().filter((doctor) => {
      const createdDate = doctor.createdAt.slice(0, 10);
      const matchesStart = !start || createdDate >= start;
      const matchesEnd = !end || createdDate <= end;
      return matchesStart && matchesEnd;
    });
  });

  private toReportRecord(doctor: DoctorResponse): DoctorReportRecord {
    const fullName = doctor.nombreCompleto || [doctor.nombre, doctor.apellido].filter(Boolean).join(' ');

    return {
      id: doctor.id,
      name: fullName || 'Doctor sin nombre',
      specialty: doctor.especialidad || 'No especificada',
      email: doctor.email || 'No registrado',
      phone: doctor.telefono || 'No registrado',
      createdAt: doctor.createdAt || '',
      schedule: `${doctor.horarioInicio || '--:--'} - ${doctor.horarioFin || '--:--'}`,
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
}
