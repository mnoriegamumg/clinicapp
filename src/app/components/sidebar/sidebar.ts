import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  menus = [
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
      name: 'Configuración',
      icon: '⚙',
      route: '/configuracion',
      disabled: true,
    },
  ];

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
