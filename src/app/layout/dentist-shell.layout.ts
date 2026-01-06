import { Component, inject } from '@angular/core';
import {
  CommonModule,
  NgIf,
  AsyncPipe,
  NgClass,
} from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import {AlertBellComponent} from '../shared/alerts/alert-bell.component';

@Component({
  standalone: true,
  selector: 'app-dentist-shell-layout',
  imports: [
    CommonModule,
    NgIf,
    AsyncPipe,
    NgClass,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    AlertBellComponent,

  ],
  template: `
    <div class="flex min-h-screen bg-slate-100">

      <!-- SIDEBAR (desktop) -->
      <aside
        class="hidden md:flex flex-col bg-gradient-to-b
               from-sky-900 via-sky-800 to-emerald-700
               text-sky-50 shadow-xl transition-[width] duration-200 ease-in-out"
        [ngClass]="sidebarCollapsed ? 'w-20' : 'w-64'"
      >
        <!-- Brand + botón hamburguesa -->
        <div class="px-3 py-4 border-b border-white/10 flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center
                   h-8 w-8 rounded-full bg-white/10 hover:bg-white/20
                   focus:outline-none focus:ring-2 focus:ring-white/60"
            (click)="toggleSidebar()"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg"
                 class="h-4 w-4"
                 viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path *ngIf="!sidebarCollapsed" d="M4 6h16M4 12h10M4 18h16" />
              <path *ngIf="sidebarCollapsed" d="M4 6h16M10 12h10M4 18h16" />
            </svg>
          </button>

          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-xl" aria-hidden="true">
            🦷
          </div>

          <div class="flex flex-col" *ngIf="!sidebarCollapsed" aria-hidden="true">
            <span class="text-[11px] tracking-[0.18em] uppercase text-sky-200">ODONTOWEB</span>
            <span class="text-sm font-semibold text-white">Panel del odontólogo</span>
          </div>
        </div>

        <!-- Navegación -->
        <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-3 text-[11px]" role="navigation" aria-label="Main navigation">

          <!-- CONSULTORIO -->
          <div class="space-y-1.5">
            <p *ngIf="!sidebarCollapsed" class="px-3 text-[10px] font-semibold uppercase tracking-wide text-sky-300/80">
              Consultorio
            </p>

            <a
              routerLink="/dashboard"
              routerLinkActive="bg-white/10 text-white"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              <span class="inline-flex" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9.5L12 4l9 5.5" />
                  <path d="M5 10v9h14v-9" />
                </svg>
              </span>
              <span class="truncate" *ngIf="!sidebarCollapsed">Dashbord</span>
            </a>

            <a
              routerLink="/dashboard/horarios"
              routerLinkActive="bg-white/10 text-white"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              <span class="inline-flex" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span class="truncate" *ngIf="!sidebarCollapsed">Mis horarios</span>
            </a>

            <a
              routerLink="/dashboard/perfil-profesional"
              routerLinkActive="bg-white/10 text-white"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              <span class="inline-flex" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
                </svg>
              </span>
              <span class="truncate" *ngIf="!sidebarCollapsed">Perfil profesional</span>
            </a>
          </div>

          <!-- PACIENTES (solo UNA vez y apuntando a /dashboard) -->
          <div class="space-y-1.5 mt-4">
            <p *ngIf="!sidebarCollapsed" class="px-3 text-[10px] font-semibold uppercase tracking-wide text-sky-300/80">
              Pacientes
            </p>

            <a
              routerLink="/dashboard/pacientes"
              routerLinkActive="bg-white/10 text-white"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              <span class="inline-flex" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span class="truncate" *ngIf="!sidebarCollapsed">Pacientes</span>
            </a>

            <!-- Citas -->
            <a
              routerLink="/dashboard/citas"
              routerLinkActive="bg-white/10 text-white shadow-sm"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium
         rounded-xl hover:bg-white/10 hover:text-white transition-colors
         border border-transparent"
            >
  <span class="inline-flex">
    <svg xmlns="http://www.w3.org/2000/svg"
         class="h-5 w-5"
         viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  </span>

              <span class="truncate">
    Citas
  </span>
            </a>


            <a
              routerLink="/dashboard/pacientes/nuevo"
              routerLinkActive="bg-white/10 text-white"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              <span class="inline-flex" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
              <span class="truncate" *ngIf="!sidebarCollapsed">Registrar paciente</span>
            </a>
          </div>

        </nav>

        <!-- Pie sidebar -->
        <div class="px-3 py-3 border-t border-white/10 text-[11px] flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold" aria-hidden="true">
            {{ (userInitial$ | async) || 'U' }}
          </div>
          <div class="text-sky-100 truncate" *ngIf="!sidebarCollapsed">
            <div class="font-semibold truncate">{{ (user$ | async)?.username || 'Odontólogo' }}</div>
            <div class="text-sky-200 truncate text-[10px]">{{ (user$ | async)?.email || '' }}</div>
          </div>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="flex flex-col flex-1 overflow-hidden">

        <!-- TOPBAR -->
        <header class="relative flex items-center justify-between h-14 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-500 text-white px-4 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="flex flex-col gap-0.5">
              <div class="font-semibold text-sm md:text-base flex items-center gap-2">
                <span>Panel del odontólogo</span>
                <span class="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black/15">🦷 Cuenta profesional</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 text-[11px] md:text-xs">
            <div class="hidden sm:block text-white/80">Sesión iniciada como <span class="font-semibold text-white">{{ (user$ | async)?.username || 'Odontólogo' }}</span></div>
            <!-- 🔔 Campana -->
            <app-alert-bell></app-alert-bell>
            <!-- Avatar + menú -->
            <div class="relative">
              <button type="button" class="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-200 text-emerald-900 font-semibold text-xs shadow-sm hover:bg-white hover:text-emerald-700" (click)="toggleProfileMenu($event)">
                {{ (userInitial$ | async) || 'U' }}
              </button>

              <div *ngIf="showProfileMenu" class="absolute right-0 mt-2 w-56 rounded-xl bg-white text-slate-800 shadow-lg border border-slate-200 z-50">
                <div class="px-4 py-3 border-b border-slate-100">
                  <div class="text-xs text-slate-500">Conectado como</div>
                  <div class="text-sm font-semibold truncate">{{ (user$ | async)?.username }}</div>
                  <div class="text-xs text-slate-500 truncate">{{ (user$ | async)?.email }}</div>
                </div>

                <div class="py-1">
                  <button type="button" class="px-4 py-2 w-full text-left text-sm hover:bg-slate-50 flex items-center gap-2" (click)="goToSecurity()">Seguridad / contraseña</button>
                </div>

                <div class="py-1 border-t border-slate-100">
                  <button type="button" (click)="logout()" class="px-4 py-2 w-full text-left text-sm text-rose-600 hover:bg-rose-50">Cerrar sesión</button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="showProfileMenu" class="fixed inset-0 z-40" (click)="closeProfileMenu()"></div>
        </header>

        <!-- CONTENIDO DE LAS RUTAS HIJAS -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class DentistShellLayout {
  private auth = inject(AuthService);
  private router = inject(Router);

  user$ = this.auth.userData$;

  userInitial$ = this.user$.pipe(
    map((u) => {
      const name = u?.username || u?.email || '';
      return name ? name.trim().charAt(0).toUpperCase() : 'U';
    }),
  );

  sidebarCollapsed = false;
  showProfileMenu = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  async goToSecurity() {
    this.showProfileMenu = false;
    await this.router.navigateByUrl('/mi-cuenta/seguridad');
  }

  async logout() {
    this.showProfileMenu = false;
    await this.auth.logout();
  }
}
