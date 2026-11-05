import { Routes } from '@angular/router';
import { adminGuard } from './core';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/store').then(m => m.Store) },
  { path: 'login', data: { admin: false, mode: 'login' }, loadComponent: () => import('./pages/auth').then(m => m.AuthPage) },
  { path: 'registro', data: { admin: false, mode: 'register' }, loadComponent: () => import('./pages/auth').then(m => m.AuthPage) },
  { path: 'cuenta', loadComponent: () => import('./pages/account').then(m => m.Account) },
  { path: 'recuperar', loadComponent: () => import('./pages/recover').then(m => m.Recover) },
  { path: 'admin/login', data: { admin: true, mode: 'login' }, loadComponent: () => import('./pages/auth').then(m => m.AuthPage) },
  { path: 'admin/registro', data: { admin: true, mode: 'register' }, loadComponent: () => import('./pages/auth').then(m => m.AuthPage) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin').then(m => m.Admin) },
  { path: '**', redirectTo: '' },
];
