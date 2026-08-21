import { Routes } from '@angular/router';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'calendario',
    loadComponent: () => import('./pages/calendar/calendar').then((module) => module.Calendar),
  },
  {
    path: 'pacientes',
    loadComponent: () => import('./pages/pacientes/pacientes').then((module) => module.Pacientes),
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
