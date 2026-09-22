import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialog {
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;
  private readonly authService = inject(AuthService);

  /** When `true` the dialog opens. */
  readonly open = input(false);
  /** Emitted after the password was changed successfully. */
  readonly saved = output<void>();
  /** Emitted when the dialog is closed without saving. */
  readonly closed = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly saveError = signal('');
  protected readonly saveSuccess = signal('');

  constructor() {
    effect(() => {
      if (this.open()) {
        this.saveError.set('');
        this.saveSuccess.set('');
        this.dialog?.nativeElement.showModal();
      }
    });
  }

  protected close(): void {
    this.dialog?.nativeElement.close();
    this.closed.emit();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected submit(form: HTMLFormElement): void {
    if (!form.reportValidity() || this.isSaving()) {
      return;
    }

    const formData = new FormData(form);
    const passwordActual = String(formData.get('passwordActual') ?? '').trim();
    const passwordNueva = String(formData.get('passwordNueva') ?? '').trim();
    const passwordConfirmar = String(formData.get('passwordConfirmar') ?? '').trim();

    if (passwordNueva !== passwordConfirmar) {
      this.saveError.set('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (passwordNueva === passwordActual) {
      this.saveError.set('La nueva contraseña debe ser distinta a la actual.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveSuccess.set('');

    this.authService.changePassword({ passwordActual, passwordNueva }).subscribe({
      next: () => {
        this.isSaving.set(false);
        form.reset();
        this.saveSuccess.set('Tu contraseña se actualizó correctamente.');
        this.saved.emit();
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('No se pudo cambiar la contraseña. Verifica tu contraseña actual e inténtalo de nuevo.');
      },
    });
  }
}
