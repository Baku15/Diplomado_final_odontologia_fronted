// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';

export const AuthGuard: CanActivateFn = async () => {
  const oidc = inject(OidcSecurityService);
  const router = inject(Router);

  // Evita race conditions: espera a checkAuth en el arranque (p.ej. en app root) o maneja aquí
  const state = await firstValueFrom(oidc.isAuthenticated$);
  if (state?.isAuthenticated) return true;

  oidc.authorize();
  return false;
};
