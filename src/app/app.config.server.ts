//app.config.server.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes.server';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAuth, LogLevel } from 'angular-auth-oidc-client';

// En SSR no hay window: usa un ORIGIN fijo
const ORIGIN = 'http://localhost:4200';

export const config: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withFetch()),
    // 🔐 Proveer la librería también en SSR, con opciones seguras
    provideAuth({
      config: {
        authority: 'http://localhost:8080',
        clientId: 'odontoweb',
        redirectUrl: `${ORIGIN}/callback`,
        postLogoutRedirectUri: ORIGIN,
        scope: 'openid profile api.read offline_access',
        responseType: 'code',
        // En SSR desactiva procesos que podrían tocar window/Timers
        silentRenew: false,
        useRefreshToken: true,
        logLevel: LogLevel.None,
      },
    }),
  ],
};
