// src/app/features/clinic/doctor-complete-profile.page.ts

import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { DoctorProfileWizard } from './doctor-profile-wizard.component';

@Component({
  standalone: true,
  selector: 'app-doctor-complete-profile-page',
  imports: [CommonModule, NavbarComponent, DoctorProfileWizard],
  template: `
    <app-navbar></app-navbar>

    <main class="min-h-screen bg-slate-50 py-10 px-4">
      <div class="max-w-6xl mx-auto space-y-6">
        <!-- Encabezado principal -->
        <header>
          <h1 class="text-3xl font-bold text-slate-900">
            Completa tu perfil profesional
          </h1>
          <p class="mt-1 text-sm text-slate-600 max-w-3xl">
            Como odontólogo administrador de clínica debes completar estos datos
            antes de empezar a atender pacientes en la plataforma.
          </p>
        </header>

        <!-- GRID: izquierda wizard, derecha datos de acceso -->
        <section
          class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]"
        >
          <!-- Columna izquierda: tarjeta con el wizard -->
          <div>
            <div
              class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              <div class="border-b border-slate-100 px-6 py-4">
                <h2 class="text-lg font-semibold text-slate-900">
                  Completa tu perfil profesional
                </h2>
                <p class="mt-1 text-sm text-slate-500">
                  Esto ayuda a pacientes a conocerte y validar tu práctica.
                </p>
              </div>

              <div class="px-6 py-5">
                <app-doctor-profile-wizard
                  (close)="onClose()"
                ></app-doctor-profile-wizard>
              </div>
            </div>
          </div>

          <!-- Columna derecha: tarjeta con datos de acceso (solo lectura) -->
          <aside>
            <div
              class="bg-white rounded-2xl shadow-lg border border-slate-200 lg:sticky lg:top-6"
            >
              <div class="border-b border-slate-100 px-6 py-4">
                <h2 class="text-sm font-semibold text-slate-900 tracking-wide">
                  Datos de acceso
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Estos datos se configuraron al crear tu cuenta.
                </p>
              </div>

              <dl class="px-6 py-4 space-y-4 text-sm">
                <div class="flex flex-col">
                  <dt class="text-xs font-medium text-slate-500 uppercase">
                    Usuario
                  </dt>
                  <dd class="mt-1 font-mono text-slate-900">
                    {{ accessInfo.username || '—' }}
                  </dd>
                </div>

                <div class="flex flex-col">
                  <dt class="text-xs font-medium text-slate-500 uppercase">
                    Correo electrónico
                  </dt>
                  <dd class="mt-1 text-slate-900 break-all">
                    {{ accessInfo.email || '—' }}
                  </dd>
                </div>

                <div class="flex flex-col">
                  <dt class="text-xs font-medium text-slate-500 uppercase">
                    Clínica / sucursal
                  </dt>
                  <dd class="mt-1 text-slate-900">
                    {{
                      accessInfo.clinicDisplay ||
                      (accessInfo.clinicId
                        ? ('Clínica #' + accessInfo.clinicId)
                        : 'Sin clínica asignada')
                    }}
                  </dd>
                </div>

                <!-- Chips de roles (opcional, pero útil visualmente) -->
                <div
                  class="flex flex-col pt-2 border-t border-dashed border-slate-200"
                  *ngIf="accessInfo.roles.length"
                >
                  <dt class="text-xs font-medium text-slate-500 uppercase">
                    Roles en esta clínica
                  </dt>
                  <dd class="mt-1 text-xs text-slate-700 space-y-1">
                    <span
                      *ngFor="let r of accessInfo.roles"
                      class="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/70 px-2 py-0.5 text-[11px] font-medium text-indigo-700 mr-1 mb-1"
                    >
                      {{ r }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </div>
    </main>
  `,
})
export class DoctorCompleteProfilePage implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  accessInfo = {
    username: '',
    email: '',
    clinicId: null as number | null,
    clinicDisplay: '',
    roles: [] as string[],
  };

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const me: any = await firstValueFrom(this.http.get('/api/me'));
      console.log('DoctorCompleteProfile: /api/me =', me);

      this.accessInfo.username = me?.username ?? '';
      this.accessInfo.email = me?.email ?? '';
      this.accessInfo.clinicId = me?.clinicId ?? null;
      this.accessInfo.clinicDisplay =
        me?.clinicName ??
        (me?.clinicId ? `Clínica #${me.clinicId}` : 'Sin clínica asignada');
      this.accessInfo.roles = Array.isArray(me?.roles) ? me.roles : [];
    } catch (err) {
      console.error('DoctorCompleteProfile: error obteniendo /api/me', err);
    }
  }

  onClose() {
    // cuando el wizard emite close → lo mando al panel de su clínica
    this.router.navigateByUrl('/mi-clinica/horarios');
  }
}
