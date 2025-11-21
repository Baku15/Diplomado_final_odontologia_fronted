// src/app/features/clinic/mi-clinica-dashboard.component.ts

import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface MeResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  clinicId: number | null;
  mustCompleteProfile?: boolean;
  givenName?: string | null;
  familyName?: string | null;
  fullName?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-mi-clinica-dashboard',
  imports: [CommonModule, NgIf, RouterLink],
  template: `
    <!-- El navbar ya lo pone ClinicShellLayout -->

    <section class="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">

      <!-- ENCABEZADO -->
      <header
        class="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5
               flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">
            Panel administrador de clínica
          </p>
          <h1 class="text-2xl font-bold text-slate-900">
            Hola, {{ displayName || 'Administrador' }} 👋
          </h1>
          <p class="text-sm text-slate-600 mt-1">
            Desde aquí puedes gestionar tu clínica, equipo y horarios.
          </p>
          <p *ngIf="clinicId" class="text-xs text-slate-500 mt-1">
            Clínica asociada:
            <span class="font-semibold">#{{ clinicId }}</span>
          </p>
        </div>

        <div class="flex flex-col items-start md:items-end gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1
                   text-xs font-medium text-indigo-700"
          >
            <span class="h-2 w-2 rounded-full bg-indigo-500"></span>
            Modo administrador de clínica
          </span>

          <button
            *ngIf="isAlsoDentist"
            type="button"
            [routerLink]="'/dashboard'"
            class="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5
                   text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cambiar a modo odontólogo
          </button>
        </div>
      </header>

      <!-- TARJETAS PRINCIPALES -->
      <section class="grid gap-4 md:grid-cols-3">
        <!-- Equipo clínico -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                 flex flex-col justify-between"
        >
          <div class="space-y-1.5">
            <h2 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Equipo clínico
            </h2>
            <p class="text-xs text-slate-600">
              Gestiona odontólogos y asistentes que trabajan en tu clínica.
            </p>
          </div>
          <div class="mt-4 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Doctores registrados: —</p>
              <p>Asistentes: —</p>
            </div>
            <!-- por ahora apunta al mismo resumen, luego lo cambiaremos a /mi-clinica/doctores -->
            <a
              [routerLink]="'/mi-clinica'"
              class="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Ver equipo →
            </a>
          </div>
        </article>

        <!-- Horarios y agenda -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                 flex flex-col justify-between"
        >
          <div class="space-y-1.5">
            <h2 class="text-sm font-semibold text-slate-900">
              Horarios de atención
            </h2>
            <p class="text-xs text-slate-600">
              Configura los días y horas en que tu clínica atiende pacientes.
            </p>
          </div>
          <div class="mt-4 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Configuración por doctor y consultorio.</p>
            </div>
            <a
              [routerLink]="'/mi-clinica/horarios'"
              class="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Ver / configurar →
            </a>
          </div>
        </article>

        <!-- Pacientes (futuro) -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                 flex flex-col justify-between opacity-80"
        >
          <div class="space-y-1.5">
            <h2 class="text-sm font-semibold text-slate-900">
              Pacientes
            </h2>
            <p class="text-xs text-slate-600">
              Visualiza y gestiona el padrón de pacientes de tu clínica.
            </p>
          </div>
          <div class="mt-4 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Próximamente: listado y filtros por doctor.</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1
                     text-[11px] text-slate-400 cursor-not-allowed"
            >
              En construcción
            </button>
          </div>
        </article>
      </section>
    </section>
  `,
})
export class MiClinicaDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  displayName = '';
  clinicId: number | null = null;
  isAlsoDentist = false;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const me: MeResponse = await firstValueFrom(
        this.http.get<MeResponse>('/api/me'),
      );
      console.log('MiClinicaDashboard: /api/me =', me);

      this.clinicId = me.clinicId ?? null;

      if (me.fullName) {
        this.displayName = me.fullName;
      } else if (me.givenName || me.familyName) {
        this.displayName = `${me.givenName ?? ''} ${me.familyName ?? ''}`.trim();
      } else {
        this.displayName = me.username || me.email || '';
      }

      const roles = me.roles || [];
      this.isAlsoDentist = roles.includes('ROLE_DENTIST');
    } catch (err) {
      console.error('MiClinicaDashboard: error obteniendo /api/me', err);
      this.displayName = 'Administrador';
    }
  }
}
