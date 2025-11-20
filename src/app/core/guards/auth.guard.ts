// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const AuthGuard: CanActivateFn = async (_route, state: RouterStateSnapshot) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    // En SSR dejamos pasar para que no rompa el render
    return true;
  }

  const oidc = inject(OidcSecurityService);
  const router = inject(Router);

  // Estado de autenticación correcto (objeto con isAuthenticated)
  const authState = await firstValueFrom(oidc.isAuthenticated$);
  const isAuth = !!authState?.isAuthenticated;

  console.log('AuthGuard: isAuth =', isAuth, '→ ruta solicitada =', state.url);

  // Si ya está autenticado, OK
  if (isAuth) {
    return true;
  }

  // ⚠️ Evitar bucles: NO llamamos authorize() si ya estamos
  // en el callback OIDC o en completar-perfil
  if (state.url.includes('callback') || state.url.includes('completar-perfil')) {
    console.log('AuthGuard: ruta especial (callback/completar-perfil), dejo pasar para evitar bucle.');
    return true;
  }

  // Guardar a dónde quería ir
  try {
    sessionStorage.setItem('post_login_redirect', state.url || '/');
  } catch {
    // ignore
  }

  console.log('AuthGuard → lanzando authorize() de OIDC...');
  oidc.authorize();
  return false;
};
