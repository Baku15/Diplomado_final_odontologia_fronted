// src/app/features/activation/doctor-invitation-register.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 px-6 py-6 md:px-7 md:py-7 space-y-5">

          <!-- Header -->
          <header class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl">🦷</div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">Registro de odontólogo invitado</p>
              <h1 class="text-xl md:text-2xl font-bold text-slate-900">Completa tus datos básicos para unirte a la clínica</h1>
              <p class="mt-1 text-xs text-slate-500 max-w-md">Aquí solo capturamos tu identidad (nombre, correo y contraseña). Más adelante, en la plataforma, completarás tu perfil profesional.</p>
            </div>
          </header>

          <!-- Loading -->
          <div *ngIf="loading" class="space-y-3">
            <div class="h-3 w-40 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-3 w-52 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-10 w-full bg-slate-100 rounded-md animate-pulse"></div>
          </div>

          <!-- Global error card -->
          <div *ngIf="!loading && globalError" class="rounded-lg border px-4 py-4 bg-white/60 border-slate-200">
            <h3 class="text-sm font-semibold text-slate-800 mb-2">{{ globalErrorTitle }}</h3>
            <p class="text-sm text-slate-600 mb-3">{{ globalError }}</p>
            <div class="flex gap-2">
              <button (click)="goHome()" class="px-3 py-1.5 rounded-md bg-slate-100 text-sm">Volver al inicio</button>
              <button (click)="goLogin()" class="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm">Ir a iniciar sesión</button>
              <button *ngIf="canContactAdmin" (click)="contactAdmin()" class="px-3 py-1.5 rounded-md border border-slate-200 text-sm">Contactar administración</button>
            </div>
          </div>

          <!-- Main content -->
          <ng-container *ngIf="!loading && !globalError && invitation">
            <section class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-xs space-y-2">
              <p class="text-slate-500">Te estás registrando como odontólogo(a) en:</p>
              <p class="text-base font-semibold text-slate-900">{{ invitation.clinicName || 'Clínica odontológica' }}</p>

              <div class="grid grid-cols-1 gap-1.5 mt-2">
                <div class="flex justify-between gap-2"><span class="text-slate-500">Correo invitado:</span><span class="font-medium text-slate-800 text-right">{{ invitation.doctorEmail }}</span></div>

                <div class="flex justify-between gap-2" *ngIf="invitation.doctorFullName">
                  <span class="text-slate-500">Nombre sugerido:</span><span class="font-medium text-slate-800 text-right">{{ invitation.doctorFullName }}</span>
                </div>

                <div class="flex justify-between gap-2">
                  <span class="text-slate-500">Estado:</span>
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" [ngClass]="statusBadgeClass">
                    <span class="h-1.5 w-1.5 rounded-full" [ngClass]="statusDotClass"></span>{{ invitation.status }}
                  </span>
                </div>

                <div class="flex justify-between gap-2" *ngIf="invitation.expiresAt">
                  <span class="text-slate-500">Invitación válida hasta:</span>
                  <span class="text-slate-700 text-right">{{ invitation.expiresAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </section>

            <!-- Expired notice -->
            <div *ngIf="invitation.expired" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Esta invitación ha expirado. Pídele al administrador de la clínica que te envíe un nuevo enlace.
            </div>

            <!-- SHOW FORM ONLY WHEN status === 'PENDING' AND not expired -->
            <section *ngIf="invitation && !invitation.expired && invitation.status === 'PENDING'">
              <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3 mt-1">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Correo electrónico</label>
                  <input type="email" [value]="invitation.doctorEmail" disabled class="block w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500" />
                  <p class="text-[11px] text-slate-400 mt-1">Tu cuenta se registrará con este correo. Si es incorrecto, contacta a la clínica.</p>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Nombres <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="firstName" class="block w-full rounded-lg border px-3 py-2 text-sm border-slate-300" placeholder="Ej. Ana Carolina" />
                  <p *ngIf="submitted && form.controls['firstName'].invalid" class="mt-1 text-[11px] text-red-600">Los nombres son obligatorios.</p>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Apellidos <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="lastName" class="block w-full rounded-lg border px-3 py-2 text-sm border-slate-300" placeholder="Ej. Pérez Gutiérrez" />
                  <p *ngIf="submitted && form.controls['lastName'].invalid" class="mt-1 text-[11px] text-red-600">Los apellidos son obligatorios.</p>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Contraseña <span class="text-red-500">*</span></label>
                  <input type="password" formControlName="password" class="block w-full rounded-lg border px-3 py-2 text-sm border-slate-300" placeholder="Mínimo 6 caracteres" />
                  <p *ngIf="submitted && form.controls['password'].invalid" class="mt-1 text-[11px] text-red-600">La contraseña es obligatoria (mín. 6 caracteres).</p>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Repetir contraseña <span class="text-red-500">*</span></label>
                  <input type="password" formControlName="confirmPassword" class="block w-full rounded-lg border px-3 py-2 text-sm border-slate-300" placeholder="Repite la contraseña" />
                  <p *ngIf="submitted && (form.controls['confirmPassword'].invalid || passwordsMismatch())" class="mt-1 text-[11px] text-red-600">
                    <span *ngIf="form.controls['confirmPassword'].invalid">Repite la contraseña (mín. 6 caracteres).</span>
                    <span *ngIf="!form.controls['confirmPassword'].invalid && passwordsMismatch()">Las contraseñas no coinciden.</span>
                  </p>
                </div>

                <div *ngIf="errorMessageForm" class="text-[11px] text-red-600">{{ errorMessageForm }}</div>
                <div *ngIf="successMessage" class="text-[11px] text-emerald-700">{{ successMessage }}</div>

                <div class="pt-1 flex justify-end">
                  <button type="submit" [disabled]="saving || successMessage" class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                    <span *ngIf="!saving && !successMessage">Enviar datos y continuar</span>
                    <span *ngIf="saving">Guardando…</span>
                    <span *ngIf="successMessage">Listo ✓</span>
                  </button>
                </div>
              </form>
            </section>
          </ng-container>

          <footer class="pt-2 border-t border-slate-100 mt-3">
            <p class="text-[11px] text-slate-400">Este registro está vinculado a la invitación que recibiste. Si no reconoces esta clínica, puedes ignorar el enlace.</p>
          </footer>
        </div>

        <div class="mt-4 text-center">
          <a routerLink="/" class="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700">← Volver al inicio</a>
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

  globalError: string | null = null;
  globalErrorTitle = 'Estado de la invitación';
  canContactAdmin = false;

  errorMessage = '';
  errorMessageForm = '';
  successMessage = '';

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  get statusBadgeClass() {
    if (!this.invitation) return 'bg-slate-100 text-slate-700 border border-slate-200';
    if (this.invitation.expired) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (this.invitation.status === 'ACCEPTED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (this.invitation.status === 'REVOKED') return 'bg-red-50 text-red-800 border-red-200';
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
      this.globalError = 'Token de invitación no válido.';
      return;
    }

    const url = `${environment.apiBase}/api/public/doctor-invitations/${this.token}`;
    this.http.get<DoctorInvitationStatus>(url).subscribe({
      next: (inv) => {
        this.invitation = inv;
        this.loading = false;

        // Si el estado NO es PENDING => mostrar tarjeta global y NO renderizar el formulario
        if (inv.status && inv.status !== 'PENDING') {
          this.globalErrorTitle = 'Invitación no disponible';
          if (inv.status === 'ACCEPTED') {
            this.globalError = `La invitación ya fue aceptada (estado: ${inv.status}). Si ya completaste el registro, inicia sesión.`;
          } else if (inv.status === 'REVOKED') {
            this.globalError = `La invitación fue revocada por la clínica. Contacta a administración.`;
            this.canContactAdmin = true;
          } else {
            this.globalError = `Estado de invitación: ${inv.status}. Si crees que es un error, contacta a la clínica.`;
            this.canContactAdmin = true;
          }
          return;
        }

        // Prefill de nombres/apellidos si tenemos fullName (solo si PENDING)
        if (inv.doctorFullName) {
          const parts = inv.doctorFullName.trim().split(/\s+/);
          const first = parts.shift() ?? '';
          const last = parts.join(' ');
          this.form.patchValue({ firstName: first, lastName: last });
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error cargando invitación en registro de doctor', err);
        this.loading = false;

        const remoteMsg = (err.error && typeof err.error === 'string') ? err.error : err?.error?.message ?? null;

        if (err.status === 409) {
          this.globalErrorTitle = 'Invitación no disponible';
          this.globalError = remoteMsg ?? 'La invitación ya fue aceptada o no está disponible.';
          this.canContactAdmin = true;
          return;
        }

        if (err.status === 404) {
          this.globalErrorTitle = 'Invitación no encontrada';
          this.globalError = 'No se encontró la invitación. Verifica el enlace o contacta a la clínica.';
          return;
        }

        this.globalErrorTitle = 'Error';
        this.globalError = remoteMsg ?? 'No se pudo cargar la invitación. Intenta nuevamente más tarde.';
      },
    });
  }

  private getControl(name: keyof typeof this.form.controls): AbstractControl {
    return this.form.controls[name];
  }

  passwordsMismatch(): boolean {
    const p = this.getControl('password').value as string | null;
    const c = this.getControl('confirmPassword').value as string | null;
    return !!p && !!c && p !== c;
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

    // safety: ensure still PENDING before submit
    if (this.invitation.status !== 'PENDING') {
      this.globalErrorTitle = 'Invitación no disponible';
      this.globalError = `La invitación ya no está disponible (estado: ${this.invitation.status}).`;
      return;
    }

    if (this.form.invalid) {
      this.errorMessageForm = 'Revisa los datos obligatorios del formulario.';
      return;
    }

    if (this.passwordsMismatch()) {
      this.errorMessageForm = 'Las contraseñas no coinciden.';
      return;
    }

    const payload = {
      firstName: String(this.form.value.firstName).trim(),
      lastName: String(this.form.value.lastName).trim(),
      password: String(this.form.value.password)
    };

    this.saving = true;

    const url = `${environment.apiBase}/api/public/doctor-invitations/${this.token}/register`;
    this.http.post(url, payload, { headers: { 'Content-Type': 'application/json' } }).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Datos enviados correctamente. Puedes iniciar sesión ahora.';
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error registrando doctor invitado', err);
        this.saving = false;

        const body = err?.error;
        if (body && body.errors && Array.isArray(body.errors)) {
          this.errorMessageForm = body.errors.map((e: any) => `${e.field}: ${e.message}`).join('; ');
          return;
        }

        if (typeof body === 'string') {
          this.errorMessageForm = body;
          return;
        }

        this.errorMessageForm = err?.error?.message || 'Ocurrió un error al registrar tus datos.';
      },
    });
  }

  goHome() {
    this.router.navigateByUrl('/');
  }

  goLogin() {
    this.router.navigateByUrl('/login');
  }

  contactAdmin() {
    const mailto = 'mailto:admin@clinic.local?subject=Invitaci%C3%B3n%20-%20Soporte';
    window.location.href = mailto;
  }
}
