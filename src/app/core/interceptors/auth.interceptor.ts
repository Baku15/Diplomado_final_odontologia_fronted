// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { switchMap, take } from 'rxjs/operators';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oidc = inject(OidcSecurityService);
  return oidc.getAccessToken().pipe(
    take(1),
    switchMap(token => {
      const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
      return next(cloned);
    })
  );
};
