// src/app/features/clinic/doctor-profile-wizard.component.ts

import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

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
    <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <header class="mb-4">
        <h2 class="text-lg font-semibold text-slate-900">
          Completa tu perfil profesional
        </h2>
        <p class="text-xs text-slate-500 mt-1">
          Estos datos ayudan a pacientes y asistentes a organizar tu agenda.
        </p>
      </header>

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">

        <!-- Fila 1: Matrícula + Especialidad -->
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

        <!-- Fila 2: Consultorio principal O mensaje de "no hay consultorios" -->
        <ng-container *ngIf="rooms.length > 0; else noRoomsTpl">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">
              Consultorio principal donde atenderás
              <span class="text-red-500">*</span>
            </label>

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

            <p *ngIf="selectedRoom" class="mt-1 text-[11px] text-slate-500">
              Consultorio seleccionado:
              {{ selectedRoom.name }} ({{ selectedRoom.code }})
            </p>
          </div>
        </ng-container>

        <!-- Cuando NO hay consultorios -->
        <ng-template #noRoomsTpl>
          <!-- Caso 1: admin + dentista → puede configurar consultorios -->
          <div
            *ngIf="isClinicAdmin; else noRoomsDentistTpl"
            class="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-[11px] text-amber-900"
          >
            <p class="font-semibold mb-1">
              Aún no tienes consultorios configurados en tu clínica.
            </p>
            <p class="mb-2">
              Antes de completar tu perfil profesional, necesitas crear al menos
              un consultorio donde atenderás pacientes.
            </p>
            <button
              type="button"
              (click)="goToCreateRoom()"
              class="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white/70
                     px-3 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
            >
              Configurar consultorio ahora
            </button>
          </div>

          <!-- Caso 2: solo dentista → debe pedir al admin -->
          <ng-template #noRoomsDentistTpl>
            <div
              class="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-[11px] text-amber-900"
            >
              <p class="font-semibold mb-1">
                Tu clínica aún no tiene consultorios configurados.
              </p>
              <p class="mb-1">
                Para completar tu perfil profesional, el administrador de la clínica
                debe crear al menos un consultorio y asignarte uno como lugar de atención.
              </p>
              <p>
                Comunícate con administración para que lo configuren y luego vuelve a esta pantalla.
              </p>
            </div>
          </ng-template>
        </ng-template>

        <!-- Fila 3: Teléfono + Dirección -->
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

        <!-- Fila 4: Bio -->
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

        <!-- Mensajes -->
        <div *ngIf="error" class="text-[11px] text-red-600">
          {{ error }}
        </div>
        <div *ngIf="success" class="text-[11px] text-emerald-700">
          {{ success }}
        </div>

        <!-- Acciones -->
        <div class="pt-2 flex justify-between items-center">
          <button
            type="button"
            (click)="closeWizard()"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700
                   hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            [disabled]="isLoading || rooms.length === 0"
            class="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold
                   text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                   disabled:cursor-not-allowed"
          >
            <span *ngIf="!isLoading">Guardar y continuar</span>
            <span *ngIf="isLoading">Guardando…</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class DoctorProfileWizard implements OnInit {
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly wizardFlagKey = 'from_doctor_wizard_needs_room';

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

  // 👇 Nuevos flags de rol
  isClinicAdmin = false;
  isDentist = false;

  form = this.fb.group({
    licenseNumber: ['', Validators.required],
    specialty: [''],
    primaryRoomId: [null as number | null, Validators.required],
    phone: [''],
    address: [''],
    bio: [''],
  });

  get selectedRoom(): ClinicRoomDto | null {
    const id = this.form.value.primaryRoomId;
    if (!id) return null;
    return this.rooms.find((r) => r.id === id) ?? null;
  }

  async ngOnInit(): Promise<void> {
    try {
      const me: any = await firstValueFrom(
        this.http.get(`${environment.apiBase}/api/me`)
      );
      console.log('DoctorProfileWizard: /api/me =', me);

      // Roles desde /api/me
      const roles: string[] = Array.isArray(me?.roles) ? me.roles : [];
      this.isClinicAdmin = roles.includes('ROLE_CLINIC_ADMIN');
      this.isDentist = roles.includes('ROLE_DENTIST');

      const clinicId: number | undefined = me?.clinicId;

      if (!clinicId) {
        console.warn('DoctorProfileWizard: usuario sin clinicId');
        return;
      }

      const resp: any = await firstValueFrom(
        this.http.get<ClinicRoomDto[] | ClinicRoomDto>(
          `${environment.apiBase}/api/clinic/${clinicId}/rooms`
        )
      );

      console.log('DoctorProfileWizard: raw rooms resp =', resp);

      const roomsArray: ClinicRoomDto[] = Array.isArray(resp) ? resp : [resp];

      this.rooms = roomsArray.filter((r) => r && r.active !== false);
      console.log('DoctorProfileWizard: rooms filtrados =', this.rooms);

      if (this.rooms.length > 0) {
        this.form.patchValue({ primaryRoomId: this.rooms[0].id });
      }
    } catch (err) {
      console.warn('DoctorProfileWizard: error cargando consultorios', err);
    }
  }

  goToCreateRoom() {
    try {
      sessionStorage.setItem(this.wizardFlagKey, '1');
    } catch {}
    this.router.navigateByUrl('/mi-clinica/consultorios');
  }

  closeWizard() {
    this.close.emit();
  }

  async save() {
    this.submitted = true;
    this.error = null;
    this.success = null;

    if (this.form.invalid || this.rooms.length === 0) {
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
        primaryRoomId: value.primaryRoomId!,
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
