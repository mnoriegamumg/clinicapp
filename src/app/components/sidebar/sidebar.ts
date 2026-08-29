import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
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
}
