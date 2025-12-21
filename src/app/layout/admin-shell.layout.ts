import { Component, inject } from '@angular/core';
import {
  CommonModule,
  NgIf,
  AsyncPipe,
} from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastComponent } from '../shared/toast/toast.component';

@Component({
  standalone: true,
  selector: 'app-admin-shell-layout',
  imports: [
    CommonModule,
    NgIf,
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ToastComponent,

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
        <div
          class="px-3 py-4 border-b border-white/10
                 flex items-center gap-3"
        >
          <!-- Hamburguesa a la IZQUIERDA del logo -->
          <button
            type="button"
            class="inline-flex items-center justify-center
                   h-8 w-8 rounded-full bg-white/10 hover:bg-white/20
                   focus:outline-none focus:ring-2 focus:ring-white/60"
            (click)="toggleSidebar()"
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

          <!-- Logo + texto -->
          <div
            class="flex h-9 w-9 items-center justify-center
                   rounded-xl bg-white/10 text-xl flex-shrink-0"
          >
            🦷
          </div>

          <div class="flex flex-col" *ngIf="!sidebarCollapsed">
            <span class="text-[11px] tracking-[0.18em] uppercase text-sky-200">
              ODONTOWEB
            </span>
            <span class="text-sm font-semibold text-white">
              Administración
            </span>
          </div>
        </div>

        <!-- Navegación -->
        <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <!-- Solicitudes -->
          <a
            routerLink="/admin/solicitudes"
            routerLinkActive="bg-white/10 text-white"
            class="flex items-center gap-3 px-3 py-2 text-xs font-medium
                   rounded-xl hover:bg-white/10 transition-colors"
          >
            <span class="inline-flex">
              <svg xmlns="http://www.w3.org/2000/svg"
                   class="h-5 w-5"
                   viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                <path d="M3 10h18"></path>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
              </svg>
            </span>
            <span class="truncate" *ngIf="!sidebarCollapsed">
              Solicitudes de registro
            </span>
          </a>

          <!-- Clínicas (próximamente) -->
          <a
            routerLink="/admin/clinicas"
            routerLinkActive="bg-white/10 text-white"
            class="flex items-center gap-3 px-3 py-2 text-xs font-medium
                   rounded-xl hover:bg-white/10 transition-colors opacity-70"
          >
            <span class="inline-flex">
              <svg xmlns="http://www.w3.org/2000/svg"
                   class="h-5 w-5"
                   viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9.5L12 4l9 5.5" />
                <path d="M5 10v9h14v-9" />
              </svg>
            </span>
            <span class="truncate flex items-center gap-2" *ngIf="!sidebarCollapsed">
              Clínicas
              <span class="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-sky-500/40">
                Próx.
              </span>
            </span>
          </a>
        </nav>

        <!-- Pie sidebar -->
        <div
          class="px-3 py-3 border-t border-white/10 text-[11px]
                 flex items-center justify-between gap-2"
        >
          <div class="text-sky-100 truncate" *ngIf="!sidebarCollapsed">
            <div class="font-semibold truncate">
              {{ (user$ | async)?.username || 'Superadmin' }}
            </div>
            <div class="text-sky-200 truncate">
              {{ (user$ | async)?.email || '' }}
            </div>
          </div>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="flex flex-col flex-1 overflow-hidden">

        <!-- TOPBAR -->
        <header
          class="relative flex items-center justify-between h-14
                 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-500
                 text-white px-4 shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div class="font-semibold text-sm md:text-base">
              Panel de administración general
            </div>
          </div>

          <!-- Perfil + menú -->
          <div class="flex items-center gap-3 text-[11px] md:text-xs">
            <div class="hidden sm:block text-white/80">
              Sesión iniciada como
              <span class="font-semibold text-white">
                {{ (user$ | async)?.username || 'Superadmin' }}
              </span>
            </div>

            <!-- Avatar + menú -->
            <div class="relative">
              <button
                type="button"
                class="inline-flex items-center justify-center
                       h-9 w-9 rounded-full bg-emerald-200 text-emerald-900
                       font-semibold text-xs shadow-sm
                       hover:bg-white hover:text-emerald-700
                       focus:outline-none focus:ring-2 focus:ring-white/60"
                (click)="toggleProfileMenu($event)"
              >
                {{ (user$ | async)?.username?.charAt(0)?.toUpperCase() || 'S' }}
              </button>

              <!-- Panel menú -->
              <div
                *ngIf="showProfileMenu"
                class="absolute right-0 mt-2 w-56 rounded-xl bg-white text-slate-800 shadow-lg border border-slate-200 z-50"
              >
                <div class="px-4 py-3 border-b border-slate-100">
                  <div class="text-xs text-slate-500">
                    Conectado como
                  </div>
                  <div class="text-sm font-semibold truncate">
                    {{ (user$ | async)?.username || 'superadmin' }}
                  </div>
                  <div class="text-xs text-slate-500 truncate">
                    {{ (user$ | async)?.email || '' }}
                  </div>
                </div>

                <div class="py-1">
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span class="inline-flex h-4 w-4 items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg"
                           class="h-4 w-4"
                           viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15A1.65 1.65 0 0 0 21 13.35
                                 8 8 0 0 0 12 4
                                 8 8 0 0 0 3 13.35
                                 1.65 1.65 0 0 0 4.6 15
                                 8 8 0 0 0 12 20
                                 8 8 0 0 0 19.4 15z" />
                      </svg>
                    </span>
                    Perfil (próx.)
                  </button>

                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                    (click)="goToSecurity()"
                  >
                    <span class="inline-flex h-4 w-4 items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg"
                           class="h-4 w-4"
                           viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 1a4 4 0 0 1 4 4v2" />
                        <rect x="5" y="7" width="14" height="14" rx="2" />
                        <path d="M12 12v4" />
                      </svg>
                    </span>
                    Seguridad / contraseña
                  </button>
                </div>

                <div class="py-1 border-t border-slate-100">
                  <button
                    type="button"
                    (click)="logout()"
                    class="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <span class="inline-flex h-4 w-4 items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg"
                           class="h-4 w-4"
                           viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Overlay para cerrar menú al hacer click fuera -->
          <div
            *ngIf="showProfileMenu"
            class="fixed inset-0 z-40"
            (click)="closeProfileMenu()"
          ></div>
        </header>

        <!-- CONTENIDO DE LAS RUTAS HIJAS -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet></router-outlet>
        </main>

        <app-toast></app-toast>

      </div>
    </div>

  `,
})
export class AdminShellLayout {
  private auth = inject(AuthService);
  private router = inject(Router);

  user$ = this.auth.userData$;
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
