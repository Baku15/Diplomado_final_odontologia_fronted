// src/app/features/clinic/clinic-doctors.page.ts

import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import {
  CommonModule,
  NgIf,
  NgForOf,
  isPlatformBrowser,
} from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ClinicStaffApi,
  Page,
  StaffView,
  InviteDoctorRequest,
} from './clinic-staff.api';

interface MeResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  clinicId: number | null;
}

@Component({
  standalone: true,
  selector: 'app-clinic-doctors-page',
  imports: [CommonModule, NgIf, NgForOf, ReactiveFormsModule, RouterLink],
  template: `
    <main class="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">

      <!-- ENCABEZADO -->
      <header
        class="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5
               flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">
            Gestión de equipo
          </p>
          <h1 class="text-2xl font-bold text-slate-900">
            Doctores de la clínica
          </h1>
          <p class="text-sm text-slate-600 mt-1 max-w-2xl">
            Visualiza el personal registrado e invita nuevos odontólogos
            para que completen su registro en OdontoWeb.
          </p>
          <p *ngIf="clinicId" class="text-xs text-slate-500 mt-1">
            Clínica asociada:
            <span class="font-semibold">#{{ clinicId }}</span>
          </p>
        </div>

        <div class="flex flex-col items-start md:items-end gap-2">
          <a
            routerLink="/mi-clinica"
            class="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5
                   text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Volver al panel
          </a>

          <span
            class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1
                   text-[11px] font-medium text-indigo-700"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            Módulo de equipo en beta
          </span>
        </div>
      </header>

      <!-- ALERTA SIN CLÍNICA -->
      <section
        *ngIf="!clinicId"
        class="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm"
      >
        No se encontró una clínica asociada a tu usuario. Verifica la configuración
        de tu cuenta o contacta al administrador del sistema.
      </section>

      <section
        *ngIf="clinicId"
        class="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]"
      >

        <!-- LISTADO STAFF -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[260px]"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Equipo registrado
              </h2>
              <p class="text-xs text-slate-600">
                Doctores y asistentes que ya tienen acceso al sistema.
              </p>
            </div>
            <span class="text-[11px] text-slate-500">
              Total: {{ staffPage?.totalElements ?? 0 }}
            </span>
          </div>

          <div *ngIf="loadingStaff" class="text-xs text-slate-500">
            Cargando equipo...
          </div>

          <div *ngIf="!loadingStaff && staffError" class="text-xs text-red-600">
            {{ staffError }}
          </div>

          <!-- tabla -->
          <div
            *ngIf="!loadingStaff && staffPage && staffPage.content.length > 0"
            class="mt-2 -mx-2 overflow-x-auto"
          >
            <table class="min-w-full text-xs">
              <thead>
              <tr class="border-b border-slate-200 bg-slate-50">
                <th class="px-3 py-2 text-left font-semibold text-slate-600">
                  Nombre
                </th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">
                  Email
                </th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">
                  Rol(es)
                </th>
                <th class="px-3 py-2 text-left font-semibold text-slate-600">
                  Estado
                </th>
              </tr>
              </thead>
              <tbody>
              <tr
                *ngFor="let s of staffPage!.content"
                class="border-b last:border-b-0 border-slate-100"
              >
                <td class="px-3 py-2">
                  <div class="font-medium text-slate-900">
                    {{
                      (s.nombre || s.apellido)
                        ? (s.nombre || '') + ' ' + (s.apellido || '')
                        : s.username
                    }}
                  </div>
                  <div class="text-[11px] text-slate-500">
                    {{ s.username }}
                  </div>
                </td>
                <td class="px-3 py-2">
                  <span class="text-xs text-slate-700">{{ s.email }}</span>
                </td>
                <td class="px-3 py-2">
                  <div class="flex flex-wrap gap-1">
                      <span
                        *ngFor="let r of s.roles"
                        class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        {{ r.replace('ROLE_', '') }}
                      </span>
                  </div>
                </td>
                <td class="px-3 py-2">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-700 border border-emerald-200':
                          s.status === 'ACTIVE',
                        'bg-amber-50 text-amber-700 border border-amber-200':
                          s.status === 'PENDING',
                        'bg-slate-50 text-slate-500 border border-slate-200':
                          !s.status || s.status === 'BLOCKED'
                      }"
                    >
                      {{ s.status || 'SIN ESTADO' }}
                    </span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <div
            *ngIf="
              !loadingStaff &&
              staffPage &&
              staffPage.content.length === 0
            "
            class="mt-3 text-xs text-slate-500"
          >
            Aún no tienes personal registrado. Puedes comenzar enviando
            invitaciones desde el formulario de la derecha.
          </div>
        </article>

        <!-- FORM INVITAR DOCTOR -->
        <article
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">
                Invitar nuevo doctor
              </h2>
              <p class="text-xs text-slate-600">
                Envía una invitación por correo para que el doctor cree su cuenta.
              </p>
            </div>
            <span class="text-[10px] text-slate-400">
              Paso 1 de 2 · Invitación
            </span>
          </div>

          <!-- alertas -->
          <div
            *ngIf="inviteError"
            class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
          >
            {{ inviteError }}
          </div>
          <div
            *ngIf="inviteSuccess"
            class="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700"
          >
            {{ inviteSuccess }}
          </div>

          <form
            [formGroup]="inviteForm"
            (ngSubmit)="onInviteDoctor()"
            class="space-y-3"
          >
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Nombre completo del doctor
                <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="fullName"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. Dra. Ana Pérez"
              />
              <p
                *ngIf="submitted && inviteForm.controls['fullName'].invalid"
                class="mt-1 text-[11px] text-red-600"
              >
                El nombre es obligatorio.
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Correo electrónico
                <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                formControlName="email"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="doctor@ejemplo.com"
              />
              <p
                *ngIf="submitted && inviteForm.controls['email'].invalid"
                class="mt-1 text-[11px] text-red-600"
              >
                Ingresa un correo válido.
              </p>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="text"
                  formControlName="phone"
                  class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej. 76543210"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  Especialidad (opcional)
                </label>
                <input
                  type="text"
                  formControlName="specialty"
                  class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej. Ortodoncia"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Notas internas (opcional)
              </label>
              <textarea
                rows="2"
                formControlName="notes"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Comentarios sobre el rol que tendrá este doctor en tu clínica..."
              ></textarea>
            </div>

            <div class="pt-2 flex items-center justify-between gap-3">
              <p class="text-[11px] text-slate-500 max-w-xs">
                El doctor recibirá un correo con un enlace para crear su cuenta
                y completar su perfil profesional.
              </p>

              <button
                type="submit"
                [disabled]="inviteLoading || !clinicId"
                class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2
                       text-xs font-semibold text-white shadow-sm
                       hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                <span *ngIf="!inviteLoading">Enviar invitación</span>
                <span *ngIf="inviteLoading">Enviando…</span>
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  `,
})
export class ClinicDoctorsPage implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private staffApi = inject(ClinicStaffApi);
  private platformId = inject(PLATFORM_ID);

  clinicId: number | null = null;

  staffPage: Page<StaffView> | null = null;
  loadingStaff = false;
  staffError: string | null = null;

  inviteForm = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    specialty: [''],
    notes: [''],
  });

  submitted = false;
  inviteLoading = false;
  inviteError: string | null = null;
  inviteSuccess: string | null = null;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    await this.loadClinicId();
    if (this.clinicId) {
      await this.loadStaff();
    }
  }

  private async loadClinicId(): Promise<void> {
    try {
      const me: MeResponse = await firstValueFrom(
        this.http.get<MeResponse>(`${environment.apiBase}/api/me`)
      );
      this.clinicId = me.clinicId ?? null;
    } catch (err) {
      console.error('ClinicDoctorsPage: error obteniendo /api/me', err);
      this.clinicId = null;
    }
  }

  private async loadStaff(): Promise<void> {
    if (!this.clinicId) return;

    this.loadingStaff = true;
    this.staffError = null;

    try {
      this.staffPage = await firstValueFrom(
        this.staffApi.listStaff(this.clinicId, 0, 20)
      );
    } catch (err: any) {
      console.error('ClinicDoctorsPage: error cargando staff', err);
      this.staffError =
        err?.error?.message ||
        'No se pudo cargar el equipo de la clínica.';
      this.staffPage = null;
    } finally {
      this.loadingStaff = false;
    }
  }

  async onInviteDoctor(): Promise<void> {
    this.submitted = true;
    this.inviteError = null;
    this.inviteSuccess = null;

    if (!this.clinicId) {
      this.inviteError =
        'No se encontró una clínica asociada. No se puede enviar la invitación.';
      return;
    }

    if (this.inviteForm.invalid) {
      this.inviteError = 'Revisa los campos obligatorios.';
      return;
    }

    this.inviteLoading = true;

    const payload: InviteDoctorRequest = {
      fullName: this.inviteForm.value.fullName!,
      email: this.inviteForm.value.email!,
      phone: this.inviteForm.value.phone || undefined,
      specialty: this.inviteForm.value.specialty || undefined,
      notes: this.inviteForm.value.notes || undefined,
    };

    try {
      await firstValueFrom(
        this.staffApi.inviteDoctor(this.clinicId, payload)
      );

      this.inviteSuccess =
        'Invitación enviada correctamente. Cuando el doctor se registre, aparecerá en el listado.';
      this.inviteForm.reset({
        fullName: '',
        email: '',
        phone: '',
        specialty: '',
        notes: '',
      });
      this.submitted = false;

      // Opcional: recargar listado
      await this.loadStaff();
    } catch (err: any) {
      console.error('ClinicDoctorsPage: error enviando invitación', err);
      this.inviteError =
        err?.error?.message ||
        'No se pudo enviar la invitación. Intenta nuevamente.';
    } finally {
      this.inviteLoading = false;
    }
  }
}
