import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PatientService } from './patient.service';

@Component({
  standalone: true,
  selector: 'app-patient-list',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">

      <!-- Mensaje de éxito (se oculta a los 5s) -->
      <div
        *ngIf="successMessage"
        class="mb-4 flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span>{{ successMessage }}</span>
        <button (click)="successMessage = null" class="text-xs underline">Cerrar</button>
      </div>

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Pacientes</h1>
          <p class="text-slate-500">Administración de pacientes registrados en tu clínica</p>
        </div>

        <button
          (click)="goNew()"
          class="bg-emerald-600 hover:bg-emerald-700 transition text-white px-5 py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20">
          ➕ Nuevo paciente
        </button>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

        <input
          [(ngModel)]="search"
          type="text"
          placeholder="Buscar por nombre o documento..."
          class="w-full md:w-96 px-4 py-3 rounded-xl border border-slate-300 shadow-sm
                 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
        />

        <select
          [(ngModel)]="sortOrder"
          class="px-3 py-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-emerald-500"
        >
          <option value="desc">Ordenar: Más recientes primero</option>
          <option value="asc">Ordenar: Más antiguos primero</option>
        </select>

        <select
          [(ngModel)]="pageSize"
          (change)="goToPage(1)"
          class="px-3 py-3 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-emerald-500"
        >
          <option [value]="10">10 por página</option>
          <option [value]="20">20 por página</option>
          <option [value]="50">50 por página</option>
          <option [value]="100">100 por página</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let s of skeletons" class="p-6 bg-white rounded-xl shadow animate-pulse">
          <div class="h-6 bg-slate-200 rounded w-1/2 mb-3"></div>
          <div class="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="!loading && error" class="p-4 bg-red-100 text-red-700 border border-red-300 rounded-xl shadow mb-6">
        {{ error }}
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && !error && paginated.length === 0" class="text-center py-20 text-slate-500">
        <div class="text-6xl mb-4">📭</div>
        <p class="text-lg">No se encontraron pacientes</p>
        <p class="text-sm">Puedes crear uno nuevo presionando el botón arriba</p>
      </div>

      <!-- Cards -->
      <div *ngIf="!loading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let p of paginated"
          class="group bg-white p-6 rounded-xl shadow hover:shadow-xl transition border border-slate-200 hover:border-emerald-400">

          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-slate-800 group-hover:text-emerald-600 transition">
                {{ p.givenName }} {{ p.familyName }}
              </h2>
            </div>

            <div class="flex flex-col items-end gap-2">
              <span class="text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-500 border">
                ID: {{ p.id }}
              </span>

              <!-- Mini foto o iniciales -->
              <ng-container *ngIf="p.showPhoto; else initialsTpl">
                <img
                  [src]="p.photoUrl"
                  alt="Foto paciente"
                  class="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-sm"
                  (error)="onPhotoError(p)"
                />
              </ng-container>
              <ng-template #initialsTpl>
                <div
                  class="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                  {{ getInitials(p) }}
                </div>
              </ng-template>
            </div>
          </div>

          <div class="text-slate-600 text-sm mt-3 mb-2">
            <strong>Documento:</strong> {{ p.documentNumber || '—' }}
          </div>

          <div class="text-slate-600 text-sm mb-2">
            <strong>Creado:</strong> {{ toDateString(p.createdAt) }}
          </div>

          <div class="space-y-1 text-sm mt-3">
            <div *ngIf="p.phoneMobile" class="flex items-center gap-2">
              <span class="text-emerald-600">📞</span><span>{{ p.phoneMobile }}</span>
            </div>
            <div *ngIf="p.email" class="flex items-center gap-2">
              <span class="text-blue-600">✉️</span><span>{{ p.email }}</span>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="mt-5 flex flex-col sm:flex-row gap-2">
            <a
              [routerLink]="['/dashboard/pacientes', p.id]"
              class="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm shadow transition">
              Ver / Editar
            </a>

            <a
              [routerLink]="['/dashboard/pacientes', p.id, 'historia-clinica']"
              class="flex-1 text-center bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm shadow transition">
              Historia clínica
            </a>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && filtered.length > 0" class="mt-10 flex items-center justify-between">
        <p class="text-sm text-slate-500">
          Mostrando {{ startIndex + 1 }}–{{ endIndex }} de {{ filtered.length }} pacientes
        </p>

        <div class="flex gap-2">
          <button (click)="prevPage()" [disabled]="page === 1"
                  class="px-4 py-2 bg-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-300 transition">
            ⬅ Anterior
          </button>

          <button (click)="nextPage()" [disabled]="page >= totalPages"
                  class="px-4 py-2 bg-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-300 transition">
            Siguiente ➡
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

      this.patients = (list || []).map((p: any) => {
        const hasPhotoKey = !!p.profileKey; // ajusta si tu DTO usa otro nombre
        return {
          ...p,
          createdAt: p.createdAt || '',
          photoUrl: hasPhotoKey && clinicId
            ? `${apiBase}/api/clinic/${clinicId}/patients/${p.id}/photo`
            : null,
          showPhoto: hasPhotoKey && !!clinicId,
        };
      });
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
    return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
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
