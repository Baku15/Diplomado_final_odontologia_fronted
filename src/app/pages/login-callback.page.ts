// src/app/pages/login-callback.page.ts
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login-callback',
  standalone: true,
  template: `<p>Procesando autenticación...</p>`
})
export class LoginCallbackPage {
  constructor(
    private oidc: OidcSecurityService,
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.run();
  }

  private async run() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    console.log('[CALLBACK] Iniciando checkAuth()...');
    const result = await firstValueFrom(this.oidc.checkAuth());
    console.log('[CALLBACK] checkAuth() result:', result);

    if (!result.isAuthenticated) {
      console.warn('[CALLBACK] No está autenticado, yendo a /');
      return this.router.navigateByUrl('/');
    }

    // 1) Intentamos usar la ruta que guardó el AuthGuard
    let redirect = '/';
    try {
      const stored = sessionStorage.getItem('post_login_redirect');
      console.log('[CALLBACK] post_login_redirect =', stored);

      if (stored && stored.startsWith('/') && !stored.startsWith('//') && !stored.includes('http')) {
        redirect = stored;
      }
      sessionStorage.removeItem('post_login_redirect');
    } catch (e) {
      console.warn('[CALLBACK] No se pudo leer post_login_redirect', e);
    }

    // 2) Preguntamos al backend qué rol tiene
    try {
      const me: any = await firstValueFrom(this.http.get('/api/me'));
      console.log('[CALLBACK] /api/me =', me);

      const roles: string[] = me?.roles ?? [];
      console.log('[CALLBACK] roles desde /api/me:', roles);

      if (roles.includes('ROLE_SUPERUSER') || roles.includes('SUPERUSER')) {
        redirect = '/admin/solicitudes';
      } else if (roles.includes('ROLE_DENTIST') || roles.includes('DENTIST')) {
        redirect = '/dashboard';
      }
    } catch (e) {
      console.warn('[CALLBACK] Error llamando /api/me, uso redirect por defecto:', e);
    }

    console.log('[CALLBACK] navegando a:', '/admin/solicitudes');
    return this.router.navigateByUrl('/admin/solicitudes');
  }
}
