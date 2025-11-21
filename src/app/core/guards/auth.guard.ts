// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const AuthGuard: CanActivateFn = async (_route, state: RouterStateSnapshot) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    // En SSR dejamos pasar; el auth real se hace en el navegador
    return true;
  }

  const oidc = inject(OidcSecurityService);

  // Procesar/consultar el estado real de auth
  let authResult: any;
  try {
    authResult = await firstValueFrom((oidc as any).checkAuth());
  } catch (e) {
    console.warn('AuthGuard: error en checkAuth()', e);
    authResult = null;
  }

  const isAuth = !!authResult?.isAuthenticated;
  console.log('AuthGuard: isAuth =', isAuth, 'ruta =', state.url);

  if (isAuth) {
    return true;
  }

  // Guardar intención de ruta
  try {
    if (state.url && state.url.startsWith('/') && !state.url.includes('http')) {
      sessionStorage.setItem('post_login_redirect', state.url);
    } else {
      sessionStorage.setItem('post_login_redirect', '/');
    }
  } catch (err) {
    console.warn('AuthGuard: no se pudo usar sessionStorage', err);
  }

  // Redirigir al Authorization Server
  try {
    const anyOidc: any = oidc;
    if (typeof anyOidc.authorize === 'function') {
      try {
        anyOidc.authorize('odontoweb');
      } catch {
        anyOidc.authorize();
      }
    } else {
      console.error('AuthGuard: authorize() no existe en OidcSecurityService');
    }
  } catch (e) {
    console.error('AuthGuard: error al invocar authorize()', e);
  }

  return false;
};
