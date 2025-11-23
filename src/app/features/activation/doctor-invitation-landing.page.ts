// src/app/features/activation/doctor-invitation-landing.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
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
  selector: 'app-doctor-invitation-landing',
  imports: [CommonModule, NgIf, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <section class="w-full max-w-lg">
        <!-- Tarjeta principal -->
        <div
          class="bg-white rounded-2xl shadow-lg border border-slate-200
                 px-6 py-6 md:px-7 md:py-7 space-y-4"
        >
          <!-- Cabecera -->
          <header class="flex items-start gap-3">
            <div
              class="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl"
            >
              🦷
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">
                Invitación para odontólogo
              </p>
              <h1 class="text-xl md:text-2xl font-bold text-slate-900">
                Te invitaron a unirte a una clínica
              </h1>
            </div>
          </header>

          <!-- Cargando -->
          <div *ngIf="loading" class="mt-4 space-y-3">
            <div class="h-3 w-32 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
            <div class="h-10 w-full bg-slate-100 rounded-md animate-pulse"></div>
          </div>

          <!-- Error -->
          <div
            *ngIf="!loading && errorMessage"
            class="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ errorMessage }}
          </div>

          <!-- Contenido cuando todo va bien -->
          <div *ngIf="!loading && !errorMessage && invitation" class="space-y-4">

            <!-- Resumen de invitación -->
            <div class="space-y-1.5">
              <p class="text-sm text-slate-700">
                Has sido invitado(a) a unirte como
                <span class="font-semibold text-indigo-700">odontólogo(a)</span>
                a la clínica:
              </p>
              <p class="text-base font-semibold text-slate-900">
                {{ invitation.clinicName || 'Clínica odontológica' }}
              </p>
            </div>

            <!-- Datos del doctor -->
            <div class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-xs">
              <p class="text-slate-500 mb-1">Detalles de la invitación</p>

              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between gap-2">
                  <span class="text-slate-500">Correo invitado:</span>
                  <span class="font-medium text-slate-800">
                    {{ invitation.doctorEmail }}
                  </span>
                </div>

                <div class="flex justify-between gap-2" *ngIf="invitation.doctorFullName">
                  <span class="text-slate-500">Nombre:</span>
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
                    <span class="h-1.5 w-1.5 rounded-full"
                          [ngClass]="statusDotClass"></span>
                    {{ invitation.status }}
                  </span>
                </div>

                <div class="flex justify-between gap-2" *ngIf="invitation.expiresAt">
                  <span class="text-slate-500">Vence el:</span>
                  <span class="text-slate-700">
                    {{ invitation.expiresAt | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Mensaje si está expirada -->
            <div
              *ngIf="invitation.expired"
              class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              Esta invitación ha expirado. Pídele al administrador de la clínica
              que te envíe un nuevo enlace.
            </div>

            <!-- Acciones -->
            <div class="pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div class="text-[11px] text-slate-500 md:max-w-[60%]">
                Al aceptar la invitación podrás crear tu cuenta de acceso
                y luego completar tu perfil profesional.
              </div>

              <div class="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-lg
                         bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow
                         hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                         focus:ring-offset-1 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  [disabled]="invitation.expired || accepting"
                  (click)="acceptInvitation()"
                >
                  <span *ngIf="!accepting">Aceptar invitación y registrarme</span>
                  <span *ngIf="accepting">Redirigiendo…</span>
                </button>

                <!-- Botón rechazar: todavía decorativo -->
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-lg
                         border border-slate-300 px-4 py-2 text-xs font-semibold
                         text-slate-600 bg-white hover:bg-slate-50
                         disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled
                  title="Acción disponible próximamente"
                >
                  Rechazar invitación
                </button>
              </div>
            </div>
          </div>

          <!-- Footer pequeño -->
          <footer class="pt-2 border-t border-slate-100 mt-3">
            <p class="text-[11px] text-slate-400">
              Si no estabas esperando esta invitación, puedes ignorar este mensaje.
            </p>
          </footer>
        </div>

        <!-- Link de volver al inicio -->
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
export class DoctorInvitationLandingPage implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = true;
  accepting = false;
  errorMessage = '';
  invitation: DoctorInvitationStatus | null = null;
  private token: string | null = null;

  get statusBadgeClass() {
    if (!this.invitation) return 'bg-slate-100 text-slate-700 border border-slate-200';

    if (this.invitation.expired) {
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
    if (this.invitation.status === 'ACCEPTED') {
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    }
    if (this.invitation.status === 'CANCELED') {
      return 'bg-red-50 text-red-800 border border-red-200';
    }
    // PENDING u otros
    return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
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
      next: (res) => {
        this.invitation = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando invitación de doctor', err);
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          'No se pudo encontrar la invitación. Verifica que el enlace sea correcto.';
      },
    });
  }

  acceptInvitation() {
    if (!this.invitation || !this.token || this.invitation.expired) {
      return;
    }

    this.accepting = true;

    // 🔁 ANTES: /registro?invitationToken=...
    // AHORA: ruta específica para registro de doctor invitado
    this.router.navigate(['/registro-doctor', this.token]);
  }

}
