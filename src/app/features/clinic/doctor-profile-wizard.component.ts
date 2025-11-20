// src/app/features/clinic/doctor-profile-wizard.component.ts

import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ClinicRoomDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}

@Component({
  selector: 'app-doctor-profile-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="mt-6 space-y-4">
      <header>
        <h2 class="text-lg font-semibold text-slate-900">
          Completa tu perfil profesional
        </h2>
        <p class="text-sm text-slate-600">
          Esto ayuda a pacientes a conocerte y validar tu práctica.
        </p>
      </header>

      <form
        [formGroup]="form"
        (ngSubmit)="save()"
        class="space-y-6"
        novalidate
      >
        <!-- BLOQUE PRINCIPAL: todo en una pantalla -->
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Matrícula -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Matrícula (requerida)
            </label>
            <input
              type="text"
              formControlName="licenseNumber"
              class="w-full rounded-lg border px-3 py-2 text-sm
                     border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Nº de matrícula profesional"
            />
            <p
              *ngIf="submitted && form.controls['licenseNumber'].invalid"
              class="mt-1 text-xs text-red-600"
            >
              La matrícula es obligatoria.
            </p>
          </div>

          <!-- Especialidad -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Especialidad
            </label>
            <select
              formControlName="specialty"
              class="w-full rounded-lg border px-3 py-2 text-sm
                     border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="">Selecciona una opción…</option>
              <option *ngFor="let s of specialties" [value]="s">
                {{ s }}
              </option>
            </select>
          </div>

          <!-- Consultorio -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Consultorio principal donde atenderás
            </label>

            <ng-container *ngIf="rooms.length > 0; else noRooms">
              <select
                formControlName="mainRoomId"
                class="w-full rounded-lg border px-3 py-2 text-sm
                       border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option
                  *ngFor="let r of rooms"
                  [ngValue]="r.id"
                >
                  {{ r.name }} ({{ r.code }})
                </option>
              </select>
            </ng-container>

            <ng-template #noRooms>
              <div class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Aún no hay consultorios configurados para tu clínica.
                Pídele al administrador que cree al menos uno.
              </div>
            </ng-template>

            <p
              *ngIf="submitted && form.controls['mainRoomId'].invalid"
              class="mt-1 text-xs text-red-600"
            >
              Debes seleccionar un consultorio.
            </p>
          </div>

          <!-- Teléfono -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              formControlName="phone"
              class="w-full rounded-lg border px-3 py-2 text-sm
                     border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Teléfono de contacto clínico"
            />
          </div>

          <!-- Dirección -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              formControlName="address"
              class="w-full rounded-lg border px-3 py-2 text-sm
                     border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Calle, número, referencia"
            />
          </div>

          <!-- Bio -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Breve descripción / bio
            </label>
            <textarea
              rows="4"
              formControlName="bio"
              class="w-full rounded-lg border px-3 py-2 text-sm
                     border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: Odontólogo general con énfasis en rehabilitación oral..."
            ></textarea>
          </div>
        </div>

        <!-- MENSAJES -->
        <p *ngIf="error" class="text-xs text-red-600">
          {{ error }}
        </p>
        <p *ngIf="success" class="text-xs text-emerald-700">
          {{ success }}
        </p>

        <!-- BOTONES -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            (click)="closeWizard()"
            class="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            [disabled]="isLoading || rooms.length === 0"
            class="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white
                   hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
          >
            <span *ngIf="!isLoading">Continuar</span>
            <span *ngIf="isLoading">Guardando…</span>
          </button>
        </div>
      </form>
    </section>
  `,
})
export class DoctorProfileWizard implements OnInit {
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // catálogo de especialidades odontológicas
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

  rooms: ClinicRoomDto[] = [];

  submitted = false;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  form = this.fb.group({
    licenseNumber: ['', Validators.required],
    specialty: [''],
    mainRoomId: [null as number | null, Validators.required],
    phone: [''],
    address: [''],
    bio: [''],
  });

  async ngOnInit(): Promise<void> {
    // cargar consultorios de la clínica del usuario
    try {
      const me: any = await firstValueFrom(
        this.http.get(`${environment.apiBase}/api/me`)
      );
      const clinicId: number | undefined = me?.clinicId;

      if (clinicId) {
        const rooms = await firstValueFrom(
          this.http.get<ClinicRoomDto[]>(
            `${environment.apiBase}/api/clinic/${clinicId}/rooms`
          )
        );
        this.rooms = rooms.filter((r) => r.active !== false);

        // preseleccionar el primero
        if (this.rooms.length > 0) {
          this.form.patchValue({ mainRoomId: this.rooms[0].id });
        }
      }
    } catch (err) {
      console.warn('DoctorProfileWizard: error cargando consultorios', err);
    }
  }

  closeWizard() {
    this.close.emit();
  }

  async save() {
    this.submitted = true;
    this.error = null;
    this.success = null;

    if (this.form.invalid) {
      this.error = 'Revisa los campos obligatorios del formulario.';
      return;
    }

    this.isLoading = true;

    try {
      const value = this.form.value;

      const payload = {
        licenseNumber: value.licenseNumber!,
        specialty: value.specialty || '',
        phone: value.phone || '',
        address: value.address || '',
        bio: value.bio || '',
        mainRoomId: value.mainRoomId!, // id de consultorio
      };

      await firstValueFrom(
        this.http.post(
          `${environment.apiBase}/api/users/me/doctor-profile`,
          payload
        )
      );

      this.success = 'Perfil guardado correctamente.';
      setTimeout(() => this.close.emit(), 900);
    } catch (err: any) {
      console.error(err);
      this.error =
        err?.error?.message || 'Ocurrió un error al guardar tu perfil.';
    } finally {
      this.isLoading = false;
    }
  }
}
