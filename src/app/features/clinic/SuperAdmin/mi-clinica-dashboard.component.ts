// src/app/features/clinic/mi-clinica-dashboard.component.ts

import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
        class="bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-slate-200 px-6 py-5
               flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-1.5">
          <p class="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Panel administrador de clínica
          </p>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Hola, {{ displayName || 'Administrador' }} 👋
          </h1>
          <p class="text-sm text-slate-600">
            Desde aquí puedes gestionar tu clínica, equipo y horarios.
          </p>
          <p *ngIf="clinicId" class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
              🏥
            </span>
            Clínica asociada:
            <span class="font-semibold text-slate-800">#{{ clinicId }}</span>
          </p>
        </div>

        <div class="flex flex-col items-start md:items-end gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1
                   text-[11px] font-medium text-indigo-700 border border-indigo-100"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            Modo administrador de clínica
          </span>

          <button
            *ngIf="isAlsoDentist"
            type="button"
            [routerLink]="'/dashboard'"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5
                   text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span class="text-[13px]">🦷</span>
            <span>Cambiar a modo odontólogo</span>
          </button>
        </div>
      </header>

      <!-- PRIMEROS PASOS (si no tiene consultorios aún) -->
      <section
        *ngIf="clinicId && !loadingRooms && !hasRooms"
        class="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-4
               flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div class="space-y-1">
          <h2 class="text-sm font-semibold text-sky-900 flex items-center gap-2">
            <span
              class="inline-flex h-7 w-7 items-center justify-center rounded-full
                     bg-sky-100 text-sky-700 text-base"
            >
              ⭐
            </span>
            Primeros pasos con tu clínica
          </h2>
          <p class="text-xs text-sky-800 mt-1 max-w-xl leading-relaxed">
            Aún no tienes consultorios configurados.
            Crea al menos uno para que tus odontólogos puedan asociar sus perfiles,
            definir horarios y empezar a agendar citas de forma organizada.
          </p>
          <p class="text-[11px] text-sky-700/90">
            Más adelante podrás agregar más consultorios, doctores y asistentes.
          </p>
        </div>

        <a
          [routerLink]="'/mi-clinica/consultorios'"
          class="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2
                 text-xs font-semibold text-white shadow hover:bg-sky-700
                 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1
                 self-start md:self-auto"
        >
          <span class="text-sm">➕</span>
          <span>Crear primer consultorio</span>
        </a>
      </section>

      <!-- TARJETAS PRINCIPALES -->
      <section class="grid gap-4 md:grid-cols-3">
        <!-- Equipo clínico -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                 flex flex-col justify-between hover:shadow-md hover:border-slate-300
                 transition-shadow transition-colors"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <div
                class="inline-flex h-8 w-8 items-center justify-center rounded-full
                       bg-emerald-50 text-emerald-700 text-lg"
              >
                👥
              </div>
              <h2 class="text-sm font-semibold text-slate-900">
                Equipo clínico
              </h2>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Gestiona odontólogos y asistentes que trabajan en tu clínica,
              define quién puede atender y en qué consultorios.
            </p>
          </div>
          <div class="mt-4 flex justify-between items-end text-[11px] text-slate-500">
            <div class="space-y-0.5">
              <p>Doctores registrados: —</p>
              <p>Asistentes: —</p>
            </div>
            <!-- por ahora apunta al mismo resumen, luego lo cambiaremos a /mi-clinica/doctores -->
            <a
              [routerLink]="'/mi-clinica'"
              class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <span>Ver equipo</span>
              <span>→</span>
            </a>
          </div>
        </article>

        <!-- Horarios y agenda -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                 flex flex-col justify-between hover:shadow-md hover:border-slate-300
                 transition-shadow transition-colors"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <div
                class="inline-flex h-8 w-8 items-center justify-center rounded-full
                       bg-indigo-50 text-indigo-700 text-lg"
              >
                🕒
              </div>
              <h2 class="text-sm font-semibold text-slate-900">
                Horarios de atención
              </h2>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Define cómo se organizarán los horarios de atención en tu clínica
              para que las citas se ajusten a la disponibilidad real.
            </p>
          </div>
          <div class="mt-4 flex justify-between items-end text-[11px] text-slate-500">
            <div class="space-y-0.5">
              <p *ngIf="isAlsoDentist">
                Configura tus horarios personales de atención por consultorio.
              </p>
              <p *ngIf="!isAlsoDentist">
                Los horarios se definen por cada odontólogo de la clínica.
              </p>
            </div>

            <!-- CTA distinta según si también es dentista -->
            <a
              *ngIf="isAlsoDentist"
              [routerLink]="'/mi-clinica/horarios'"
              class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <span>Ver / configurar</span>
              <span>→</span>
            </a>
            <button
              *ngIf="!isAlsoDentist"
              type="button"
              class="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1
                     text-[11px] text-slate-400 cursor-not-allowed bg-slate-50/60"
            >
              Disponible cuando registres doctores
            </button>
          </div>
        </article>

        <!-- Pacientes (futuro) -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4
                 flex flex-col justify-between opacity-90 hover:opacity-100
                 hover:shadow-md hover:border-slate-300 transition"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <div
                class="inline-flex h-8 w-8 items-center justify-center rounded-full
                       bg-rose-50 text-rose-600 text-lg"
              >
                🧑‍⚕️
              </div>
              <h2 class="text-sm font-semibold text-slate-900">
                Pacientes
              </h2>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Visualiza y gestiona el padrón de pacientes de tu clínica,
              con filtros por doctor y tipo de tratamiento.
            </p>
          </div>
          <div class="mt-4 flex justify-between items-end text-[11px] text-slate-500">
            <div>
              <p>Próximamente: listado, filtros y detalles clínicos.</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1
                     text-[11px] text-slate-400 cursor-not-allowed bg-slate-50"
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

  loadingRooms = false;
  hasRooms = false;
  roomsCount = 0;

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

      // si tiene clínica, miramos si ya tiene consultorios
      if (this.clinicId) {
        await this.loadRooms();
      }
    } catch (err) {
      console.error('MiClinicaDashboard: error obteniendo /api/me', err);
      this.displayName = 'Administrador';
    }
  }

  private async loadRooms(): Promise<void> {
    if (!this.clinicId) return;

    this.loadingRooms = true;
    try {
      const resp: any = await firstValueFrom(
        this.http.get<any[] | any>(
          `${environment.apiBase}/api/clinic/${this.clinicId}/rooms`
        )
      );
      const arr: any[] = Array.isArray(resp) ? resp : [resp];
      this.roomsCount = arr.length;
      this.hasRooms = this.roomsCount > 0;
    } catch (err) {
      console.error('MiClinicaDashboard: error obteniendo consultorios', err);
      this.hasRooms = false;
    } finally {
      this.loadingRooms = false;
    }
  }
}
