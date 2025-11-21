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
      console.debug('LoginCallback: checkAuth() =', checkResult);

      if (!checkResult?.isAuthenticated) {
        console.warn('LoginCallback: no autenticado tras checkAuth()', checkResult);
        this.routerEventsSub?.unsubscribe();
        await this.router.navigateByUrl('/');
        return;
      }

      this.info = 'Inicio de sesión correcto. Obteniendo información del usuario...';

      // 2) Claims OIDC
      const userData: any = await firstValueFrom(this.oidc.userData$);
      console.debug('LoginCallback: userData =', userData);

      // ROLES desde userData
      let rawRoles: any[] = Array.isArray(userData?.roles)
        ? userData.roles
        : userData?.role
          ? (Array.isArray(userData.role) ? userData.role : [userData.role])
          : [];

      let roles: string[] = rawRoles.map(r =>
        typeof r === 'string' ? r : String(r)
      );
      let rolesNoPrefix = roles.map(r => r.replace(/^ROLE_/, ''));

      // 3) Obtener /api/me → mustCompleteProfile y roles definitivos
      let mustComplete = false;

      try {
        const accessToken = this.oidc.getAccessToken();

        const me: any = await firstValueFrom(
          this.http.get('/api/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        );

        console.debug('LoginCallback: /api/me =', me);
        mustComplete = !!me?.mustCompleteProfile;

        if (Array.isArray(me?.roles) && me.roles.length > 0) {
          roles = me.roles.map((r: any) => String(r));
          rolesNoPrefix = roles.map(r => r.replace(/^ROLE_/, ''));
          console.debug(
            'LoginCallback: roles tomados de /api/me =',
            roles,
            rolesNoPrefix
          );
        }

      } catch (err) {
        console.warn('LoginCallback: fallo obteniendo /api/me', err);

        // Fallback sin header Authorization, usando cookies
        try {
          const me2: any = await firstValueFrom(
            this.http.get('/api/me', { withCredentials: true })
          );
          console.debug('LoginCallback: /api/me (sin header) =', me2);

          mustComplete = !!me2?.mustCompleteProfile;

          if (Array.isArray(me2?.roles) && me2.roles.length > 0) {
            roles = me2.roles.map((r: any) => String(r));
            rolesNoPrefix = roles.map(r => r.replace(/^ROLE_/, ''));
            console.debug(
              'LoginCallback: roles tomados de /api/me (fallback) =',
              roles,
              rolesNoPrefix
            );
          }
        } catch (err2) {
          console.warn('LoginCallback: fallo total al obtener /api/me', err2);
        }
      }

      // LOG CLAVE
      console.debug(
        'LoginCallback: mustComplete =',
        mustComplete,
        'roles =',
        roles,
        'rolesNoPrefix =',
        rolesNoPrefix
      );

      // 4) Si debe completar perfil y es dentista → /completar-perfil
      const isDentist =
        roles.includes('ROLE_DENTIST') || rolesNoPrefix.includes('DENTIST');

      if (mustComplete && isDentist) {
        this.info = 'Debes completar tu perfil clínico...';

        try {
          await this.router.navigateByUrl('/completar-perfil');
          this.routerEventsSub?.unsubscribe();
          return;
        } catch {
          window.location.href = '/completar-perfil';
          return;
        }
      }

      // 5) Redirección por rol "normal"
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

      // 6) Reemplazar por intención previa si existe y NO es simplemente '/'
      try {
        const saved = sessionStorage.getItem('post_login_redirect');
        if (
          saved &&
          saved !== '/' &&            // 👈 NO dejamos que un '/' genérico pise el redirect por rol
          saved.startsWith('/') &&
          !saved.includes('http')
        ) {
          redirect = saved;
        }
        sessionStorage.removeItem('post_login_redirect');
      } catch {}

      console.debug('LoginCallback: redirect calculado =', redirect);

      // 7) Limpiar la URL (quitar ?code=...&state=...)
      try {
        window.history.replaceState(
          {},
          document.title,
          `${window.location.origin}${window.location.pathname}`
        );
      } catch {}

      // 8) Navegar
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
