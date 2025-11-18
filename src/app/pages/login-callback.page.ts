import { Component, OnInit, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { Router, Event as RouterEvent } from '@angular/router';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';

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

    // Subscribir a eventos del router temporalmente para diagnóstico
    this.routerEventsSub = this.router.events.subscribe((e: RouterEvent) => {
      // Logging ligero para ver si hay NavigationCancel / Guards u otros eventos
      // (Se puede eliminar cuando ya no necesites diagnosticar)
      // tslint:disable-next-line:no-console
      console.debug('RouterEvent (login-callback):', e);
    });

    try {
      const current = window.location.href;
      const checkResult: any = await firstValueFrom(this.oidc.checkAuth(current));

      if (!checkResult?.isAuthenticated) {
        console.warn('LoginCallback: checkAuth no autenticó, redirigiendo a /.', checkResult);
        this.routerEventsSub?.unsubscribe();
        await this.router.navigateByUrl('/');
        return;
      }

      this.info = 'Inicio de sesión correcto. Obteniendo perfil...';

      // obtener perfil / me desde backend
      const me: any = await firstValueFrom(this.http.get('/api/me'));
      console.debug('LoginCallback: /api/me ->', me);

      // normalize roles: aceptar strings con o sin prefijo ROLE_
      const rawRoles: any[] = Array.isArray(me?.roles) ? me.roles : [];
      const roles: string[] = rawRoles.map(r => (typeof r === 'string' ? r : String(r)));
      const rolesNoPrefix = roles.map(r => r.replace(/^ROLE_/, ''));

      console.debug('LoginCallback: roles (raw) =', roles, ' rolesNoPrefix =', rolesNoPrefix);

      // calculamos redirect con tolerancia (ROLE_... o sin)
      let redirect = '/';
      if (roles.includes('ROLE_SUPERUSER') || rolesNoPrefix.includes('SUPERUSER')) {
        redirect = '/admin/solicitudes';
      } else if (roles.includes('ROLE_CLINIC_ADMIN') || rolesNoPrefix.includes('CLINIC_ADMIN')) {
        redirect = '/mi-clinica/dashboard';
      } else if (roles.includes('ROLE_DENTIST') || rolesNoPrefix.includes('DENTIST')) {
        redirect = '/dashboard';
      } else if (roles.includes('ROLE_ASSISTANT') || rolesNoPrefix.includes('ASSISTANT')) {
        redirect = '/assistant/dashboard';
      } else if (roles.includes('ROLE_PATIENT') || rolesNoPrefix.includes('PATIENT')) {
        redirect = '/paciente/dashboard';
      }

      console.debug('LoginCallback: redirect calculado =', redirect);

      // Si hay intención previa guardada (post_login_redirect), usarla y borrarla
      try {
        const saved = sessionStorage.getItem('post_login_redirect');
        if (saved) {
          console.debug('LoginCallback: detectado post_login_redirect en sessionStorage =', saved);
          if (saved.startsWith('/') && !saved.includes('http')) {
            redirect = saved;
            console.debug('LoginCallback: usando post_login_redirect =', redirect);
          }
          sessionStorage.removeItem('post_login_redirect');
        }
      } catch (e) {
        console.warn('LoginCallback: fallo leyendo post_login_redirect', e);
      }

      // limpiar parámetros ?code & ?state de la URL (estética)
      try {
        window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
      } catch (e) {
        console.warn('LoginCallback: fallo al limpiar URL', e);
      }

      // Intento de navegación vía Router (rápido, SPA)
      try {
        const ok = await this.router.navigateByUrl(redirect);
        console.debug('LoginCallback: navigateByUrl ->', { redirect, ok });

        if (!ok) {
          // Si Angular canceló la navegación, forzamos un fallback completo
          console.warn('LoginCallback: navigateByUrl devolvió false — forzando fallback con location.href');
          this.routerEventsSub?.unsubscribe();
          // Forzamos recarga completa para evitar conflictos de guards/races
          window.location.href = redirect;
          return;
        }

        // navegación OK via router, cancelamos subscription diagnóstica
        this.routerEventsSub?.unsubscribe();
      } catch (navErr) {
        console.error('LoginCallback: error al navegar (router.navigateByUrl)', navErr);
        this.routerEventsSub?.unsubscribe();
        // fallback forzado
        try {
          window.location.href = redirect;
        } catch (e) {
          console.error('LoginCallback: fallo forzando window.location.href', e);
          // último recurso: navegar a root
          await this.router.navigateByUrl('/');
        }
      }
    } catch (e) {
      console.error('LoginCallback: excepción general', e);
      this.routerEventsSub?.unsubscribe();
      try {
        await this.router.navigateByUrl('/');
      } catch {
        window.location.href = '/';
      }
    }
  }
}
