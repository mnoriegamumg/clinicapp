import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment, AppointmentDialog } from '../../components/appointment-dialog/appointment-dialog';
import { AppointmentService } from '../../servicios/appointment.service';
import { AuthService } from '../../servicios/auth.service';

type CalendarDay = {
  date: number;
  isoDate: string;
  isToday: boolean;
};

@Component({
  selector: 'app-calendar',
  imports: [RouterLink, AppointmentDialog],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  @ViewChild('doctorDialog') private readonly doctorDialog?: ElementRef<HTMLDialogElement>;
  private readonly today = new Date();
  protected readonly currentMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  protected readonly selectedDate = signal(this.toIsoDate(this.today));
  protected readonly isMedico = signal(this.authService.isMedico());
  protected readonly selectedAppointmentForCare = signal<Appointment | null>(null);
  protected readonly doctorObservations = signal('');

  constructor() {
    effect(() => {
      const month = this.currentMonth();
      this.loadAppointments(month);
    });
  }

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
      .format(this.currentMonth())
      .replace(/^./, (letter) => letter.toUpperCase()),
  );

  protected readonly calendarDays = computed(() => {
    const month = this.currentMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days: Array<CalendarDay | null> = Array.from({ length: offset }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      days.push({
        date: day,
        isoDate: this.toIsoDate(date),
        isToday: this.toIsoDate(date) === this.toIsoDate(this.today),
      });
    }

    return days;
  });

  protected readonly selectedDateLabel = computed(() => {
    const date = new Date(`${this.selectedDate()}T12:00:00`);
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  });

  protected readonly selectedAppointments = computed(() =>
    this.appointmentService.appointments().filter((appointment) => {
      const appointmentDate = appointment.fechaHora ? appointment.fechaHora.slice(0, 10) : appointment.date;
      return appointmentDate === this.selectedDate();
    }),
  );

  protected previousMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const month = this.currentMonth();
    this.currentMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  protected goToToday(): void {
    this.currentMonth.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.selectedDate.set(this.toIsoDate(this.today));
  }

  protected selectDate(day: CalendarDay): void {
    this.selectedDate.set(day.isoDate);
  }

  protected openAttendDialog(appointment: Appointment): void {
    this.selectedAppointmentForCare.set(appointment);
    this.doctorObservations.set('');
    this.doctorDialog?.nativeElement.showModal();
  }

  protected closeAttendDialog(): void {
    this.selectedAppointmentForCare.set(null);
    this.doctorObservations.set('');
    this.doctorDialog?.nativeElement.close();
  }

  protected savePatientObservations(): void {
    const appointment = this.selectedAppointmentForCare();
    if (!appointment) {
      return;
    }

    console.log('Observaciones del médico para la cita:', {
      appointmentId: appointment.id,
      pacienteNombreCompleto: appointment.pacienteNombreCompleto,
      observaciones: this.doctorObservations(),
    });

    this.closeAttendDialog();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeAttendDialog();
    }
  }

  protected formatAppointmentTime(fechaHora?: string, fallback?: string): string {
    if (fechaHora) {
      const date = new Date(fechaHora);
      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date);
      }
    }

    return fallback ?? 'Hora no disponible';
  }

  private loadAppointments(month: Date): void {
    const inicio = this.toIsoDate(new Date(month.getFullYear(), month.getMonth(), 1));
    const fin = this.toIsoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    this.appointmentService.getAppointmentsByRange(inicio, fin).subscribe();
  }

  private toIsoDate(date: Date): string {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((value, index) => (index === 0 ? value : String(value).padStart(2, '0')))
      .join('-');
  }
}
