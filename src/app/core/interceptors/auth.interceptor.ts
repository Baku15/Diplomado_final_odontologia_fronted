// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { switchMap, take } from 'rxjs/operators';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Si la URL empieza con /api y estamos en server, la convertimos a absoluta
  const isApiRelative = req.url.startsWith('/api');
  if (!isPlatformBrowser(platformId) && isApiRelative) {
    const absolute = `http://localhost:8080${req.url}`;
    const cloned = req.clone({ url: absolute });
    return next(cloned);
  }

  // Si NO estamos en el navegador (SSR) y la URL no es /api relativa, no tocar
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // ⛔ No agregar Authorization al endpoint de activación de cuenta
  if (req.url.includes('/api/auth/activate/')) {
    return next(req);
  }

  // ⛔ No agregar Authorization a endpoints del Authorization Server
  if (
    req.url.includes('/oauth2/token') ||
    req.url.includes('/oauth2/authorize') ||
    req.url.includes('/.well-known/')
  ) {
    return next(req);
  }

  const oidc = inject(OidcSecurityService);

  return oidc.getAccessToken().pipe(
    take(1),
    switchMap(token => {
      const cloned = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(cloned);
    })
  );
};
