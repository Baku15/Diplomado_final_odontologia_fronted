// src/app/shared/navbar/navbar.component.ts
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, isPlatformBrowser, AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [NgIf, AsyncPipe],
  template: `
    <header class="bg-white/90 backdrop-blur border-b border-slate-200">
      <nav
        class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4"
      >
        <!-- Marca / Nombre de la clínica -->
        <button
          class="text-xl font-bold text-blue-700 flex items-center gap-2 hover:text-blue-800"
          (click)="goHome()"
        >
          <span>🦷</span>
          <span>OdontoWeb</span>
        </button>

        <!-- Botones -->
        <div class="flex items-center gap-3" *ngIf="isBrowser">
          <!-- Siempre mostrar "Inicio" -->
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200
                   text-sm font-medium text-slate-800 border border-slate-200"
            (click)="goHome()"
          >
            Inicio
          </button>

          <!-- Si NO está autenticado: botón Iniciar sesión -->
          <button
            *ngIf="(auth.isAuthenticated$ | async) === false"
            type="button"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700
                   text-sm font-medium text-white shadow-sm"
            (click)="login()"
          >
            Iniciar sesión
          </button>

          <!-- Si SÍ está autenticado: botón Cerrar sesión -->
          <button
            *ngIf="(auth.isAuthenticated$ | async) === true"
            type="button"
            class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600
                   text-sm font-medium text-white shadow-sm"
            (click)="logout()"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
    </header>
  `,
})
export class NavbarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  isBrowser = isPlatformBrowser(this.platformId);

  // si en algún momento necesitas un subscription local extra, lo puedes usar.
  private sub?: Subscription;

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Aseguramos que el servicio OIDC intente recuperar sesión una vez
    // (no rompe si ya se hizo desde el shell).
    try {
      this.auth.init();
    } catch (e) {
      console.warn('Navbar: auth.init() falló o no es necesaria', e);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  login(): void {
    if (!this.isBrowser) return;

    // No forzar '/admin/solicitudes' aquí — guarda la raíz o deja que el callback decida según roles.
    // Si quieres redirigir al lugar actual después del login, usa `window.location.pathname`.
    const defaultPostLogin = '/'; // <- cambiar si prefieres otra ruta por defecto
    this.auth.startLogin(defaultPostLogin);
  }


  async logout(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      console.debug('Navbar.logout: calling auth.logout()');
      await this.auth.logout();
      console.debug('Navbar.logout: auth.logout() resolved');
    } catch (e) {
      console.error('Navbar.logout: error calling auth.logout()', e);
      // fallback: ensure navigation to home
      this.router.navigateByUrl('/').catch(() => (window.location.href = '/'));
    }
  }
}
