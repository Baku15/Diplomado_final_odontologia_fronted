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
    <!-- BARRA SUPERIOR A TODO LO ANCHO -->
    <header
      class="w-full bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-500
             text-white shadow-sm"
    >
      <nav
        class="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between gap-4"
      >
        <!-- Marca -->
        <button
          type="button"
          class="flex items-center gap-2 bg-transparent border-0 p-0
                 text-lg md:text-xl font-semibold tracking-tight
                 hover:opacity-90 cursor-pointer"
          (click)="goHome()"
        >
          <span class="text-2xl">🦷</span>
          <span>OdontoWeb</span>
        </button>

        <!-- Botones -->
        <div class="flex items-center gap-2" *ngIf="isBrowser">
          <!-- Inicio -->
          <button
            type="button"
            class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full
                   text-xs md:text-sm font-medium
                   bg-white/10 hover:bg-white/20 border border-white/20
                   transition-colors"
            (click)="goHome()"
          >
            Inicio
          </button>

          <!-- Iniciar sesión (cuando NO está autenticado) -->
          <button
            *ngIf="(auth.isAuthenticated$ | async) === false"
            type="button"
            class="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full
                   text-xs md:text-sm font-semibold
                   bg-white text-emerald-700 hover:bg-emerald-50
                   border border-white/0 shadow-sm transition-colors"
            (click)="login()"
          >
            Iniciar sesión
          </button>

          <!-- Cerrar sesión (cuando SÍ está autenticado) -->
          <button
            *ngIf="(auth.isAuthenticated$ | async) === true"
            type="button"
            class="inline-flex items-center px-3 md:px-4 py-1.5 rounded-full
                   text-xs md:text-sm font-semibold
                   bg-rose-500 hover:bg-rose-600
                   text-white shadow-sm transition-colors"
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
  private sub?: Subscription;

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Por si la app entra por una URL profunda, intentamos recuperar sesión.
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
    // Dejamos que el callback decida adónde ir según roles
    this.auth.startLogin('/');
  }

  async logout(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/');
    } catch {
      window.location.href = '/';
    }
  }
}
