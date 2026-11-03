
import {
  ApplicationConfig,
  InjectionToken,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './auth/auth-interceptor';

export type LoadRemoteModule = (
  remoteName: string,
  exposedModule: string,
) => Promise<unknown>;

export const LOAD_REMOTE_MODULE =
  new InjectionToken<LoadRemoteModule>('LOAD_REMOTE_MODULE');

export const appConfig = (
  loadRemoteModule: LoadRemoteModule,
): ApplicationConfig => ({
  providers: [
    { provide: LOAD_REMOTE_MODULE, useValue: loadRemoteModule },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(
      withInterceptors([authInterceptor]),
    ),
  ],
});
