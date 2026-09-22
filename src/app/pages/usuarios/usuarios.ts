import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UsuarioEditDialog, UsuarioSavedEvent } from '../../components/usuario-edit-dialog/usuario-edit-dialog';
import { UsuarioResponse, UsuarioService } from '../../servicios/usuario.service';

@Component({
  selector: 'app-usuarios',
  imports: [UsuarioEditDialog],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios {
  private readonly usuarioService = inject(UsuarioService);

  protected readonly usuarios = signal<UsuarioResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal('');
  protected readonly editingUsuario = signal<UsuarioResponse | null>(null);

  constructor() {
    this.loadUsuarios();
  }

  protected displayName(usuario: UsuarioResponse): string {
    return usuario.nombre?.trim() || usuario.username || usuario.usuario || 'Sin nombre';
  }

  protected usernameOf(usuario: UsuarioResponse): string {
    return usuario.username ?? usuario.usuario ?? '—';
  }

  protected roleOf(usuario: UsuarioResponse): string {
    return usuario.role ?? usuario.rol ?? '—';
  }

  protected initial(usuario: UsuarioResponse): string {
    return this.displayName(usuario).charAt(0).toUpperCase();
  }

  protected createUsuario(): void {
    this.editingUsuario.set({});
  }

  protected editUsuario(usuario: UsuarioResponse): void {
    this.editingUsuario.set(usuario);
  }

  protected onUsuarioSaved(event: UsuarioSavedEvent): void {
    const editing = this.editingUsuario();
    this.editingUsuario.set(null);

    if (event.created) {
      // Reload to obtain the server-generated id and any defaults.
      this.loadUsuarios();
      return;
    }

    if (!editing) {
      return;
    }

    this.usuarios.update((list) =>
      list.map((usuario) => (usuario === editing ? { ...usuario, ...event.usuario } : usuario)),
    );
  }

  protected deleteUsuario(usuario: UsuarioResponse): void {
    const id = usuario.id ?? usuario.usuarioId;
    if (id === undefined || id === null || id === '') {
      return;
    }

    const confirmed = confirm(`¿Eliminar al usuario "${this.displayName(usuario)}"?`);
    if (!confirmed) {
      return;
    }

    this.usuarioService.deleteUsuario(String(id)).subscribe({
      next: () => this.usuarios.update((list) => list.filter((item) => item !== usuario)),
      error: () => this.loadError.set('No se pudo eliminar el usuario. Inténtalo de nuevo.'),
    });
  }

  private loadUsuarios(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.usuarios.set([]);
        this.isLoading.set(false);
        this.loadError.set('No se pudieron cargar los usuarios.');
      },
    });
  }
}
