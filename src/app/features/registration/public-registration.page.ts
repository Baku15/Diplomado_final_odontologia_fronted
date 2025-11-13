// src/app/features/registration/public-registration.page.ts
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { RegistrationDataAccess } from './registration.data-access';
import { RegistrationRequestCreateDto } from '../../core/models/registration';

@Component({
  standalone: true,
  selector: 'app-public-registration',
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <main class="min-h-screen bg-slate-50 flex items-center justify-center py-10 px-4">
      <div class="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <!-- Título -->
        <header class="mb-6">
          <h1 class="text-2xl font-semibold text-slate-900">
            Registro de usuario
          </h1>
          <p class="mt-1 text-sm text-slate-600">
            Completa tus datos para que revisemos tu solicitud de acceso a la plataforma.
          </p>
        </header>

        <!-- Mensaje de éxito -->
        <div
          *ngIf="successMessage"
          class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm flex gap-2"
        >
          <span class="font-medium">Solicitud enviada.</span>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Mensaje de error -->
        <div
          *ngIf="errorMessage"
          class="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm"
        >
          {{ errorMessage }}
        </div>

        <!-- Formulario -->
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-6">
          <div class="grid gap-4 md:grid-cols-2">
            <!-- Nombre -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Nombre(s)
              </label>
              <input
                type="text"
                formControlName="nombre"
                class="block w-full rounded-lg border px-3 py-2 text-sm
                       border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                       disabled:bg-slate-100"
                placeholder="Juan"
              />
              <p
                *ngIf="submitted && form.controls['nombre'].invalid"
                class="mt-1 text-xs text-red-600"
              >
                El nombre es obligatorio.
              </p>
            </div>

            <!-- Apellido -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Apellido(s)
              </label>
              <input
                type="text"
                formControlName="apellido"
                class="block w-full rounded-lg border px-3 py-2 text-sm
                       border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                       disabled:bg-slate-100"
                placeholder="Pérez"
              />
              <p
                *ngIf="submitted && form.controls['apellido'].invalid"
                class="mt-1 text-xs text-red-600"
              >
                El apellido es obligatorio.
              </p>
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              formControlName="email"
              class="block w-full rounded-lg border px-3 py-2 text-sm
                     border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                     disabled:bg-slate-100"
              placeholder="nombre@ejemplo.com"
            />
            <p
              *ngIf="submitted && form.controls['email'].invalid"
              class="mt-1 text-xs text-red-600"
            >
              Ingresa un correo válido.
            </p>
          </div>

          <!-- Ocupación -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Ocupación
            </label>
            <input
              type="text"
              formControlName="ocupacion"
              class="block w-full rounded-lg border px-3 py-2 text-sm
                     border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                     disabled:bg-slate-100"
              placeholder="Odontólogo general, Ortodoncista, Asistente, etc."
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <!-- Zona -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Zona / Barrio
              </label>
              <input
                type="text"
                formControlName="zona"
                class="block w-full rounded-lg border px-3 py-2 text-sm
                       border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                       disabled:bg-slate-100"
                placeholder="Ej. Sopocachi, Miraflores…"
              />
            </div>

            <!-- Dirección -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                formControlName="direccion"
                class="block w-full rounded-lg border px-3 py-2 text-sm
                       border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                       disabled:bg-slate-100"
                placeholder="Calle, número, referencia"
              />
            </div>
          </div>

          <!-- Términos -->
          <div class="flex items-start gap-2">
            <input
              type="checkbox"
              formControlName="aceptaTerminos"
              class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <p class="text-xs text-slate-600">
              Confirmo que la información proporcionada es correcta y autorizo el uso de mis datos
              para fines de gestión clínica conforme a la política de privacidad.
            </p>
          </div>
          <p
            *ngIf="submitted && form.controls['aceptaTerminos'].invalid"
            class="mt-1 text-xs text-red-600"
          >
            Debes aceptar los términos para enviar la solicitud.
          </p>

          <!-- Botón -->
          <div class="pt-2 flex justify-end">
            <button
              type="submit"
              class="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                     disabled:bg-indigo-300 disabled:cursor-not-allowed"
              [disabled]="form.invalid || isSubmitting"
            >
              <span *ngIf="!isSubmitting">Enviar solicitud</span>
              <span *ngIf="isSubmitting">Enviando…</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  `
})
export class PublicRegistrationPage {
  private fb = inject(FormBuilder);
  private api = inject(RegistrationDataAccess);

  isSubmitting = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  // usamos un form "ampliado": DTO + aceptaTerminos
  form = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    ocupacion: [''],
    zona: [''],
    direccion: [''],
    aceptaTerminos: [false, [Validators.requiredTrue]],
  });

  async submit() {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      return;
    }

    this.isSubmitting = true;
    try {
      const raw = this.form.getRawValue();
      // sacamos aceptaTerminos antes de llamar al backend
      const { aceptaTerminos, ...dto } = raw;
      const payload = dto as RegistrationRequestCreateDto;

      await firstValueFrom(this.api.create(payload));

      this.successMessage =
        'Tu solicitud fue enviada correctamente. Te enviaremos un correo cuando sea revisada por el administrador.';
      this.form.reset({
        nombre: '',
        apellido: '',
        email: '',
        ocupacion: '',
        zona: '',
        direccion: '',
        aceptaTerminos: false,
      });
      this.submitted = false;
    } catch (err: any) {
      console.error('Registro error:', err);
      const backendMsg = err?.error?.message;
      this.errorMessage =
        backendMsg || 'No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
