import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const AuthGuard: CanActivateFn = async (_route, state: RouterStateSnapshot) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true; // SSR: no forzar login

  const oidc = inject(OidcSecurityService);
  const router = inject(Router);

  const authState = await firstValueFrom(oidc.isAuthenticated$);
  if (authState?.isAuthenticated) return true;

  sessionStorage.setItem('post_login_redirect', state.url || '/');
  oidc.authorize();
  return false;
};
