import {Component, inject, OnInit,} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {environment} from '../../../environments/environment';
import { PLATFORM_ID,  } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface DoctorDayScheduleDto {
  dayOfWeek: number;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  giveBreak: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  chairs: number | null;
}

interface DoctorWeeklyScheduleDto {
  days: DoctorDayScheduleDto[];
}

@Component({
  standalone: true,
  selector: 'app-dentist-dashboard-page',
  imports: [CommonModule, NgIf, RouterLink],
  template: `
    <!-- El navbar / topbar viene desde el DentistShellLayout -->

    <main class="min-h-[calc(100vh-3.5rem)] bg-slate-50 py-8 px-4">
      <section class="max-w-6xl mx-auto space-y-6">

        <!-- TÍTULO -->
        <header>
          <h1 class="text-3xl font-bold text-slate-900">
            Panel del odontólogo
          </h1>
          <p class="mt-1 text-sm text-slate-600 max-w-2xl">
            Aquí verás tus citas del día, pacientes recientes y accesos rápidos.
          </p>
        </header>

        <!-- ALERTA SOBRE HORARIOS -->
        <section
          *ngIf="loaded"
          class="rounded-2xl border px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          [ngClass]="hasSchedule
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'"
        >
          <div>
            <p class="font-semibold text-sm">
              {{ hasSchedule
              ? 'Tus horarios de atención están configurados.'
              : 'Aún no has definido tus horarios de atención.' }}
            </p>
            <p class="text-[11px] mt-0.5 opacity-90" *ngIf="hasSchedule">
              Puedes revisar o ajustar tu agenda cuando lo necesites.
            </p>
            <p class="text-[11px] mt-0.5 opacity-90" *ngIf="!hasSchedule">
              Configura al menos un día y horario para que la clínica pueda agendar tus citas.
            </p>
          </div>

          <div class="flex gap-2 justify-end">
            <a
              routerLink="/dashboard/horarios"
              class="inline-flex items-center justify-center rounded-lg border
                     px-4 py-2 text-xs font-semibold shadow-sm
                     hover:bg-white/40"
              [ngClass]="hasSchedule
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                : 'border-amber-300 bg-amber-100 text-amber-900'"
            >
              Ver / editar mis horarios
            </a>
          </div>
        </section>

        <!-- TARJETAS PRINCIPALES -->
        <section class="grid gap-4 md:grid-cols-3">
          <!-- Citas de hoy -->
          <article
            class="bg-white rounded-2xl shadow border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Citas de hoy
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Próximamente verás tus citas programadas.
              </p>
            </div>
            <div class="mt-3 text-[11px] text-slate-400">
              Integración con agenda en una fase posterior.
            </div>
          </article>

          <!-- Pacientes recientes -->
          <article
            class="bg-white rounded-2xl shadow border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Pacientes recientes
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Atajos rápidos a las historias clínicas que consultaste hace poco.
              </p>
            </div>
            <div class="mt-3 text-[11px] text-slate-400">
              Este módulo se conectará con el historial clínico.
            </div>
          </article>

          <!-- Accesos rápidos -->
          <article
            class="bg-white rounded-2xl shadow border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Accesos rápidos
              </h2>
              <ul class="mt-1 text-xs text-slate-600 list-disc list-inside space-y-0.5">
                <li>Registrar nueva cita (próx.)</li>
                <li>Buscar paciente (próx.)</li>
                <li>Ver agenda semanal (próx.)</li>
              </ul>
            </div>
            <div class="mt-3 text-[11px] text-slate-400">
              Pensado como centro de comandos del odontólogo.
            </div>
          </article>
        </section>
      </section>
    </main>
  `,
})
export class DentistDashboardPage implements OnInit {

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);


  loaded = false;
  hasSchedule = false;

  async ngOnInit(): Promise<void> {

    // 🛡️ SSR-SAFE: no llamar APIs protegidas en el servidor
    if (!isPlatformBrowser(this.platformId)) {
      // Render SSR: no sabemos aún si tiene horarios
      this.loaded = false;
      return;
    }

    try {
      const weekly = await firstValueFrom(
        this.http.get<DoctorWeeklyScheduleDto>(
          `${environment.apiBase}/api/doctor/me/schedule`
        )
      );

      const days = weekly?.days ?? [];
      this.hasSchedule = days.some(d => d.working);

    } catch (err) {
      // ⚠️ Error esperado si el token aún no está listo
      console.warn('[DentistDashboard] No se pudo verificar horarios aún');
      this.hasSchedule = false;
    } finally {
      this.loaded = true;
    }
  }
}
