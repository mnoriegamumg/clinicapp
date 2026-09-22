import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';

interface MenuItem {
  name: string;
  icon: string;
  route: string;
  disabled: boolean;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ChangePasswordDialog],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly menus: MenuItem[] = [
    {
      name: 'Inicio',
      icon: '⌂',
      route: '/home',
      disabled: false,
    },
    {
      name: 'Calendario',
      icon: '▦',
      route: '/calendario',
      disabled: false,
    },
    {
      name: 'Pacientes',
      icon: '♙',
      route: '/pacientes',
      disabled: false,
    },
    {
      name: 'Reporte de pacientes',
      icon: '☰',
      route: '/reporte-pacientes',
      disabled: false,
    },
    {
      name: 'Reporte de doctores',
      icon: '✚',
      route: '/reporte-doctores',
      disabled: false,
    },
    {
      name: 'Reporte de citas programadas',
      icon: '⎘',
      route: '/reporte-citas',
      disabled: false,
    },
    {
      name: 'Administrar usuarios',
      icon: '⚇',
      route: '/usuarios',
      disabled: false,
      adminOnly: true,
    },
    {
      name: 'Configuración',
      icon: '⚙',
      route: '/configuracion',
      disabled: true,
    },
  ];

  protected readonly visibleMenus = computed(() =>
    this.menus.filter((menu) => !menu.adminOnly || this.authService.isAdmin()),
  );

  protected readonly currentUser = this.authService.currentUser;

  protected readonly userName = computed(() => {
    const email = this.currentUser()?.email?.trim();
    return email || 'Usuario';
  });

  protected readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase());

  protected readonly userRole = computed(() => {
    const role = this.currentUser()?.role?.trim();
    if (!role) {
      return 'Sesión activa';
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  });

  protected readonly isChangePasswordOpen = signal(false);

  protected openChangePassword(): void {
    this.isChangePasswordOpen.set(true);
  }

  protected closeChangePassword(): void {
    this.isChangePasswordOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
