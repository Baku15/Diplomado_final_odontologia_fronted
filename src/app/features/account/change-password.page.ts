// src/app/features/account/change-password.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  standalone: true,
  selector: 'app-change-password-page',
  imports: [CommonModule, NgIf, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="min-h-screen bg-slate-50 py-10 px-4">
      <section class="max-w-xl mx-auto space-y-6">
        <!-- Encabezado -->
        <header>
          <h1 class="text-2xl font-bold text-slate-900">
            Seguridad de la cuenta
          </h1>
          <p class="mt-1 text-sm text-slate-600">
            Cambia tu contraseña de acceso. Por seguridad, te pediremos tu
            contraseña actual.
          </p>
        </header>

        <!-- Tarjeta principal -->
        <div
          class="bg-white rounded-2xl shadow-lg border border-slate-200 px-6 py-6 space-y-4"
        >
          <!-- Mensajes -->
          <div
            *ngIf="errorMessage"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {{ errorMessage }}
          </div>

          <div
            *ngIf="successMessage"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
          >
            {{ successMessage }}
          </div>

          <!-- Formulario -->
          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="space-y-4"
          >
            <!-- Contraseña actual -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Contraseña actual <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                formControlName="currentPassword"
                autocomplete="current-password"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p
                *ngIf="submitted && form.controls['currentPassword'].invalid"
                class="mt-1 text-[11px] text-red-600"
              >
                Debes ingresar tu contraseña actual.
              </p>
            </div>

            <!-- Nueva contraseña -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Nueva contraseña <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                formControlName="newPassword"
                autocomplete="new-password"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p
                *ngIf="submitted && form.controls['newPassword'].invalid"
                class="mt-1 text-[11px] text-red-600"
              >
                La nueva contraseña debe tener al menos 8 caracteres.
              </p>
              <p class="mt-1 text-[11px] text-slate-500">
                Usa una combinación de letras y números que no uses en otros sistemas.
              </p>
            </div>

            <!-- Confirmación -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Confirmar nueva contraseña <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p
                *ngIf="submitted && form.controls['confirmPassword'].invalid"
                class="mt-1 text-[11px] text-red-600"
              >
                Debes confirmar la nueva contraseña.
              </p>
              <p
                *ngIf="submitted && !form.controls['confirmPassword'].invalid && !passwordsMatch"
                class="mt-1 text-[11px] text-red-600"
              >
                Las contraseñas no coinciden.
              </p>
            </div>

            <!-- Botón -->
            <div class="pt-2 flex justify-end gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700
                       hover:bg-slate-50"
                (click)="goBack()"
              >
                Volver
              </button>

              <button
                type="submit"
                [disabled]="saving"
                class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2
                       text-xs font-semibold text-white shadow hover:bg-indigo-700
                       disabled:bg-indigo-300 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              >
                <span *ngIf="!saving">Guardar nueva contraseña</span>
                <span *ngIf="saving">Guardando…</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Nota -->
        <p class="text-[11px] text-slate-400 max-w-lg">
          Por seguridad, si sospechas que alguien más conoce tu contraseña, cámbiala
          y cierra sesión en todos tus dispositivos.
        </p>
      </section>
    </main>
  `,
})
export class ChangePasswordPage {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  submitted = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  get passwordsMatch(): boolean {
    const v = this.form.value;
    return v.newPassword === v.confirmPassword;
  }

  async submit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid || !this.passwordsMatch) {
      this.errorMessage = 'Revisa los datos del formulario.';
      return;
    }

    const payload = {
      currentPassword: this.form.value.currentPassword!,
      newPassword: this.form.value.newPassword!,
    };

    this.saving = true;

    try {
      const url = `${environment.apiBase}/api/auth/change-password`;
      const res = await this.http
        .post<{ message: string; success: boolean }>(url, payload)
        .toPromise();

      if (res && res.success) {
        this.successMessage = res.message || 'Contraseña actualizada correctamente.';
        // Opcional: redirigir después de unos segundos
        setTimeout(() => {
          this.router.navigateByUrl('/dashboard');
        }, 1500);
      } else {
        this.errorMessage =
          res?.message || 'No se pudo actualizar la contraseña.';
      }

    } catch (err: any) {
      console.error('ChangePasswordPage: error', err);
      this.errorMessage =
        err?.error?.message ||
        'Ocurrió un error al cambiar la contraseña. Intenta nuevamente.';
    } finally {
      this.saving = false;
    }
  }

  goBack() {
    // Regresa a donde tiene más sentido: si viene de clínica → /mi-clinica, si no → /dashboard
    // Para simplificar, dejamos siempre /dashboard (puedes ajustar según tu rol).
    this.router.navigateByUrl('/dashboard');
  }
}
