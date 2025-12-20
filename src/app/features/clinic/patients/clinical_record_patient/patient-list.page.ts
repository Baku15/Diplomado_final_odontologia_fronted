// src/app/features/clinic/patients/patient-list.page.ts
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PatientService } from '../../../../core/services/patient.service';

@Component({
  standalone: true,
  selector: 'app-patient-list',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">

      <!-- Mensaje de éxito (se oculta a los 5s) -->
      <div
        *ngIf="successMessage"
        class="mb-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-25 px-5 py-4 text-sm text-emerald-800 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-medium">{{ successMessage }}</span>
          </div>
          <button (click)="successMessage = null" class="text-emerald-600 hover:text-emerald-800 transition-colors">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Gestión de Pacientes</h1>
          <p class="text-slate-600 mt-1">Administra los pacientes registrados en tu clínica</p>
        </div>

        <button
          (click)="goNew()"
          class="group bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all text-white px-5 py-3 rounded-xl text-sm font-medium shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo paciente
        </button>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div class="relative flex-1">
          <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            [(ngModel)]="search"
            type="text"
            placeholder="Buscar por nombre o documento..."
            class="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          />
        </div>

        <div class="flex items-center gap-3">
          <select
            [(ngModel)]="sortOrder"
            class="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
          >
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguos primero</option>
          </select>

          <select
            [(ngModel)]="pageSize"
            (change)="goToPage(1)"
            class="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
          >
            <option [value]="10">10 por página</option>
            <option [value]="20">20 por página</option>
            <option [value]="50">50 por página</option>
            <option [value]="100">100 por página</option>
          </select>
        </div>
      </div>

      <!-- Loading skeleton (single-row style) -->
      <div *ngIf="loading" class="space-y-3">
        <div *ngFor="let s of skeletons" class="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-100 animate-pulse">
          <div class="h-12 w-12 rounded-full bg-slate-200"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-slate-200 rounded w-1/3"></div>
            <div class="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
          <div class="w-32 h-10 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="!loading && error" class="p-5 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-25 shadow-sm mb-6">
        <div class="flex items-start gap-3">
          <svg class="h-6 w-6 text-rose-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div>
            <p class="font-medium text-rose-800">Error al cargar pacientes</p>
            <p class="text-sm text-rose-600 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && !error && paginated.length === 0" class="text-center py-16 px-4">
        <div class="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-6">
          <svg class="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-700 mb-2">No hay pacientes registrados</h3>
        <p class="text-slate-500 mb-6">Comienza agregando tu primer paciente</p>
        <button
          (click)="goNew()"
          class="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Agregar primer paciente
        </button>
      </div>

      <!-- LIST (one-row per patient) -->
      <div *ngIf="!loading && !error && paginated.length > 0" class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <!-- header row (columns labels) -->
        <div class="hidden md:flex items-center gap-4 px-6 py-4 text-xs text-slate-500 font-semibold bg-gradient-to-r from-slate-50 to-slate-25 border-b border-slate-100">
          <div class="w-12"></div>
          <div class="flex-1">Paciente</div>
          <div class="w-56 text-left">Documento</div>
          <div class="w-48 text-left">Contacto</div>
          <div class="w-48 text-left">Creado</div>
          <div class="w-72 text-right pr-4">Acciones</div>
        </div>

        <!-- rows -->
        <div *ngFor="let p of paginated; let i = index"
             [class.bg-slate-50]="i % 2 === 0"
             [class.bg-white]="i % 2 !== 0"
             class="flex items-center gap-4 px-6 py-5 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-emerald-50/50 transition-all duration-200 border-b border-slate-100 last:border-b-0">

          <!-- Avatar -->
          <div class="w-12 flex items-center justify-center">
            <div *ngIf="p.showPhoto; else initialsSmall" class="relative">
              <img [src]="p.photoUrl" alt="Foto paciente"
                   class="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                   (error)="onPhotoError(p)" />
              <div class="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 border-2 border-white"></div>
            </div>
            <ng-template #initialsSmall>
              <div class="h-12 w-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600 shadow-sm">
                {{ getInitials(p) }}
              </div>
            </ng-template>
          </div>

          <!-- Name + email -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-col">
              <div class="text-sm font-semibold text-slate-800 truncate">{{ p.givenName }} {{ p.familyName }}</div>
              <div class="text-xs text-slate-500 truncate mt-1">{{ p.email || (p.phoneMobile ? ('📞 ' + p.phoneMobile) : 'Sin contacto') }}</div>
            </div>
          </div>

          <!-- Document -->
          <div class="w-56 text-sm text-slate-600 hidden md:block">
            <div class="truncate">
              <span class="font-medium text-slate-700">{{ p.documentType || 'Sin doc.' }}</span>
              {{ p.documentNumber ? ' · ' + p.documentNumber : '' }}
            </div>
            <div class="text-xs text-slate-400 mt-1">ID: {{ p.id }}</div>
          </div>

          <!-- Contact -->
          <div class="w-48 text-sm text-slate-600 hidden lg:block">
            <div *ngIf="p.phoneMobile" class="flex items-center gap-2 truncate">
              <svg class="h-4 w-4 text-teal-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <span class="truncate">{{ p.phoneMobile }}</span>
            </div>
            <div *ngIf="p.email" class="flex items-center gap-2 truncate mt-1">
              <svg class="h-4 w-4 text-teal-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              <span class="truncate">{{ p.email }}</span>
            </div>
          </div>

          <!-- Created date -->
          <div class="w-48 text-sm text-slate-600 hidden lg:block">
            <div class="flex items-center gap-2">
              <svg class="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>{{ toDateString(p.createdAt) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="w-72 flex items-center justify-end pr-4">
            <a
              [routerLink]="[p.id]"
              class="group bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm shadow-teal-500/20 hover:shadow-teal-500/30 flex items-center gap-2 transition-all duration-200">
              <svg class="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>Ver paciente</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && filtered.length > 0" class="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p class="text-sm text-slate-600">
          Mostrando <span class="font-semibold text-slate-800">{{ startIndex + 1 }}–{{ endIndex }}</span>
          de <span class="font-semibold text-slate-800">{{ filtered.length }}</span> pacientes
        </p>

        <div class="flex gap-2 items-center">
          <button (click)="prevPage()" [disabled]="page === 1"
                  class="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Anterior
          </button>

          <div class="px-4 py-2.5 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 text-sm font-medium text-slate-700">
            Página <span class="font-bold text-teal-700">{{ page }}</span> de {{ totalPages }}
          </div>

          <button (click)="nextPage()" [disabled]="page >= totalPages"
                  class="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            Siguiente
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PatientListPage implements OnInit {
  private patientService = inject(PatientService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  patients: any[] = [];
  loading = true;
  error: string | null = null;

  search = '';
  sortOrder: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 10;
  skeletons = Array(6).fill(0);

  successMessage: string | null = null;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    // Mensaje de navegación (create / delete / update)
    const nav = this.router.getCurrentNavigation();
    const msg = nav?.extras?.state?.['message'] ?? null;
    if (msg) {
      this.successMessage = msg;
      setTimeout(() => {
        if (this.successMessage === msg) {
          this.successMessage = null;
        }
      }, 5000);
    }

    this.loading = true;
    this.error = null;
    try {
      const resp: any = await this.patientService.listPatients();

      let list: any[] = [];
      if (Array.isArray(resp)) {
        list = resp;
      } else if (resp && Array.isArray(resp.content)) {
        list = resp.content;
      } else if (resp) {
        const maybeArray = Object.values(resp).find((v: any) => Array.isArray(v)) as any[] | undefined;
        list = maybeArray || [];
      }

      const clinicId = await this.patientService.getClinicIdForRoutes();
      const apiBase = this.patientService.apiBaseUrl;

      // prepare patients array and detect odontogram existence
      this.patients = (list || []).map((p: any) => {
        const hasPhotoKey = !!p.profileKey; // ajusta si tu DTO usa otro nombre
        return {
          ...p,
          createdAt: p.createdAt || '',
          photoUrl: hasPhotoKey && clinicId
            ? `${apiBase}/api/clinic/${clinicId}/patients/${p.id}/photo`
            : null,
          showPhoto: hasPhotoKey && !!clinicId,
          // si backend ya envía un flag, úsalo; si no, lo rellenamos después
          hasOdontogram: (p.hasOdontogram === true) || (p.hasActiveOdontogram === true) || undefined
        };
      });

      // Si alguno quedó con hasOdontogram === undefined, comprobamos con el backend (paralelo)
      const toCheck = this.patients.filter(p => p.hasOdontogram === undefined);
      if (toCheck.length > 0 && clinicId) {
        // hacemos llamadas en paralelo — usamos Promise.allSettled para tolerar fallos
        const checks = toCheck.map(p => {
          const url = `${apiBase}/api/clinic/${clinicId}/patients/${p.id}/odontogram`;
          // Llamamos el GET y chequeamos status: 200 -> existe, 204 -> no existe
          // Usamos observe:'response' para leer el status
          return this.http.get(url, { observe: 'response' as const }).toPromise()
            .then((resp: any) => {
              // si 200 y body, consideramos que existe; 204 llega como error en algunos CORS setups
              if (resp && resp.status === 200) return { id: p.id, exists: true };
              return { id: p.id, exists: false };
            })
            .catch((err: any) => {
              // si el servidor responde 204 No Content muchos clientes lo tratan como éxito o error
              // pero la ruta puede devolver 204 -> tratamos como "no existe".
              // Si hay 405/403/500 etc, mejor marcar como false para no mostrar botón erróneo.
              return { id: p.id, exists: false };
            });
        });

        const settled = await Promise.allSettled(checks);
        for (const r of settled) {
          if (r.status === 'fulfilled') {
            const { id, exists } = r.value as any;
            const idx = this.patients.findIndex(x => x.id === id);
            if (idx >= 0) this.patients[idx].hasOdontogram = exists;
          }
        }
      }

    } catch (err: any) {
      console.error('PatientListPage: error', err);
      if (err?.message && String(err.message).includes('No clinicId')) {
        this.error = 'No se pudo obtener la clínica del usuario actual. ¿Iniciaste sesión correctamente?';
      } else {
        this.error = err?.error?.message || err?.message || 'Error cargando pacientes.';
      }
    } finally {
      this.loading = false;
    }
  }

  get filtered() {
    const term = this.search.toLowerCase().trim();
    const list = Array.isArray(this.patients) ? [...this.patients] : [];

    list.sort((a, b) => {
      const da = Date.parse(String(a.createdAt || '')) || 0;
      const db = Date.parse(String(b.createdAt || '')) || 0;
      return this.sortOrder === 'asc' ? da - db : db - da;
    });

    if (!term) return list;

    return list.filter(p =>
      `${p.givenName || ''} ${p.familyName || ''}`.toLowerCase().includes(term) ||
      (p.documentNumber || '').toLowerCase().includes(term)
    );
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paginated() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filtered.slice(start, end);
  }

  get startIndex() {
    return (this.page - 1) * this.pageSize;
  }

  get endIndex() {
    return Math.min(this.startIndex + this.pageSize, this.filtered.length);
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  goToPage(p: number) {
    this.page = p;
  }

  toDateString(value?: string | Date) {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getInitials(p: any): string {
    const g = (p.givenName || '').toString().trim();
    const f = (p.familyName || '').toString().trim();
    const g1 = g ? g[0].toUpperCase() : '';
    const f1 = f ? f[0].toUpperCase() : '';
    return (g1 + f1) || 'P';
  }

  onPhotoError(p: any) {
    p.showPhoto = false; // oculta img y deja ver las iniciales
  }

  goNew() {
    this.router.navigateByUrl('/dashboard/pacientes/nuevo');
  }
}
