// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAuth, LogLevel } from 'angular-auth-oidc-client';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import './shared/ui/flowbite-init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
    provideAnimations(),
    provideAuth({
      config: {
        configId: 'odontoweb',
        authority: 'http://localhost:8080',
        clientId: 'odontoweb',

        // 🔴 ANTES: 'http://localhost:4200'
        // ✅ AHORA: SIEMPRE /callback
        redirectUrl: 'http://localhost:4200/callback',

        postLogoutRedirectUri: 'http://localhost:4200',
        scope: 'openid profile api.read offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        historyCleanupOff: true,
        logLevel: LogLevel.Debug,
      },
    }),
  ],
};
