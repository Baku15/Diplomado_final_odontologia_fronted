// src/app/pages/clinic-admin-dashboard.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-clinic-admin-dashboard',
  imports: [CommonModule, NgIf, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="border-b bg-white">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-slate-900">
              Panel de tu clínica
            </h1>
            <p class="text-sm text-slate-500">
              Administra tu clínica: doctores, asistentes, pacientes y agenda.
            </p>
          </div>

          <div *ngIf="loading" class="text-sm text-slate-500">Cargando perfil...</div>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-4 py-6">
        <!-- Banner para completar perfil clínico -->
        <div *ngIf="mustCompleteProfile" class="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div class="flex items-start gap-4">
            <div>
              <strong class="block text-amber-900">Completa tu perfil clínico</strong>
              <div class="text-sm text-amber-800">
                Antes de usar las funcionalidades clínicas, completa tus datos (especialidad, matrícula...).
              </div>
            </div>
            <div class="ml-auto">
              <button (click)="goToCompleteProfile()"
                      class="inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
                Completar perfil
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
            <h2 class="text-sm font-semibold text-slate-900 mb-1">
              Equipo
            </h2>
            <p class="text-xs text-slate-500 mb-3">
              Gestiona odontólogos y asistentes de tu clínica.
            </p>
            <button
              class="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Ver equipo
            </button>
          </div>

          <div class="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
            <h2 class="text-sm font-semibold text-slate-900 mb-1">
              Pacientes
            </h2>
            <p class="text-xs text-slate-500 mb-3">
              Registra nuevos pacientes y revisa sus historias clínicas.
            </p>
            <button
              class="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
            >
              Ver pacientes
            </button>
          </div>

          <div class="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
            <h2 class="text-sm font-semibold text-slate-900 mb-1">
              Agenda
            </h2>
            <p class="text-xs text-slate-500 mb-3">
              Organiza horarios y consultorios de tu equipo.
            </p>
            <button
              class="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Ver agenda
            </button>
          </div>
        </div>

        <!-- info debug (temporal) -->
        <div class="mt-6 text-sm text-slate-600">
          <div>clinicId: <strong>{{ clinicId ?? '—' }}</strong></div>
          <div>mustCompleteProfile: <strong>{{ mustCompleteProfile }}</strong></div>
        </div>
      </main>
    </div>
  `,
})
export class ClinicAdminDashboardPage implements OnInit {
  private oidc = inject(OidcSecurityService);
  private http = inject(HttpClient);
  private router = inject(Router);

  clinicId: number | null = null;
  mustCompleteProfile = false;
  loading = true;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      // 1) intentar desde userData$ (claims que emite la librería)
      const userData: any = await firstValueFrom(this.oidc.userData$);
      console.debug('clinic dashboard: userData =', userData);

      // claims comunes: clinic_id, clinicId, clinic
      let clinicClaim = userData?.clinic_id ?? userData?.clinicId ?? userData?.clinic;
      if (clinicClaim != null) {
        const parsed = Number(clinicClaim);
        if (!Number.isNaN(parsed)) this.clinicId = parsed;
      }

      // mustCompleteProfile claim (puede venir boolean o string)
      let must = userData?.mustCompleteProfile ?? userData?.must_complete_profile ?? userData?.mustComplete;
      if (typeof must === 'string') {
        this.mustCompleteProfile = must === 'true' || must === '1';
      } else if (typeof must === 'boolean') {
        this.mustCompleteProfile = must;
      } else {
        this.mustCompleteProfile = false;
      }

      // 2) Si faltó algo, intentar leer access_token y decodificar payload JWT
      if (this.clinicId == null || this.mustCompleteProfile === false) {
        try {
          const accessToken: string | null = await firstValueFrom(this.oidc.getAccessToken());
          if (accessToken) {
            console.debug('clinic dashboard: access_token (raw) =', accessToken);
            const payload = this.decodeJwtPayload(accessToken);
            console.debug('clinic dashboard: access_token payload =', payload);
            if (payload) {
              const c = payload['clinic_id'] ?? payload['clinicId'] ?? payload['clinic'];
              if (c != null && this.clinicId == null) {
                const parsed = Number(c);
                if (!Number.isNaN(parsed)) this.clinicId = parsed;
              }
              const m = payload['mustCompleteProfile'] ?? payload['must_complete_profile'] ?? payload['mustComplete'];
              if (m != null && !this.mustCompleteProfile) {
                if (typeof m === 'boolean') this.mustCompleteProfile = m;
                else this.mustCompleteProfile = String(m) === 'true' || String(m) === '1';
              }
            }
          } else {
            console.debug('clinic dashboard: no access token disponible desde oidc.getAccessToken()');
          }
        } catch (e) {
          console.debug('clinic dashboard: error leyendo access token', e);
        }
      }

      // 3) Si aún falta info, hacer fallback a /api/me (útil si estás usando sesión en el backend)
      if (this.clinicId == null || this.mustCompleteProfile === false) {
        try {
          const me: any = await firstValueFrom(this.http.get('/api/me', {withCredentials: true}));
          console.debug('clinic dashboard: /api/me =', me);
          if (me?.clinicId != null && this.clinicId == null) this.clinicId = Number(me.clinicId);
          if (me?.mustCompleteProfile != null) this.mustCompleteProfile = !!me.mustCompleteProfile;
        } catch (err) {
          console.warn('clinic dashboard: fallo al pedir /api/me (fallback)', err);
        }
      }

      // tomar decisión
      if (this.clinicId != null) {
        console.debug('clinic dashboard: clinicId presente — puedes cargar staff.');
        // aquí podrías ejecutar this.loadStaff(this.clinicId);
      } else {
        console.debug('clinic dashboard: No clinic_id claim en token; no se cargará staff.');
      }
    } catch (err) {
      console.error('clinic dashboard: error obteniendo userData', err);
    } finally {
      this.loading = false;
    }
  }

  goToCompleteProfile() {
    // navega a la ruta donde tienes el formulario de completar perfil
    this.router.navigateByUrl('/profile/complete').catch(err => {
      console.error('Error navegando a completar perfil', err);
      window.location.href = '/profile/complete';
    });
  }

  // ---------------------------
  // Helpers
  // ---------------------------
  private decodeJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      // payload original
      const rawPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');

      // Creamos nueva variable editable
      let padded = rawPayload;

      // Ajuste de padding
      const mod = padded.length % 4;
      if (mod === 2) padded += '==';
      else if (mod === 3) padded += '=';

      // Decodificar base64
      const json = decodeURIComponent(
        Array.prototype.map.call(atob(padded), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );

      return JSON.parse(json);

    } catch (e) {
      console.debug('decodeJwtPayload error', e);
      return null;
    }
  }
}
