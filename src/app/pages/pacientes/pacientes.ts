import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MedicalHistoryDialog, Patient } from '../../components/medical-history-dialog/medical-history-dialog';
import { PatientEditDialog } from '../../components/patient-edit-dialog/patient-edit-dialog';
import { PatientResponse, PatientService, UpdatePatientRequest } from '../../servicios/patient.service';

type PatientRow = {
  view: Patient;
  raw: PatientResponse;
};

@Component({
  selector: 'app-pacientes',
  imports: [MedicalHistoryDialog, PatientEditDialog],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pacientes {
  private readonly patientService = inject(PatientService);
  protected readonly rows = signal<PatientRow[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly isSearching = signal(false);
  protected readonly selectedPatient = signal<Patient | null>(null);
  protected readonly editingPatient = signal<PatientResponse | null>(null);

  private readonly searchTerm$ = new Subject<string>();

  constructor() {
    this.loadAllPatients();

    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((termino) => {
          const trimmed = termino.trim();
          this.isSearching.set(true);
          return trimmed
            ? this.patientService.searchByName(trimmed)
            : this.patientService.getPatients();
        }),
      )
      .subscribe({
        next: (patients) => {
          this.rows.set(patients.map((patient) => this.toRow(patient)));
          this.isSearching.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.isSearching.set(false);
        },
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchTerm$.next(term);
  }

  protected showHistory(patient: Patient): void {
    this.selectedPatient.set({ ...patient });
  }

  protected editPatient(row: PatientRow): void {
    this.editingPatient.set(row.raw);
  }

  protected onPatientSaved(request: UpdatePatientRequest): void {
    const editing = this.editingPatient();
    this.editingPatient.set(null);

    if (!editing) {
      return;
    }

    // Merge the updated fields into the raw record and rebuild the row so the
    // list reflects the changes without a full reload.
    this.rows.update((rows) =>
      rows.map((row) => {
        if (row.raw !== editing) {
          return row;
        }

        const updatedRaw: PatientResponse = { ...row.raw, ...request };
        return this.toRow(updatedRaw);
      }),
    );
  }

  private loadAllPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => this.rows.set(patients.map((patient) => this.toRow(patient))),
    });
  }

  private toRow(patient: PatientResponse): PatientRow {
    return { view: this.toPatient(patient), raw: patient };
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
}
