import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal, ViewChild } from '@angular/core';
import {
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
  UsuarioResponse,
  UsuarioService,
} from '../../servicios/usuario.service';

export interface UsuarioSavedEvent {
  created: boolean;
  usuario: UsuarioResponse;
}

@Component({
  selector: 'app-usuario-edit-dialog',
  templateUrl: './usuario-edit-dialog.html',
  styleUrl: './usuario-edit-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioEditDialog {
  @ViewChild('dialog') private readonly dialog?: ElementRef<HTMLDialogElement>;
  private readonly usuarioService = inject(UsuarioService);

  /**
   * Usuario record to edit. When set to a record the dialog opens in edit mode.
   * When set to an empty object (`{}`) it opens in create mode. When `null` it stays closed.
   */
  readonly usuario = input<UsuarioResponse | null>(null);
  readonly saved = output<UsuarioSavedEvent>();
  readonly closed = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly saveError = signal('');

  protected readonly isEditing = signal(false);

  constructor() {
    effect(() => {
      const usuario = this.usuario();
      if (usuario) {
        this.isEditing.set(this.resolveId(usuario) !== undefined);
        this.saveError.set('');
        this.dialog?.nativeElement.showModal();
      }
    });
  }

  protected username(): string {
    const usuario = this.usuario();
    return usuario?.username ?? usuario?.usuario ?? '';
  }

  protected nombre(): string {
    return this.usuario()?.nombre ?? '';
  }

  protected email(): string {
    return this.usuario()?.email ?? '';
  }

  protected rol(): string {
    const usuario = this.usuario();
    return usuario?.role ?? usuario?.rol ?? '';
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
    const usuario = this.usuario();
    if (!form.reportValidity() || this.isSaving() || !usuario) {
      return;
    }

    const formData = new FormData(form);
    const username = String(formData.get('username') ?? '').trim();
    const nombre = String(formData.get('nombre') ?? '').trim() || undefined;
    const email = String(formData.get('email') ?? '').trim() || undefined;
    const rol = String(formData.get('rol') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();

    this.isSaving.set(true);
    this.saveError.set('');

    const id = this.resolveId(usuario);

    if (id !== undefined) {
      const request: UpdateUsuarioRequest = { username, nombre, email, rol };
      if (password) {
        request.password = password;
      }

      this.usuarioService.updateUsuario(String(id), request).subscribe({
        next: () => this.onSuccess({ ...usuario, ...request }, false),
        error: () => this.onError(),
      });
      return;
    }

    if (!password) {
      this.isSaving.set(false);
      this.saveError.set('La contraseña es obligatoria para un usuario nuevo.');
      return;
    }

    const request: CreateUsuarioRequest = { username, nombre, email, rol, password };
    this.usuarioService.createUsuario(request).subscribe({
      next: () => this.onSuccess({ username, nombre, email, role: rol }, true),
      error: () => this.onError(),
    });
  }

  private onSuccess(usuario: UsuarioResponse, created: boolean): void {
    this.isSaving.set(false);
    this.saved.emit({ created, usuario });
    this.dialog?.nativeElement.close();
  }

  private onError(): void {
    this.isSaving.set(false);
    this.saveError.set('No se pudo guardar el usuario. Inténtalo de nuevo.');
  }

  private resolveId(usuario: UsuarioResponse): number | string | undefined {
    const id = usuario.id ?? usuario.usuarioId;
    if (id === undefined || id === null || id === '') {
      return undefined;
    }
    return id;
  }
}
