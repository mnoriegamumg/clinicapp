import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MedicalHistoryDialog, Patient } from '../../components/medical-history-dialog/medical-history-dialog';

@Component({
  selector: 'app-pacientes',
  imports: [MedicalHistoryDialog],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pacientes {
  protected readonly patients: Patient[] = [
    {
      id: 1,
      name: 'Ana Lucía Morales',
      dpi: '2456 78901 0101',
      age: 34,
      phone: '5555-0182',
      bloodType: 'O positivo',
      allergies: 'Penicilina',
      lastVisit: '12 de agosto de 2026',
      diagnosis: 'Control de hipertensión',
      treatment: 'Continuar con el tratamiento indicado y controlar la presión arterial cada semana.',
    },
    {
      id: 2,
      name: 'Carlos Méndez López',
      dpi: '3187 45620 0202',
      age: 47,
      phone: '5555-0246',
      bloodType: 'A positivo',
      allergies: 'Ninguna conocida',
      lastVisit: '5 de agosto de 2026',
      diagnosis: 'Seguimiento metabólico',
      treatment: 'Mantener actividad física regular y repetir exámenes de laboratorio en tres meses.',
    },
    {
      id: 3,
      name: 'Sofía Ramírez Castillo',
      dpi: '4021 93517 0303',
      age: 12,
      phone: '5555-0371',
      bloodType: 'B positivo',
      allergies: 'Polen',
      lastVisit: '28 de julio de 2026',
      diagnosis: 'Rinitis alérgica',
      treatment: 'Continuar antihistamínico según necesidad y evitar exposición a los alérgenos identificados.',
    },
  ];

  protected readonly selectedPatient = signal<Patient | null>(null);

  protected showHistory(patient: Patient): void {
    this.selectedPatient.set(patient);
  }
}