import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface MeResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  clinicId: number | null;
}

interface ClinicRoomDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}

interface DoctorProfileMeDto {
  licenseNumber: string;
  specialty: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
  primaryRoomId: number;
}

@Component({
  standalone: true,
  selector: 'app-doctor-profile-edit-page',
  imports: [CommonModule, NgIf, NgFor, ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-slate-50 py-8 px-4">
      <section class="max-w-5xl mx-auto space-y-6">

        <!-- encabezado -->
        <header>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900">
            Mi perfil profesional
          </h1>
          <p class="mt-1 text-sm text-slate-600 max-w-3xl">
            Actualiza tus datos profesionales y de contacto. Algunos datos de
            acceso (usuario, correo, clínica) se gestionan desde la administración.
          </p>
        </header>

        <!-- mensajes -->
        <div
          *ngIf="errorMessage"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {{ errorMessage }}
        </div>

        <div
          *ngIf="successMessage"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
        >
          {{ successMessage }}
        </div>

        <!-- tarjeta principal -->
        <div
          class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
        >
          <div class="border-b border-slate-100 px-6 py-4">
            <h2 class="text-lg font-semibold text-slate-900">
              Datos profesionales
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Estos datos se mostrarán en tu agenda y en la vista de pacientes.
            </p>
          </div>

          <div class="px-6 py-5" *ngIf="!loading; else loadingTpl">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">

              <!-- matrícula + especialidad -->
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">
                    Matrícula profesional <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="licenseNumber"
                    class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej. RND-12345"
                  />
                  <p
                    *ngIf="submitted && form.controls['licenseNumber'].invalid"
                    class="mt-1 text-[11px] text-red-600"
                  >
                    La matrícula es obligatoria.
                  </p>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">
                    Especialidad principal
                  </label>
                  <select
                    formControlName="specialty"
                    class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccione una especialidad…</option>
                    <option *ngFor="let sp of specialties" [value]="sp">
                      {{ sp }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- consultorio principal -->
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  Consultorio principal donde atiendes
                  <span class="text-red-500">*</span>
                </label>

                <ng-container *ngIf="rooms.length > 0; else noRoomsTpl">
                  <select
                    formControlName="primaryRoomId"
                    class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option [ngValue]="null">Seleccione un consultorio…</option>
                    <option *ngFor="let r of rooms" [ngValue]="r.id">
                      {{ r.name }} ({{ r.code }})
                    </option>
                  </select>

                  <p
                    *ngIf="submitted && form.controls['primaryRoomId'].invalid"
                    class="mt-1 text-[11px] text-red-600"
                  >
                    Debes seleccionar un consultorio principal.
                  </p>
                </ng-container>

                <!-- Template cuando NO hay consultorios -->
                <ng-template #noRoomsTpl>
                  <div
                    class="mt-1 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3
                           text-[11px] text-amber-900"
                  >
                    <p class="font-semibold mb-1">
                      Aún no tienes consultorios configurados en tu clínica.
                    </p>
                    <p class="mb-2">
                      Pide al administrador de la clínica que cree al menos un consultorio
                      antes de configurar tu perfil profesional.
                    </p>
                  </div>
                </ng-template>
              </div>

              <!-- teléfono + dirección -->
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">
                    Teléfono de contacto
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
                    Dirección de atención
                  </label>
                  <input
                    type="text"
                    formControlName="address"
                    class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Calle, número, referencia"
                  />
                </div>
              </div>

              <!-- bio -->
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  Breve descripción / bio
                </label>
                <textarea
                  rows="3"
                  formControlName="bio"
                  class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej. Odontólogo con 8 años de experiencia en odontología general y estética…"
                ></textarea>
              </div>

              <!-- acciones -->
              <div class="pt-2 flex items-center justify-between gap-3">
                <p class="text-[11px] text-slate-500">
                  Los cambios se aplican solo a futuro; las citas pasadas no se modifican.
                </p>

                <button
                  type="submit"
                  [disabled]="saving"
                  class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2
                         text-xs font-semibold text-white shadow hover:bg-indigo-700
                         disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  <span *ngIf="!saving">Guardar cambios</span>
                  <span *ngIf="saving">Guardando…</span>
                </button>
              </div>
            </form>
          </div>

          <!-- skeleton -->
          <ng-template #loadingTpl>
            <div class="px-6 py-5 space-y-3">
              <div class="h-4 w-40 bg-slate-100 rounded animate-pulse"></div>
              <div class="h-4 w-64 bg-slate-100 rounded animate-pulse"></div>
              <div class="h-10 w-full bg-slate-100 rounded animate-pulse"></div>
            </div>
          </ng-template>
        </div>

      </section>
    </main>
  `,
})
export class DoctorProfileEditPage implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading = true;
  saving = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  rooms: ClinicRoomDto[] = [];

  specialties: string[] = [
    'Odontología general',
    'Odontopediatría',
    'Ortodoncia',
    'Endodoncia',
    'Periodoncia',
    'Rehabilitación oral / Prótesis',
    'Cirugía oral y maxilofacial',
    'Implantología',
    'Estética dental',
    'Odontología geriátrica',
  ];

  form = this.fb.group({
    licenseNumber: ['', [Validators.required, Validators.minLength(3)]],
    specialty: [''],
    phone: [''],
    address: [''],
    bio: [''],
    primaryRoomId: [null as number | null, Validators.required],
  });

  async ngOnInit(): Promise<void> {
    try {
      // 1) /api/me para saber clínica
      const me = await firstValueFrom(
        this.http.get<MeResponse>('/api/me')
      );

      if (!me.clinicId) {
        this.errorMessage = 'Tu usuario no tiene una clínica asignada.';
        this.loading = false;
        return;
      }

      // 2) consultorios activos
      const roomsResp = await firstValueFrom(
        this.http.get<ClinicRoomDto[]>(
          `${environment.apiBase}/api/clinic/${me.clinicId}/rooms`
        )
      );
      this.rooms = (roomsResp || []).filter(r => r && r.active !== false);

      // 3) perfil actual
      const profile = await firstValueFrom(
        this.http.get<DoctorProfileMeDto>(
          `${environment.apiBase}/api/users/me/doctor-profile`
        )
      );

      this.form.patchValue({
        licenseNumber: profile.licenseNumber,
        specialty: profile.specialty || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        primaryRoomId: profile.primaryRoomId,
      });

      this.loading = false;
    } catch (err: any) {
      console.error('DoctorProfileEditPage: error cargando datos', err);
      this.errorMessage =
        err?.error?.message ||
        'No se pudo cargar tu perfil profesional. Intenta más tarde.';
      this.loading = false;
    }
  }

  async save() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.errorMessage = 'Revisa los campos obligatorios del formulario.';
      return;
    }

    this.saving = true;

    try {
      const value = this.form.value;
      const payload: DoctorProfileMeDto = {
        licenseNumber: value.licenseNumber!,
        specialty: value.specialty || '',
        phone: value.phone || '',
        address: value.address || '',
        bio: value.bio || '',
        primaryRoomId: value.primaryRoomId!,
      };

      await firstValueFrom(
        this.http.put(
          `${environment.apiBase}/api/users/me/doctor-profile`,
          payload
        )
      );

      this.successMessage = 'Perfil actualizado correctamente.';
      setTimeout(() => {
        this.router.navigateByUrl('/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('DoctorProfileEditPage: error guardando perfil', err);
      this.errorMessage =
        err?.error?.message ||
        'No se pudo actualizar tu perfil. Intenta nuevamente.';
    } finally {
      this.saving = false;
    }
  }
}
