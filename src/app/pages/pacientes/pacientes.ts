import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MedicalHistoryDialog, Patient } from '../../components/medical-history-dialog/medical-history-dialog';
import { PatientResponse, PatientService } from '../../servicios/patient.service';

@Component({
  selector: 'app-pacientes',
  imports: [MedicalHistoryDialog],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pacientes {
  private readonly patientService = inject(PatientService);
  protected readonly patients = signal<Patient[]>([]);

  protected readonly selectedPatient = signal<Patient | null>(null);

  constructor() {
    this.patientService.getPatients().subscribe({
      next: (patients) => this.patients.set(patients.map((patient) => this.toPatient(patient))),
    });
  }

  private toPatient(patient: PatientResponse): Patient {
    const name = [patient.nombre, patient.nombres, patient.apellido, patient.apellidos]
      .filter((value): value is string => Boolean(value))
      .join(' ');

    return {
      id: Number(patient.id ?? patient.pacienteId ?? patient.patientId ?? 0),
      name: name || 'Paciente sin nombre',
      dpi: patient.dpi ?? 'No registrado',
      age: this.calculateAge(patient.fechaNacimiento ?? patient.fecha_nacimiento),
      phone: patient.telefono ?? 'No registrado',
      bloodType: 'No registrada',
      allergies: 'No registradas',
      lastVisit: 'Sin visitas registradas',
      diagnosis: 'Sin diagnóstico registrado',
      treatment: 'Sin tratamiento registrado',
    };
  }

  private calculateAge(birthDate?: string): number {
    if (!birthDate) {
      return 0;
    }

    const date = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const hasBirthdayPassed =
      today.getMonth() > date.getMonth() ||
      (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());

    if (!hasBirthdayPassed) {
      age -= 1;
    }

    return age;
  }

  protected showHistory(patient: Patient): void {
    this.selectedPatient.set({ ...patient });
  }
}