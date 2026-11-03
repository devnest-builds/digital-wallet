
import { Type, inject } from '@angular/core';
import { Routes } from '@angular/router';
import { LOAD_REMOTE_MODULE } from './app.config';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then((m) => m.Login),
  },
  { path: '', redirectTo: 'wallet', pathMatch: 'full' },
  {
    path: 'wallet',
    canActivate: [authGuard],
    loadComponent: () =>
      inject(LOAD_REMOTE_MODULE)('wallet', './Component').then(
        (m) => (m as { App: Type<unknown> }).App,
      ),
  },
  {
    path: 'transfer',
    canActivate: [authGuard],
    loadComponent: () =>
      inject(LOAD_REMOTE_MODULE)('transfer', './Component').then(
        (m) => (m as { App: Type<unknown> }).App,
      ),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      inject(LOAD_REMOTE_MODULE)('history', './Component').then(
        (m) => (m as { App: Type<unknown> }).App,
      ),
  },
  { path: '**', redirectTo: 'wallet' },
];
