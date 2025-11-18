import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const AuthGuard: CanActivateFn = async (_route, state: RouterStateSnapshot) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true; // SSR

  const oidc = inject(OidcSecurityService);
  const router = inject(Router);

  // ⛔ Antes: const isAuth = await firstValueFrom(oidc.isAuthenticated$);
  // ⭕ Ahora: extraemos correctamente el campo "isAuthenticated"
  const authState = await firstValueFrom(oidc.isAuthenticated$);
  const isAuth = !!authState?.isAuthenticated;

  console.log("AuthGuard: authState =", authState);
  console.log("AuthGuard: isAuth =", isAuth);

  if (isAuth) {
    return true;
  }

  // guardar ruta solicitada
  sessionStorage.setItem('post_login_redirect', state.url || '/');

  // iniciar login
  oidc.authorize();
  return false;
};
