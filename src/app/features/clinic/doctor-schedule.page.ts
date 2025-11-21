// src/app/features/clinic/doctor-schedule.page.ts

import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import {
  CommonModule,
  NgIf,
  NgFor,
  NgClass,
  isPlatformBrowser,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DoctorDayScheduleVm {
  dayOfWeek: number;     // 1..7
  label: string;         // Lunes, Martes...
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  giveBreak: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  chairs: number;
}

interface DoctorWeeklyScheduleDto {
  days: {
    dayOfWeek: number;
    working: boolean;
    startTime: string | null;
    endTime: string | null;
    giveBreak: boolean;
    breakStart: string | null;
    breakEnd: string | null;
    chairs: number | null;
  }[];
}

@Component({
  standalone: true,
  selector: 'app-doctor-schedule-page',
  imports: [CommonModule, FormsModule, NgIf, NgFor, NgClass],
  template: `
    <main class="min-h-screen bg-slate-50">
      <section class="max-w-6xl mx-auto px-4 py-8">
        <header class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">
              Horarios de atención
            </h1>
            <p class="text-sm text-slate-600 mt-1 max-w-2xl">
              Define en qué días y horarios atenderás pacientes en tu consultorio.
              Estos horarios servirán como base para que la clínica agende tus citas.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            (click)="volverDespuesDeConfigurar()"
          >
            Omitir por ahora
          </button>
        </header>

        <!-- Mensajes -->
        <div *ngIf="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          {{ successMessage }}
        </div>

        <!-- TABLA DE HORARIOS -->
        <div class="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Día</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Trabaja</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Hora inicio</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Hora fin</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Descanso</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Desde</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Hasta</th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">Sillones</th>
              </tr>
              </thead>

              <tbody>
              <tr
                *ngFor="let d of days"
                class="border-b last:border-b-0 border-slate-100"
                [ngClass]="{
                    'bg-slate-50/60': d.working,
                    'bg-white': !d.working
                  }"
              >
                <!-- Día -->
                <td class="px-3 py-2 text-slate-700 font-medium">
                  {{ d.label }}
                </td>

                <!-- Trabaja -->
                <td class="px-3 py-2">
                  <label class="inline-flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      [(ngModel)]="d.working"
                      (ngModelChange)="onWorkingChange(d)"
                      class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Atiende</span>
                  </label>
                </td>

                <!-- Hora inicio -->
                <td class="px-3 py-2">
                  <input
                    type="time"
                    [(ngModel)]="d.startTime"
                    [disabled]="!d.working"
                    class="w-full rounded border px-2 py-1 text-xs
                             border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                             disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>

                <!-- Hora fin -->
                <td class="px-3 py-2">
                  <input
                    type="time"
                    [(ngModel)]="d.endTime"
                    [disabled]="!d.working"
                    class="w-full rounded border px-2 py-1 text-xs
                             border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                             disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>

                <!-- Tiene descanso -->
                <td class="px-3 py-2">
                  <label class="inline-flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      [(ngModel)]="d.giveBreak"
                      [disabled]="!d.working"
                      class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Con descanso</span>
                  </label>
                </td>

                <!-- Descanso inicio -->
                <td class="px-3 py-2">
                  <input
                    type="time"
                    [(ngModel)]="d.breakStart"
                    [disabled]="!d.working || !d.giveBreak"
                    class="w-full rounded border px-2 py-1 text-xs
                             border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                             disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>

                <!-- Descanso fin -->
                <td class="px-3 py-2">
                  <input
                    type="time"
                    [(ngModel)]="d.breakEnd"
                    [disabled]="!d.working || !d.giveBreak"
                    class="w-full rounded border px-2 py-1 text-xs
                             border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                             disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>

                <!-- Sillones -->
                <td class="px-3 py-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    [(ngModel)]="d.chairs"
                    [disabled]="!d.working"
                    class="w-16 rounded border px-2 py-1 text-xs
                             border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                             disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Pie de acciones -->
          <div class="border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
            <p class="text-[11px] text-slate-500">
              Recuerda que las citas solo se podrán agendar dentro de estos horarios
              y respetando el intervalo de descanso (si lo defines).
            </p>

            <button
              type="button"
              class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                     disabled:bg-indigo-300 disabled:cursor-not-allowed"
              [disabled]="saving"
              (click)="save()"
            >
              <span *ngIf="!saving">Guardar horarios</span>
              <span *ngIf="saving">Guardando…</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class DoctorSchedulePage implements OnInit {

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  // para decidir a dónde redirigir
  isClinicAdmin = false;

  // Modelo de horarios
  days: DoctorDayScheduleVm[] = [
    { dayOfWeek: 1, label: 'Lunes',    working: false, startTime: null, endTime: null, giveBreak: false, breakStart: null, breakEnd: null, chairs: 1 },
    { dayOfWeek: 2, label: 'Martes',   working: false, startTime: null, endTime: null, giveBreak: false, breakStart: null, breakEnd: null, chairs: 1 },
    { dayOfWeek: 3, label: 'Miércoles',working: false, startTime: null, endTime: null, giveBreak: false, breakStart: null, breakEnd: null, chairs: 1 },
    { dayOfWeek: 4, label: 'Jueves',   working: false, startTime: null, endTime: null, giveBreak: false, breakStart: null, breakEnd: null, chairs: 1 },
    { dayOfWeek: 5, label: 'Viernes',  working: false, startTime: null, endTime: null, giveBreak: false, breakStart: null, breakEnd: null, chairs: 1 },
    { dayOfWeek: 6, label: 'Sábado',   working: false, startTime: null, endTime: null, giveBreak: false, breakStart: null, breakEnd: null, chairs: 1 },
    { dayOfWeek: 7, label: 'Domingo',  working: false, startTime: null, endTime: null, giveBreak: false, breakStart: null, breakEnd: null, chairs: 1 },
  ];

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // 1) Saber si es admin de clínica
      const me: any = await firstValueFrom(this.http.get('/api/me'));
      console.log('DoctorSchedulePage: /api/me =', me);
      const roles: string[] = me?.roles ?? [];
      this.isClinicAdmin = roles.includes('ROLE_CLINIC_ADMIN');

      // 2) Cargar horarios actuales
      const url = `${environment.apiBase}/api/doctor/me/schedule`;
      const weekly: DoctorWeeklyScheduleDto = await firstValueFrom(
        this.http.get<DoctorWeeklyScheduleDto>(url)
      );

      if (weekly?.days && weekly.days.length) {
        for (const d of this.days) {
          const serverDay = weekly.days.find(x => x.dayOfWeek === d.dayOfWeek);
          if (!serverDay) continue;

          d.working = serverDay.working;
          d.startTime = serverDay.startTime;
          d.endTime = serverDay.endTime;
          d.giveBreak = serverDay.giveBreak;
          d.breakStart = serverDay.breakStart;
          d.breakEnd = serverDay.breakEnd;
          d.chairs = serverDay.chairs ?? 1;
        }
      }
    } catch (err: any) {
      console.error('DoctorSchedulePage: error cargando horarios', err);
      this.errorMessage =
        err?.error?.message ||
        'No se pudieron cargar tus horarios. Intenta nuevamente más tarde.';
    } finally {
      this.loading = false;
    }
  }

  onWorkingChange(d: DoctorDayScheduleVm) {
    if (!d.working) {
      d.startTime = null;
      d.endTime = null;
      d.giveBreak = false;
      d.breakStart = null;
      d.breakEnd = null;
      d.chairs = 1;
    }
  }

  async save() {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const payload: DoctorWeeklyScheduleDto = {
        days: this.days.map(d => ({
          dayOfWeek: d.dayOfWeek,
          working: d.working,
          startTime: d.working ? d.startTime : null,
          endTime: d.working ? d.endTime : null,
          giveBreak: d.working ? d.giveBreak : false,
          breakStart: d.working && d.giveBreak ? d.breakStart : null,
          breakEnd: d.working && d.giveBreak ? d.breakEnd : null,
          chairs: d.working ? (d.chairs || 1) : 0,
        })),
      };

      const url = `${environment.apiBase}/api/doctor/me/schedule`;
      await firstValueFrom(this.http.put(url, payload));

      this.successMessage = 'Horarios guardados correctamente.';

      // ⬇️ Aquí hacemos la redirección según rol
      setTimeout(() => {
        const destino = this.isClinicAdmin
          ? '/mi-clinica/dashboard'   // dueño de la clínica: ver lista de doctores/personal
          : '/dashboard';             // dentista normal: su panel
        this.router.navigateByUrl(destino);
      }, 900);

    } catch (err: any) {
      console.error('DoctorSchedulePage: error guardando horarios', err);
      this.errorMessage =
        err?.error?.message ||
        'No se pudieron guardar los horarios. Revisa los datos e intenta nuevamente.';
    } finally {
      this.saving = false;
    }
  }

  volverDespuesDeConfigurar() {
    const destino = this.isClinicAdmin ? '/mi-clinica/dashboard' : '/dashboard';
    this.router.navigateByUrl(destino);
  }
}
