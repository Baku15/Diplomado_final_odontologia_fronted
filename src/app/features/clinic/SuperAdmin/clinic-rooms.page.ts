// src/app/features/clinic/clinic-rooms.page.ts

import {
  Component,
  OnInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser,
  NgIf,
  NgForOf,
} from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

@Component({
  standalone: true,
  selector: 'app-clinic-rooms-page',
  imports: [CommonModule, NgIf, NgForOf, ReactiveFormsModule],
  template: `
    <!-- El navbar principal lo pone ClinicShellLayout (layout de mi-clinica) -->

    <main class="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">

      <!-- Encabezado -->
      <header
        class="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5
               flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">
            Configuración de consultorios
          </p>
          <h1 class="text-2xl font-bold text-slate-900">
            Consultorios de la clínica
          </h1>
          <p class="text-sm text-slate-600 mt-1 max-w-xl">
            Define los consultorios donde atenderán los odontólogos de tu clínica.
            Estos consultorios aparecerán en el wizard de perfil profesional.
          </p>
          <p *ngIf="clinicId" class="text-xs text-slate-500 mt-1">
            Clínica asociada:
            <span class="font-semibold">#{{ clinicId }}</span>
          </p>

          <!-- Aviso si venimos desde el wizard de completar perfil -->
          <div
            *ngIf="cameFromWizard"
            class="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-900"
          >
            <strong class="font-semibold">Paso previo al perfil profesional:</strong>
            <span class="ml-1">
              Estás creando tu primer consultorio para poder completar tu perfil
              de odontólogo. Al guardar, volverás al formulario de perfil.
            </span>
          </div>
        </div>
      </header>

      <!-- Mensaje si no hay clínica -->
      <section *ngIf="!clinicId" class="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm">
        No se encontró una clínica asociada a tu usuario. Verifica la configuración
        de tu cuenta o contacta al administrador del sistema.
      </section>

      <section *ngIf="clinicId" class="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">

        <!-- Columna izquierda: listado de consultorios -->
        <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-slate-900">
              Consultorios configurados
            </h2>
            <span class="text-[11px] text-slate-500">
              Total: {{ rooms.length }}
            </span>
          </div>

          <div *ngIf="isLoadingRooms" class="text-xs text-slate-500">
            Cargando consultorios...
          </div>

          <div *ngIf="!isLoadingRooms && rooms.length === 0" class="text-xs text-slate-500">
            Aún no has configurado consultorios. Crea al menos uno usando el formulario de la derecha.
          </div>

          <ul *ngIf="rooms.length > 0" class="divide-y divide-slate-100">
            <li
              *ngFor="let r of rooms"
              class="py-3 flex items-start justify-between gap-3"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-slate-900">
                    {{ r.name }}
                  </span>
                  <span
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-mono"
                    [ngClass]="r.active !== false
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'"
                  >
                    {{ r.code || '—' }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 mt-0.5" *ngIf="r.description">
                  {{ r.description }}
                </p>
                <p class="text-[11px] mt-0.5"
                   [ngClass]="r.active !== false
                     ? 'text-emerald-700'
                     : 'text-slate-400'">
                  {{ r.active !== false ? 'Activo para asignación de doctores' : 'Inactivo' }}
                </p>
              </div>

              <!-- Futuro: botones de editar/activar/desactivar -->
              <div class="flex flex-col items-end gap-1 text-[11px]">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded border border-slate-200 text-slate-500 cursor-not-allowed"
                  title="Funcionalidad de edición pendiente"
                >
                  Editar
                </button>
              </div>
            </li>
          </ul>
        </article>

        <!-- Columna derecha: formulario de creación rápida -->
        <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h2 class="text-sm font-semibold text-slate-900 mb-2">
            Nuevo consultorio
          </h2>
          <p class="text-xs text-slate-600 mb-3">
            Crea consultorios con un nombre y un código corto. Luego podrás
            asociarlos a los doctores desde el wizard de perfil.
          </p>

          <form [formGroup]="form" (ngSubmit)="createRoom()" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Nombre del consultorio <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="name"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. Consultorio 1, Box A"
              />
              <p
                *ngIf="submitted && form.controls['name'].invalid"
                class="mt-1 text-[11px] text-red-600"
              >
                El nombre es obligatorio.
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Código <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                formControlName="code"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. C1, BOX-A"
              />
              <p
                *ngIf="submitted && form.controls['code'].invalid"
                class="mt-1 text-[11px] text-red-600"
              >
                El código es obligatorio.
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                rows="2"
                formControlName="description"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. Box de atención en planta baja, sillón 2"
              ></textarea>
            </div>

            <!-- Checkbox de activo -->
            <div class="flex items-center gap-2 text-xs text-slate-700">
              <input
                id="active"
                type="checkbox"
                formControlName="active"
                class="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
              />
              <label for="active">Activo</label>
            </div>

            <div *ngIf="error" class="text-[11px] text-red-600">
              {{ error }}
            </div>
            <div *ngIf="success" class="text-[11px] text-emerald-700">
              {{ success }}
            </div>

            <div class="pt-1 flex justify-end">
              <button
                type="submit"
                [disabled]="isSaving"
                class="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold
                       text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                       disabled:cursor-not-allowed"
              >
                <span *ngIf="!isSaving">Crear consultorio</span>
                <span *ngIf="isSaving">Creando…</span>
              </button>
            </div>
          </form>
        </article>

      </section>
    </main>
  `,
})
export class ClinicRoomsPage implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  private readonly wizardFlagKey = 'from_doctor_wizard_needs_room';

  clinicId: number | null = null;
  rooms: ClinicRoomDto[] = [];

  isLoadingRooms = false;
  isSaving = false;
  submitted = false;

  cameFromWizard = false;

  error: string | null = null;
  success: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    description: [''],
    active: [true],
  });

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // ¿Venimos desde el wizard de completar perfil?
    try {
      this.cameFromWizard =
        sessionStorage.getItem(this.wizardFlagKey) === '1';
    } catch {
      this.cameFromWizard = false;
    }

    try {
      const me: MeResponse = await firstValueFrom(
        this.http.get<MeResponse>(`${environment.apiBase}/api/me`)
      );
      this.clinicId = me.clinicId ?? null;
      if (!this.clinicId) {
        return;
      }

      await this.loadRooms();
    } catch (err) {
      console.error('ClinicRoomsPage: error obteniendo /api/me', err);
    }
  }

  private async loadRooms(): Promise<void> {
    if (!this.clinicId) return;

    this.isLoadingRooms = true;
    try {
      const resp: any = await firstValueFrom(
        this.http.get<ClinicRoomDto[] | ClinicRoomDto>(
          `${environment.apiBase}/api/clinic/${this.clinicId}/rooms`
        )
      );
      const arr: ClinicRoomDto[] = Array.isArray(resp) ? resp : [resp];
      this.rooms = arr.filter((r) => r);
    } catch (err) {
      console.error('ClinicRoomsPage: error cargando consultorios', err);
    } finally {
      this.isLoadingRooms = false;
    }
  }

  async createRoom(): Promise<void> {
    this.submitted = true;
    this.error = null;
    this.success = null;

    if (!this.clinicId) {
      this.error = 'No se encontró una clínica asociada al usuario.';
      return;
    }

    if (this.form.invalid) {
      this.error = 'Revisa los campos obligatorios.';
      return;
    }

    this.isSaving = true;

    try {
      const payload = {
        name: this.form.value.name!,
        code: this.form.value.code!,
        description: this.form.value.description || '',
        active: this.form.value.active !== false,
      };

      const created = await firstValueFrom(
        this.http.post<ClinicRoomDto>(
          `${environment.apiBase}/api/clinic/${this.clinicId}/rooms`,
          payload
        )
      );

      this.rooms.push(created);
      this.form.reset({
        name: '',
        code: '',
        description: '',
        active: true,
      });
      this.submitted = false;
      this.success = 'Consultorio creado correctamente.';

      // 🔁 Si venimos del wizard de perfil, volvemos a /completar-perfil
      if (this.cameFromWizard) {
        try {
          sessionStorage.removeItem(this.wizardFlagKey);
        } catch {}
        setTimeout(() => {
          this.router.navigateByUrl('/completar-perfil');
        }, 600);
      }
    } catch (err: any) {
      console.error('ClinicRoomsPage: error creando consultorio', err);
      this.error =
        err?.error?.message ||
        'Ocurrió un error al crear el consultorio.';
    } finally {
      this.isSaving = false;
    }
  }
}
