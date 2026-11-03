
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import {
  appConfig,
  LOAD_REMOTE_MODULE,
  LoadRemoteModule,
} from './app.config';

import { serverRoutes } from './app.routes.server';

const serverLoader: LoadRemoteModule = (remoteName, exposedModule) => {
  const loader = (
    globalThis as typeof globalThis & {
      __NF_HOST_SERVER_LOADER__?: LoadRemoteModule;
    }
  ).__NF_HOST_SERVER_LOADER__;

  if (!loader) {
    throw new Error('Native Federation server loader is not initialized');
  }

  return loader(remoteName, exposedModule);
};

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: LOAD_REMOTE_MODULE, useValue: serverLoader },
  ],
};

export const config = mergeApplicationConfig(
  appConfig(serverLoader),
  serverConfig,
);
