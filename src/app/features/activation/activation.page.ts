// src/app/features/activation/activation.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  standalone: true,
  selector: 'app-activation',
  imports: [NgIf, ReactiveFormsModule, NavbarComponent],
  template: `
    <!-- NAVBAR COMÚN -->
    <app-navbar></app-navbar>

    <main
      class="min-h-screen bg-slate-50 flex items-center justify-center py-10 px-4"
    >
      <div class="w-full max-w-md">
        <!-- Tarjeta principal -->
        <div
          class="bg-white rounded-2xl shadow-xl border border-slate-200 px-6 py-7 relative overflow-hidden"
        >
          <!-- Badge -->
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-4"
          >
            <span>🔐</span>
            <span>Activación de cuenta</span>
          </div>

          <h1 class="text-2xl font-bold text-slate-900 mb-1">
            Activa tu cuenta
          </h1>
          <p class="text-sm text-slate-600 mb-5">
            Define una contraseña segura para completar la activación de tu
            usuario en OdontoWeb.
          </p>

          <!-- Mensaje de error general (por token inválido o backend) -->
          <div
            *ngIf="errorMessage"
            class="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-xs"
          >
            {{ errorMessage }}
          </div>

          <!-- Mensaje de éxito -->
          <div
            *ngIf="successMessage"
            class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-xs"
          >
            {{ successMessage }}
          </div>

          <!-- FORMULARIO -->
          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="space-y-4"
            novalidate
          >
            <!-- Nueva contraseña -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                formControlName="password"
                class="block w-full rounded-lg border px-3 py-2 text-sm
                       border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                       disabled:bg-slate-100"
                placeholder="Mínimo 8 caracteres"
              />
              <p
                *ngIf="submitted && form.controls['password'].invalid"
                class="mt-1 text-xs text-red-600"
              >
                La contraseña es obligatoria y debe tener al menos 8 caracteres.
              </p>
            </div>

            <!-- Confirmar contraseña -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                formControlName="confirmPassword"
                class="block w-full rounded-lg border px-3 py-2 text-sm
                       border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
                       disabled:bg-slate-100"
                placeholder="Repite tu contraseña"
              />
              <p
                *ngIf="
                  submitted &&
                  form.controls['confirmPassword'].invalid
                "
                class="mt-1 text-xs text-red-600"
              >
                Debes confirmar la contraseña.
              </p>
              <p
                *ngIf="submitted && passwordMismatch"
                class="mt-1 text-xs text-red-600"
              >
                Las contraseñas no coinciden.
              </p>
            </div>

            <!-- Tips -->
            <div class="text-[11px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-3 py-2">
              Usa al menos 8 caracteres combinando letras, números y símbolos
              para una mejor seguridad.
            </div>

            <!-- Botón -->
            <div class="pt-2">
              <button
                type="submit"
                class="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                       disabled:bg-indigo-300 disabled:cursor-not-allowed"
                [disabled]="form.invalid || isSubmitting || !token"
              >
                <span *ngIf="!isSubmitting">Activar cuenta</span>
                <span *ngIf="isSubmitting">Activando…</span>
              </button>
            </div>
          </form>

          <!-- Pie de ayuda -->
          <p class="mt-4 text-[11px] text-slate-500">
            Si este enlace ya expiró o tienes problemas para activar tu cuenta,
            responde al correo de activación o contacta a soporte.
          </p>
        </div>
      </div>
    </main>
  `,
})
export class ActivationPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  token: string | null = null;

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  submitted = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  passwordMismatch = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.errorMessage =
        'El enlace de activación no es válido o ya ha expirado. Verifica el correo o solicita uno nuevo.';
      this.form.disable();
    }
  }

  async submit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordMismatch = false;

    if (!this.token) {
      this.errorMessage =
        'No se encontró un token de activación válido en el enlace.';
      return;
    }

    if (this.form.invalid) return;

    const { password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.passwordMismatch = true;
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(
        this.http.post(`/api/auth/activate/${this.token}`, {
          newPassword: password,
        })
      );

      this.successMessage =
        'Tu cuenta fue activada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.';
      this.form.disable();

      // Navegar al inicio después de unos segundos
      setTimeout(() => this.router.navigateByUrl('/'), 2500);
    } catch (err: any) {
      console.error('Error al activar cuenta:', err);
      this.errorMessage =
        err?.error?.message ||
        'No se pudo activar la cuenta. Es posible que el enlace haya expirado.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
