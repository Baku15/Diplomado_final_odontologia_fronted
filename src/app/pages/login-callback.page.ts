// src/app/pages/login-callback.page.ts

import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { Router, Event as RouterEvent } from '@angular/router';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-login-callback',
  imports: [NgIf],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="bg-white rounded-xl shadow px-6 py-4 text-sm text-slate-700">
        <p>Procesando inicio de sesión...</p>
        <p *ngIf="info" style="color:#444; margin-top:.5rem; font-size:.8rem;">
          {{ info }}
        </p>
      </div>
    </div>
  `,
})
export class LoginCallbackPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private oidc = inject(OidcSecurityService);
  private http = inject(HttpClient);

  info: string | null = null;
  private routerEventsSub: Subscription | null = null;

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.info = 'Procesando inicio de sesión...';

    this.routerEventsSub = this.router.events.subscribe((e: RouterEvent) => {
      console.debug('RouterEvent (login-callback):', e);
    });

    try {
      // 1) Procesar callback OIDC
      const checkResult: any = await firstValueFrom(this.oidc.checkAuth());
      if (!checkResult?.isAuthenticated) {
        console.warn('LoginCallback: no autenticado tras checkAuth()', checkResult);
        this.routerEventsSub?.unsubscribe();
        await this.router.navigateByUrl('/');
        return;
      }

      this.info = 'Inicio de sesión correcto. Obteniendo información del usuario...';

      // 2) Claims del token
      const userData: any = await firstValueFrom(this.oidc.userData$);
      console.debug('LoginCallback: userData =', userData);

      const rawRoles: any[] = Array.isArray(userData?.roles)
        ? userData.roles
        : userData?.role
          ? (Array.isArray(userData.role) ? userData.role : [userData.role])
          : [];

      const roles: string[] = rawRoles.map((r) =>
        typeof r === 'string' ? r : String(r),
      );

      const rolesNoPrefix = roles.map((r) => r.replace(/^ROLE_/, ''));
      const isDentist =
        roles.includes('ROLE_DENTIST') || rolesNoPrefix.includes('DENTIST');

      console.log('LoginCallback: roles =', roles, 'isDentist =', isDentist);

      // 3) /api/me → mustCompleteProfile
      let mustComplete = false;

      try {
        const accessToken = this.oidc.getAccessToken();
        const me: any = await firstValueFrom(
          this.http.get('/api/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        );

        console.debug('LoginCallback: /api/me =', me);
        mustComplete = !!me?.mustCompleteProfile;
      } catch (err) {
        console.warn('LoginCallback: fallo obteniendo /api/me', err);
        try {
          const me2: any = await firstValueFrom(
            this.http.get('/api/me', { withCredentials: true }),
          );
          console.debug('LoginCallback: /api/me (cookies) =', me2);
          mustComplete = !!me2?.mustCompleteProfile;
        } catch {
          console.warn('LoginCallback: fallo total al obtener /api/me');
        }
      }

      console.log(
        'LoginCallback: mustComplete =',
        mustComplete,
        'isDentist =',
        isDentist,
      );

      // 4) Si es dentista y debe completar perfil → wizard
      if (mustComplete && isDentist) {
        this.info = 'Debes completar tu perfil clínico...';
        console.log('🚀 Redirigiendo a /completar-perfil');

        try {
          const ok = await this.router.navigateByUrl('/completar-perfil');
          if (!ok) {
            console.warn('Router.navigateByUrl("/completar-perfil") devolvió false, forzando location.href');
            this.routerEventsSub?.unsubscribe();
            window.location.href = '/completar-perfil';
            return;
          }
          this.routerEventsSub?.unsubscribe();
          return;
        } catch {
          console.error('Error navegando a /completar-perfil, usando location.href');
          this.routerEventsSub?.unsubscribe();
          window.location.href = '/completar-perfil';
          return;
        }
      }

      // 5) Redirección normal por rol
      let redirect = '/';

      if (roles.includes('ROLE_SUPERUSER') || rolesNoPrefix.includes('SUPERUSER')) {
        redirect = '/admin/solicitudes';
      } else if (roles.includes('ROLE_CLINIC_ADMIN') || rolesNoPrefix.includes('CLINIC_ADMIN')) {
        redirect = '/mi-clinica';
      } else if (roles.includes('ROLE_DENTIST') || rolesNoPrefix.includes('DENTIST')) {
        redirect = '/dashboard';
      } else if (roles.includes('ROLE_ASSISTANT') || rolesNoPrefix.includes('ASSISTANT')) {
        redirect = '/assistant/dashboard';
      } else if (roles.includes('ROLE_PATIENT') || rolesNoPrefix.includes('PATIENT')) {
        redirect = '/paciente/dashboard';
      }

      // intención previa
      try {
        const saved = sessionStorage.getItem('post_login_redirect');
        if (saved && saved.startsWith('/') && !saved.includes('http')) {
          redirect = saved;
        }
        sessionStorage.removeItem('post_login_redirect');
      } catch {}

      // limpiar URL
      try {
        window.history.replaceState(
          {},
          document.title,
          `${window.location.origin}${window.location.pathname}`,
        );
      } catch {}

      // navegar según rol / intención
      try {
        const ok = await this.router.navigateByUrl(redirect);
        if (!ok) {
          this.routerEventsSub?.unsubscribe();
          window.location.href = redirect;
          return;
        }
        this.routerEventsSub?.unsubscribe();
      } catch (navErr) {
        console.error('LoginCallback: error al navegar', navErr);
        this.routerEventsSub?.unsubscribe();
        window.location.href = redirect;
      }
    } catch (e) {
      console.error('LoginCallback: excepción', e);
      this.routerEventsSub?.unsubscribe();
      try {
        await this.router.navigateByUrl('/');
      } catch {
        window.location.href = '/';
      }
    }
  }
}
