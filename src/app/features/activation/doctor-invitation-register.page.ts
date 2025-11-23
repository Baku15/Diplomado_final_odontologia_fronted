// src/app/features/activation/doctor-invitation-register.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface DoctorInvitationStatus {
  clinicName: string | null;
  doctorEmail: string | null;
  doctorFullName: string | null;
  status: string;        // PENDING, ACCEPTED, REVOKED, etc.
  expired: boolean;
  createdAt?: string | null;
  expiresAt?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-doctor-invitation-register',
  imports: [CommonModule, NgIf, ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <section class="w-full max-w-lg">
        <div
          class="bg-white rounded-2xl shadow-lg border border-slate-200
                 px-6 py-6 md:px-7 md:py-7 space-y-5"
        >
          <!-- Header -->
          <header class="flex items-start gap-3">
            <div
              class="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl"
            >
              🦷
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">
                Registro de odontólogo invitado
              </p>
              <h1 class="text-xl md:text-2xl font-bold text-slate-900">
                Completa tus datos básicos para unirte a la clínica
              </h1>
              <p class="mt-1 text-xs text-slate-500 max-w-md">
                Aquí solo capturamos tu identidad (nombre y correo).
                Más adelante, en la plataforma, completarás tu perfil profesional
                con matrícula, especialidad y datos de contacto.
              </p>
            </div>
          </header>

          <!-- Cargando -->
          <div *ngIf="loading" class="space-y-3">
            <div class="h-3 w-40 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-3 w-52 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-10 w-full bg-slate-100 rounded-md animate-pulse"></div>
          </div>

          <!-- Error -->
          <div
            *ngIf="!loading && errorMessage"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ errorMessage }}
          </div>

          <!-- Contenido principal -->
          <ng-container *ngIf="!loading && !errorMessage && invitation">
            <!-- Resumen de invitación -->
            <section class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-xs space-y-2">
              <p class="text-slate-500">Te estás registrando como odontólogo(a) en:</p>
              <p class="text-base font-semibold text-slate-900">
                {{ invitation.clinicName || 'Clínica odontológica' }}
              </p>

              <div class="grid grid-cols-1 gap-1.5 mt-2">
                <div class="flex justify-between gap-2">
                  <span class="text-slate-500">Correo invitado:</span>
                  <span class="font-medium text-slate-800 text-right">
                    {{ invitation.doctorEmail }}
                  </span>
                </div>

                <div class="flex justify-between gap-2" *ngIf="invitation.doctorFullName">
                  <span class="text-slate-500">Nombre sugerido:</span>
                  <span class="font-medium text-slate-800 text-right">
                    {{ invitation.doctorFullName }}
                  </span>
                </div>

                <div class="flex justify-between gap-2">
                  <span class="text-slate-500">Estado:</span>
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    [ngClass]="statusBadgeClass"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="statusDotClass"></span>
                    {{ invitation.status }}
                  </span>
                </div>

                <div class="flex justify-between gap-2" *ngIf="invitation.expiresAt">
                  <span class="text-slate-500">Invitación válida hasta:</span>
                  <span class="text-slate-700 text-right">
                    {{ invitation.expiresAt | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>
              </div>
            </section>

            <!-- Advertencia si está expirada -->
            <div
              *ngIf="invitation.expired"
              class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              Esta invitación ha expirado. Pídele al administrador de la clínica que te envíe un nuevo enlace.
            </div>

            <!-- Formulario (solo identidad, sin teléfono) -->
            <section *ngIf="!invitation.expired">
              <form
                [formGroup]="form"
                (ngSubmit)="submit()"
                class="space-y-3 mt-1"
              >
                <!-- Email solo lectura -->
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    [value]="invitation.doctorEmail"
                    disabled
                    class="block w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                  />
                  <p class="text-[11px] text-slate-400 mt-1">
                    Tu cuenta se registrará con este correo. Si es incorrecto, contacta a la clínica.
                  </p>
                </div>

                <!-- Nombres -->
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">
                    Nombres <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="nombres"
                    class="block w-full rounded-lg border px-3 py-2 text-sm
                           border-slate-300 focus:outline-none focus:ring-1
                           focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ej. Ana Carolina"
                  />
                  <p
                    *ngIf="submitted && form.controls['nombres'].invalid"
                    class="mt-1 text-[11px] text-red-600"
                  >
                    Los nombres son obligatorios.
                  </p>
                </div>

                <!-- Apellidos -->
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">
                    Apellidos <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="apellidos"
                    class="block w-full rounded-lg border px-3 py-2 text-sm
                           border-slate-300 focus:outline-none focus:ring-1
                           focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ej. Pérez Gutiérrez"
                  />
                  <p
                    *ngIf="submitted && form.controls['apellidos'].invalid"
                    class="mt-1 text-[11px] text-red-600"
                  >
                    Los apellidos son obligatorios.
                  </p>
                </div>

                <!-- Mensajes -->
                <div *ngIf="errorMessageForm" class="text-[11px] text-red-600">
                  {{ errorMessageForm }}
                </div>
                <div *ngIf="successMessage" class="text-[11px] text-emerald-700">
                  {{ successMessage }}
                </div>

                <!-- Botón -->
                <div class="pt-1 flex justify-end">
                  <button
                    type="submit"
                    [disabled]="saving || successMessage"
                    class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2
                           text-xs font-semibold text-white shadow hover:bg-emerald-700
                           disabled:bg-emerald-300 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                  >
                    <span *ngIf="!saving && !successMessage">
                      Enviar datos y continuar
                    </span>
                    <span *ngIf="saving">Guardando…</span>
                    <span *ngIf="successMessage">Listo ✓</span>
                  </button>
                </div>
              </form>
            </section>
          </ng-container>

          <!-- Footer -->
          <footer class="pt-2 border-t border-slate-100 mt-3">
            <p class="text-[11px] text-slate-400">
              Este registro está vinculado a la invitación que recibiste. Si no reconoces esta clínica,
              puedes ignorar el enlace.
            </p>
          </footer>
        </div>

        <!-- Volver al inicio -->
        <div class="mt-4 text-center">
          <a
            routerLink="/"
            class="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700"
          >
            ← Volver al inicio
          </a>
        </div>
      </section>
    </main>
  `,
})
export class DoctorInvitationRegisterPage implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  invitation: DoctorInvitationStatus | null = null;
  token: string | null = null;

  loading = true;
  saving = false;
  submitted = false;

  errorMessage = '';
  errorMessageForm = '';
  successMessage = '';

  // 👇 Solo nombres y apellidos, sin teléfono
  form = this.fb.group({
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
  });

  get statusBadgeClass() {
    if (!this.invitation) {
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
    if (this.invitation.expired) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (this.invitation.status === 'ACCEPTED') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (this.invitation.status === 'REVOKED') {
      return 'bg-red-50 text-red-800 border-red-200';
    }
    return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  }

  get statusDotClass() {
    if (!this.invitation) return 'bg-slate-400';
    if (this.invitation.expired) return 'bg-amber-500';
    if (this.invitation.status === 'ACCEPTED') return 'bg-emerald-500';
    if (this.invitation.status === 'REVOKED') return 'bg-red-500';
    return 'bg-indigo-500';
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.loading = false;
      this.errorMessage = 'Token de invitación no válido.';
      return;
    }

    const url = `${environment.apiBase}/api/public/doctor-invitations/${this.token}`;
    this.http.get<DoctorInvitationStatus>(url).subscribe({
      next: (inv) => {
        this.invitation = inv;
        this.loading = false;

        // Prefill de nombres/apellidos si tenemos fullName
        if (inv.doctorFullName) {
          const parts = inv.doctorFullName.trim().split(/\s+/);
          const first = parts.shift() ?? '';
          const last = parts.join(' ');
          this.form.patchValue({
            nombres: first,
            apellidos: last,
          });
        }
      },
      error: (err) => {
        console.error('Error cargando invitación en registro de doctor', err);
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          'No se pudo encontrar la invitación. Verifica que el enlace sea correcto.';
      },
    });
  }

  submit() {
    this.submitted = true;
    this.errorMessageForm = '';
    this.successMessage = '';

    if (!this.invitation || !this.token) {
      this.errorMessageForm = 'Invitación no válida.';
      return;
    }

    if (this.invitation.expired) {
      this.errorMessageForm = 'La invitación ha expirado. Pide una nueva a la clínica.';
      return;
    }

    if (this.form.invalid) {
      this.errorMessageForm = 'Revisa los datos obligatorios del formulario.';
      return;
    }

    const payload = {
      nombres: this.form.value.nombres!,
      apellidos: this.form.value.apellidos!,
      // phone se deja implícitamente null en backend (opcional)
    };

    this.saving = true;

    const url = `${environment.apiBase}/api/public/doctor-invitations/${this.token}/register`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage =
          'Datos enviados correctamente. Te enviaremos un correo para activar tu cuenta y definir tu contraseña.';
        setTimeout(() => {
          this.router.navigateByUrl('/');
        }, 2500);
      },
      error: (err) => {
        console.error('Error registrando doctor invitado', err);
        this.saving = false;
        this.errorMessageForm =
          err?.error?.message ||
          'Ocurrió un error al registrar tus datos. Intenta nuevamente más tarde.';
      },
    });
  }
}
