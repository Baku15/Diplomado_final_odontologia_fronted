// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAuth, LogLevel } from 'angular-auth-oidc-client';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideAnimations(),
    provideAuth({
      config: {
        authority: 'http://localhost:8080',
        redirectUrl: window.location.origin + '/callback',
        postLogoutRedirectUri: window.location.origin,
        clientId: 'odontoweb',
        scope: 'openid profile api.read',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        // opcional:
        logLevel: LogLevel.Warn,
      },
    }),
  ],
};
