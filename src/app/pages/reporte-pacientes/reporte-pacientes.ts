import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { PatientResponse, PatientService } from '../../servicios/patient.service';

type PatientReportRecord = {
  id: number;
  name: string;
  dpi: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  createdAt: string;
};

@Component({
  selector: 'app-reporte-pacientes',
  standalone: true,
  templateUrl: './reporte-pacientes.html',
  styleUrl: './reporte-pacientes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportePacientes {
  private readonly patientService = inject(PatientService);
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');

  protected readonly patients = signal<PatientReportRecord[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal('');
  protected readonly hasDateRange = computed(() => Boolean(this.startDate() && this.endDate()));

  constructor() {
    effect(() => {
      const inicio = this.startDate();
      const fin = this.endDate();

      if (!inicio || !fin || inicio > fin) {
        this.patients.set([]);
        return;
      }

      this.isLoading.set(true);
      this.loadError.set('');
      this.patientService.getPatientsByRange(inicio, fin).subscribe({
        next: (patients) => this.patients.set(patients.map((patient) => this.toReportRecord(patient))),
        error: () => {
          this.patients.set([]);
          this.loadError.set('No se pudo cargar el reporte de pacientes. Inténtalo de nuevo.');
          this.isLoading.set(false);
        },
        complete: () => this.isLoading.set(false),
      });
    });
  }

  private toReportRecord(patient: PatientResponse): PatientReportRecord {
    const name = [patient.nombre, patient.nombres, patient.apellido, patient.apellidos]
      .filter((value): value is string => Boolean(value))
      .join(' ');

    return {
      id: Number(patient.id ?? patient.pacienteId ?? patient.patientId ?? 0),
      name: name || 'Paciente sin nombre',
      dpi: patient.dpi ?? 'No registrado',
      email: patient.email ?? 'No registrado',
      phone: patient.telefono ?? 'No registrado',
      birthDate: patient.fechaNacimiento ?? patient.fecha_nacimiento ?? '',
      address: patient.direccion ?? patient.domicilio ?? 'No registrada',
      createdAt: patient.createdAt ?? '',
    };
  }

  protected formatDate(value: string): string {
    if (!value) {
      return 'No registrada';
    }

    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
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
