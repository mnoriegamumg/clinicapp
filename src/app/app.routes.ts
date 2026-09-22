import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { authGuard } from './servicios/auth.guard';
import { adminGuard } from './servicios/admin.guard';
import { authRedirectGuard } from './servicios/auth-redirect.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [authRedirectGuard] },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'calendario',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/calendar/calendar').then((module) => module.Calendar),
  },
  {
    path: 'pacientes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pacientes/pacientes').then((module) => module.Pacientes),
  },
  {
    path: 'reporte-pacientes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reporte-pacientes/reporte-pacientes').then((module) => module.ReportePacientes),
  },
  {
    path: 'reporte-doctores',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reporte-doctores/reporte-doctores').then((module) => module.ReporteDoctores),
  },
  {
    path: 'reporte-citas',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reporte-citas/reporte-citas').then((module) => module.ReporteCitas),
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/usuarios/usuarios').then((module) => module.Usuarios),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
