import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment, AppointmentDialog } from '../../components/appointment-dialog/appointment-dialog';

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
  private readonly today = new Date();
  protected readonly currentMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  protected readonly selectedDate = signal(this.toIsoDate(this.today));

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

  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly selectedAppointments = computed(() =>
    this.appointments().filter((appointment) => appointment.date === this.selectedDate()),
  );

  protected addAppointment(appointment: Appointment): void {
    this.appointments.update((appointments) => [...appointments, appointment]);
  }

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

  private toIsoDate(date: Date): string {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((value, index) => (index === 0 ? value : String(value).padStart(2, '0')))
      .join('-');
  }
}
