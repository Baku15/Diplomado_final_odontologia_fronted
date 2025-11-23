import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  CommonModule,
  NgIf,
  AsyncPipe,
  NgClass,
  isPlatformBrowser,
} from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { map, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';

interface MeResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  clinicId: number | null;
  mustCompleteProfile?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-clinic-shell-layout',
  imports: [
    CommonModule,
    NgIf,
    AsyncPipe,
    NgClass,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  template: `
    <div class="flex min-h-screen bg-slate-100">

      <!-- SIDEBAR (desktop) -->
      <aside
        class="hidden md:flex flex-col bg-gradient-to-b
               from-sky-950 via-sky-900 to-emerald-800
               text-sky-50 shadow-2xl transition-[width] duration-200 ease-in-out"
        [ngClass]="sidebarCollapsed ? 'w-20' : 'w-64'"
      >
        <!-- Brand + botón hamburguesa -->
        <div
          class="px-3 py-4 border-b border-white/10
                 flex items-center gap-3"
        >
          <!-- Botón para plegar sidebar -->
          <button
            type="button"
            class="inline-flex items-center justify-center
                   h-9 w-9 rounded-full bg-black/20 hover:bg-black/30
                   focus:outline-none focus:ring-2 focus:ring-white/60"
            (click)="toggleSidebar()"
          >
            <svg xmlns="http://www.w3.org/2000/svg"
                 class="h-4 w-4 text-sky-50"
                 viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path *ngIf="!sidebarCollapsed" d="M4 6h16M4 12h12M4 18h16" />
              <path *ngIf="sidebarCollapsed" d="M4 6h16M10 12h10M4 18h16" />
            </svg>
          </button>

          <!-- Logo -->
          <div
            class="flex h-9 w-9 items-center justify-center
                   rounded-xl bg-white/15 text-xl shadow-inner"
          >
            🦷
          </div>

          <div class="flex flex-col" *ngIf="!sidebarCollapsed">
            <span class="text-[11px] tracking-[0.18em] uppercase text-sky-300">
              OdontoWeb
            </span>
            <span class="text-sm font-semibold text-white">
              Mi clínica
            </span>
          </div>
        </div>

        <!-- Navegación -->
        <nav class="flex-1 overflow-y-auto px-2 py-4 space-y-4 text-[11px]">

          <!-- Grupo: Gestión -->
          <div class="space-y-1.5">
            <p
              *ngIf="!sidebarCollapsed"
              class="px-3 text-[10px] font-semibold uppercase tracking-wide text-sky-300/80"
            >
              Gestión
            </p>

            <!-- Resumen -->
            <a
              routerLink="/mi-clinica"
              routerLinkActive="bg-white/10 text-white shadow-sm"
              (click)="handleNavClick($event, '/mi-clinica')"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium
                     rounded-xl hover:bg-white/10 hover:text-white transition-colors
                     border border-transparent"
              [ngClass]="{
                'opacity-50 cursor-not-allowed': isNavLocked('/mi-clinica')
              }"
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
              <span class="truncate" *ngIf="!sidebarCollapsed">Resumen</span>
            </a>

            <!-- Doctores -->
            <a
              routerLink="/mi-clinica/doctores"
              routerLinkActive="bg-white/10 text-white shadow-sm"
              (click)="handleNavClick($event, '/mi-clinica/doctores')"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium
                     rounded-xl hover:bg-white/10 hover:text-white transition-colors
                     border border-transparent"
              [ngClass]="{
                'opacity-50 cursor-not-allowed': isNavLocked('/mi-clinica/doctores')
              }"
            >
              <span class="inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg"
                     class="h-5 w-5"
                     viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="3" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span class="truncate" *ngIf="!sidebarCollapsed">
                Doctores
              </span>
            </a>

            <!-- Pacientes (Próx.) -->
            <a
              routerLink="/mi-clinica/pacientes"
              routerLinkActive="bg-white/10 text-white shadow-sm"
              (click)="handleNavClick($event, '/mi-clinica/pacientes')"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium
                     rounded-xl hover:bg-white/10 hover:text-white transition-colors
                     border border-transparent"
              [ngClass]="{
                'opacity-50 cursor-not-allowed': isNavLocked('/mi-clinica/pacientes')
              }"
            >
              <span class="inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg"
                     class="h-5 w-5"
                     viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
                </svg>
              </span>
              <span class="truncate flex items-center gap-2" *ngIf="!sidebarCollapsed">
                Pacientes
                <span class="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-sky-500/40 text-sky-50">
                  Próx.
                </span>
              </span>
            </a>
          </div>

          <!-- Grupo: Configuración -->
          <div class="space-y-1.5">
            <p
              *ngIf="!sidebarCollapsed"
              class="mt-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-sky-300/80"
            >
              Configuración
            </p>

            <!-- Horarios (solo si también es odontólogo) -->
            <a
              *ngIf="isDentist"
              routerLink="/mi-clinica/horarios"
              routerLinkActive="bg-white/10 text-white shadow-sm"
              (click)="handleNavClick($event, '/mi-clinica/horarios')"
              class="flex items-center gap-3 px-3 py-2 text-xs font-medium
                     rounded-xl hover:bg-white/10 hover:text-white transition-colors
                     border border-transparent"
              [ngClass]="{
                'opacity-50 cursor-not-allowed': isNavLocked('/mi-clinica/horarios')
              }"
            >
              <span class="inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg"
                     class="h-5 w-5"
                     viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span class="truncate flex items-center gap-1" *ngIf="!sidebarCollapsed">
                Mis horarios
                <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/60 text-emerald-50">
                  Doctor
                </span>
              </span>
            </a>

            <!-- Consultorios -->
            <a
              routerLink="/mi-clinica/consultorios"
              routerLinkActive="bg-white/10 text-white shadow-sm"
              (click)="handleNavClick($event, '/mi-clinica/consultorios')"
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
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span class="truncate" *ngIf="!sidebarCollapsed">
                Consultorios
              </span>
            </a>
          </div>
        </nav>

        <!-- Perfil profesional (solo si es dentista) -->
        <a
          *ngIf="isDentist"
          routerLink="/mi-clinica/perfil-profesional"
          routerLinkActive="bg-white/10 text-white shadow-sm"
          (click)="handleNavClick($event, '/mi-clinica/perfil-profesional')"
          class="flex items-center gap-3 px-3 py-2 text-xs font-medium
                 rounded-xl hover:bg-white/10 hover:text-white transition-colors
                 border border-transparent"
          [ngClass]="{
            'opacity-50 cursor-not-allowed': isNavLocked('/mi-clinica/perfil-profesional')
          }"
        >
          <span class="inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg"
                 class="h-5 w-5"
                 viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
              <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
          </span>
          <span class="truncate flex items-center gap-1" *ngIf="!sidebarCollapsed">
            Perfil profesional
          </span>
        </a>

        <!-- Pie sidebar (solo info de usuario) -->
        <div
          class="px-3 py-3 border-t border-white/10 text-[11px]
                 flex items-center gap-2 bg-black/10"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full
                   bg-white/20 text-xs font-semibold"
          >
            {{ (userInitial$ | async) || 'U' }}
          </div>
          <div class="text-sky-100 truncate">
            <div class="font-semibold truncate">
              {{ (user$ | async)?.username || 'Administrador' }}
            </div>
            <div class="text-sky-200 truncate text-[10px]">
              {{ (user$ | async)?.email || '' }}
            </div>
          </div>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="flex flex-col flex-1 overflow-hidden">

        <!-- TOPBAR -->
        <header
          class="flex items-center justify-between h-14
                 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-500
                 text-white px-4 shadow-md"
        >
          <div class="flex flex-col gap-0.5">
            <div class="font-semibold text-sm md:text-base flex items-center gap-2">
              <span>Panel de administración de clínica</span>
              <span
                class="hidden md:inline-flex items-center gap-1 text-[10px]
                       px-2 py-0.5 rounded-full bg-black/15"
              >
                🛠️
                <span>Modo admin</span>
              </span>
            </div>
            <div
              *ngIf="forceProfileCompletion"
              class="hidden md:inline-flex items-center gap-2 text-[11px] text-sky-100"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse"></span>
              <span>Completa tu perfil profesional para usar todo el panel.</span>
            </div>
          </div>

          <!-- Avatar + menú tipo YouTube -->
          <div class="relative" #userMenuRoot>
            <button
              type="button"
              class="flex items-center justify-center h-9 w-9 rounded-full
                     bg-white/95 text-sky-700 font-semibold text-sm
                     shadow hover:bg-white focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-offset-sky-600 focus:ring-white"
              (click)="toggleUserMenu()"
            >
              {{ (userInitial$ | async) || 'U' }}
            </button>

            <!-- Dropdown -->
            <div
              *ngIf="showUserMenu"
              class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg
                     border border-slate-100 py-2 text-xs text-slate-700 z-50"
            >
              <div class="px-3 pb-2 border-b border-slate-100 mb-2">
                <div class="font-semibold text-slate-900 text-sm truncate">
                  {{ (user$ | async)?.username || 'Usuario' }}
                </div>
                <div class="text-[11px] text-slate-500 truncate">
                  {{ (user$ | async)?.email || '' }}
                </div>
              </div>

              <button
                type="button"
                class="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                (click)="goToSecurity()"
              >
                <svg xmlns="http://www.w3.org/2000/svg"
                     class="h-4 w-4"
                     viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 1a4 4 0 0 1 4 4v2" />
                  <rect x="5" y="7" width="14" height="14" rx="2" />
                  <path d="M12 12v4" />
                </svg>
                <span>Seguridad / contraseña</span>
              </button>

              <button
                type="button"
                class="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                (click)="logout()"
              >
                <svg xmlns="http://www.w3.org/2000/svg"
                     class="h-4 w-4"
                     viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </header>

        <!-- CONTENIDO DE LAS RUTAS HIJAS -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/80">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class ClinicShellLayout implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  user$ = this.auth.userData$;

  // inicial (letra) para el avatar
  userInitial$ = this.user$.pipe(
    map((u) => {
      const name = u?.username || u?.email || '';
      return name ? name.trim().charAt(0).toUpperCase() : 'U';
    })
  );

  sidebarCollapsed = false;
  showUserMenu = false;

  // flags de rol
  isDentist = false;
  isClinicAdmin = false;

  // cuando es dentista y debe completar perfil → bloqueamos menú
  forceProfileCompletion = false;

  @ViewChild('userMenuRoot', { static: false })
  userMenuRoot?: ElementRef<HTMLElement>;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const me = await firstValueFrom(
        this.http.get<MeResponse>('/api/me')
      );
      const roles = me.roles || [];

      this.isDentist = roles.includes('ROLE_DENTIST');
      this.isClinicAdmin = roles.includes('ROLE_CLINIC_ADMIN');
      this.forceProfileCompletion = this.isDentist && !!me.mustCompleteProfile;
    } catch (err) {
      console.error('ClinicShellLayout: error obteniendo /api/me', err);
      this.forceProfileCompletion = false;
    }
  }

  /** Indica si una ruta del sidebar debe estar bloqueada en modo "completar perfil" */
  isNavLocked(target: string): boolean {
    if (!this.forceProfileCompletion) return false;
    // Única ruta permitida mientras completa perfil: consultorios
    return target !== '/mi-clinica/consultorios';
  }

  /** Intercepta clicks en el sidebar para evitar que salte el flujo */
  handleNavClick(event: Event, target: string): void {
    if (!this.isNavLocked(target)) {
      return; // navegación normal
    }

    event.preventDefault();
    event.stopPropagation();

    alert(
      'Primero debes completar tu perfil profesional de odontólogo antes de usar el resto del panel.'
    );
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  // Cerrar menú al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showUserMenu || !this.userMenuRoot) return;

    const target = event.target as HTMLElement | null;
    if (target && !this.userMenuRoot.nativeElement.contains(target)) {
      this.showUserMenu = false;
    }
  }

  async goToSecurity() {
    this.showUserMenu = false;
    await this.router.navigateByUrl('/mi-cuenta/seguridad');
  }

  async logout() {
    this.showUserMenu = false;
    await this.auth.logout();
  }
}
