// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { switchMap, take, catchError } from 'rxjs/operators';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {of, throwError} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // 🔍 DEBUG: Imprimir información de la petición
  console.log(`[AUTH INTERCEPTOR] URL: ${req.url}, Browser: ${isBrowser}, Method: ${req.method}`);

  // 🚨 SI estamos en SERVER (SSR)
  if (!isBrowser) {
    // Verificar si la URL es relativa
    const isRelativeUrl = req.url.startsWith('/');

    if (isRelativeUrl) {
      // Determinar la URL base del backend
      const backendUrl = process.env['BACKEND_URL'] || 'http://localhost:8080';
      const absoluteUrl = `${backendUrl}${req.url}`;

      console.log(`[SSR] Convirtiendo URL relativa: ${req.url} -> ${absoluteUrl}`);

      // Clonar la request con la URL absoluta
      const clonedReq = req.clone({
        url: absoluteUrl,
        // Añadir headers específicos para SSR si es necesario
        headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
      });

      return next(clonedReq).pipe(
        catchError(error => {
          console.error('[SSR HTTP Error]', error);
          // En SSR, no queremos que falle el renderizado, retornamos error vacío
          return throwError(() => error);
        })
      );
    }

    // Si la URL ya es absoluta, continuar normalmente
    return next(req);
  }

  // 🖥️ SI estamos en BROWSER
  const oidc = inject(OidcSecurityService);

  // ⛔ NO agregar Authorization a endpoints específicos
  const excludedEndpoints = [
    '/api/auth/activate/',
    '/oauth2/token',
    '/oauth2/authorize',
    '/.well-known/'
  ];

  const shouldSkipAuth = excludedEndpoints.some(endpoint =>
    req.url.includes(endpoint)
  );

  if (shouldSkipAuth) {
    console.log(`[BROWSER] Skipping auth for: ${req.url}`);
    return next(req);
  }

  // Obtener token y agregar Authorization header
  return oidc.getAccessToken().pipe(
    take(1),
    switchMap(token => {
      console.log(`[BROWSER] Token obtenido para: ${req.url}, Token exists: ${!!token}`);

      const cloned = token
        ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
        : req;

      return next(cloned);
    }),
    catchError(error => {
      console.error('[BROWSER HTTP Error]', error);
      return throwError(() => error);
    })
  );
};

