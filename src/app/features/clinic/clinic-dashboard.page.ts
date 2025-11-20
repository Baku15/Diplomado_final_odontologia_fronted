// src/app/features/clinic/clinic-dashboard.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ClinicStaffApi, StaffView } from './clinic-staff.api';
import { CreateStaffModalComponent } from './create-staff-modal.component';
import { EditStaffModalComponent } from './edit-staff-modal.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-clinic-dashboard',
  imports: [CommonModule, CreateStaffModalComponent, EditStaffModalComponent],
  template: `
    <main class="min-h-screen bg-slate-50 flex flex-col">

      <!-- HEADER -->
      <header class="bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-slate-900">
              Panel de tu clínica
            </h1>
            <p class="text-sm text-slate-600">
              Administra odontólogos, asistentes y la configuración de tu clínica.
            </p>
          </div>

          <div class="flex items-center gap-4">
            <div class="hidden md:flex flex-col text-right">
              <span class="text-sm font-medium text-slate-900">{{ username || '' }}</span>
              <span class="text-xs text-slate-500">Administrador de clínica</span>
            </div>
            <button (click)="openDoctorModal()" class="px-3 py-2 rounded-lg bg-blue-600 text-white">+ Odontólogo</button>
            <button (click)="openAssistantModal()" class="px-3 py-2 rounded-lg bg-indigo-600 text-white">+ Asistente</button>
            <button (click)="logout()" class="px-3 py-2 rounded-lg bg-red-600 text-white">Cerrar sesión</button>
          </div>
        </div>
      </header>

      <!-- MAIN -->
      <section class="max-w-6xl mx-auto px-4 py-6">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-4">
          <h2 class="font-semibold text-slate-900">Personal de la clínica</h2>
          <p class="text-sm text-slate-600">Lista rápida de odontólogos y asistentes registrados.</p>
        </div>

        <div *ngIf="loading" class="text-sm text-slate-500 mb-4">Cargando personal...</div>
        <div *ngIf="!loading && staff.length === 0" class="text-sm text-slate-500 mb-4">No hay personal registrado aún.</div>

        <div *ngFor="let s of staff" class="bg-white rounded-lg border p-3 flex items-center justify-between mb-3">
          <div>
            <div class="font-medium">
              {{ s.nombre }} {{ s.apellido }}
              <span class="text-xs text-slate-500">({{ s.username }})</span>
            </div>
            <div class="text-xs text-slate-500">
              {{ s.email }} · {{ s.phone || '—' }}
            </div>
            <div class="text-xs text-slate-500 mt-1">
              Roles:
              <span *ngFor="let r of s.roles; let i = index">
                {{ r }}<span *ngIf="i < s.roles.length - 1">, </span>
              </span>
            </div>
          </div>

          <!-- ACCIONES -->
          <div class="flex flex-col items-end gap-2">
            <div class="text-sm text-slate-600">{{ s.status }}</div>

            <div class="flex gap-2 mt-2">
              <button (click)="openEditModal(s)"
                      class="px-2 py-1 rounded border text-xs hover:bg-slate-100">
                Editar
              </button>

              <button *ngIf="s.status !== 'ACTIVE'"
                      (click)="activate(s)"
                      class="px-2 py-1 rounded bg-emerald-600 text-white text-xs hover:opacity-90">
                Activar
              </button>

              <button *ngIf="s.status === 'ACTIVE'"
                      (click)="deactivate(s)"
                      class="px-2 py-1 rounded bg-red-600 text-white text-xs hover:opacity-90">
                Bloquear
              </button>
            </div>
          </div>
        </div>

        <!-- Modales -->
        <app-create-staff-modal
          [visible]="showDoctorModal"
          [clinicId]="clinicId"
          mode="doctor"
          (closed)="onModalClosed()"
          (created)="onCreated()"
        ></app-create-staff-modal>

        <app-create-staff-modal
          [visible]="showAssistantModal"
          [clinicId]="clinicId"
          mode="assistant"
          (closed)="onModalClosed()"
          (created)="onCreated()"
        ></app-create-staff-modal>

        <app-edit-staff-modal
          [visible]="showEditModal"
          [clinicId]="clinicId"
          [staff]="editingStaff"
          (closed)="showEditModal = false; editingStaff = null"
          (updated)="onUpdated()"
        ></app-edit-staff-modal>

      </section>
    </main>
  `,
})
export class ClinicDashboardPage implements OnInit {
  private api = inject(ClinicStaffApi);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);   // 👈 AÑADIR ESTA LÍNEA

  accessInfo = {
    username: '',
    email: '',
    clinicId: null as number | null,
  };


  staff: StaffView[] = [];
  loading = false;
  clinicId: number | null = null;

  showDoctorModal = false;
  showAssistantModal = false;

  editingStaff: any | null = null;
  showEditModal = false;

  username: string | null = null;

  async ngOnInit(): Promise<void> {

    try {
      const d: any = await firstValueFrom(this.auth.userData$);
      if (d?.username) this.username = d.username;

      let cid: number | null = null;

      // 1) Intentar clinic_id desde el token
      if (d?.clinic_id) {
        cid = Number(d.clinic_id);
        console.log('ClinicDashboard: clinic_id desde token =', cid);
      } else {
        console.warn(
          'ClinicDashboard: No clinic_id claim en token; intentando leer desde /api/me...'
        );

        // 2) Fallback: /api/me
        try {
          const me: any = await firstValueFrom(
            this.http.get('/api/me', { withCredentials: true })
          );
          console.log('ClinicDashboard: /api/me =', me);

          // 🔹 NUEVO: comprobar si debe completar perfil
          const roles: string[] = Array.isArray(me?.roles) ? me.roles : [];
          const isDentist =
            roles.includes('ROLE_DENTIST') || roles.includes('DENTIST');
          const mustComplete = !!me?.mustCompleteProfile;

          console.log(
            'ClinicDashboard: mustComplete =',
            mustComplete,
            'isDentist =',
            isDentist
          );

          // ⚠️ Si es dentista y tiene mustCompleteProfile=true → enviar al wizard
          if (mustComplete && isDentist) {
            console.log('ClinicDashboard: redirigiendo a /completar-perfil');
            await this.router.navigateByUrl('/completar-perfil');
            return; // 👈 detenemos aquí el ngOnInit, no cargamos el panel
          }

          // Lo de antes: usar clinicId devuelto por /api/me
          if (me?.clinicId) {
            cid = Number(me.clinicId);
          }
        } catch (err) {
          console.error('ClinicDashboard: error llamando a /api/me', err);
        }
      }

      if (cid && Number.isFinite(cid)) {
        this.clinicId = cid;
        await this.loadStaff();
      } else {
        console.warn(
          'ClinicDashboard: no se pudo resolver clinicId; no se cargará staff.'
        );
      }
    } catch (err) {
      console.error('ClinicDashboard: error en ngOnInit', err);
    }
  }

  openDoctorModal() { this.showDoctorModal = true; }
  openAssistantModal() { this.showAssistantModal = true; }
  onModalClosed() { this.showDoctorModal = false; this.showAssistantModal = false; }

  async onCreated() {
    await this.loadStaff();
  }

  async loadStaff() {
    if (!this.clinicId) return;
    this.loading = true;
    this.api.listStaff(this.clinicId, 0, 50).subscribe({
      next: (p) => { this.staff = p.content ?? []; this.loading = false; },
      error: (e) => { console.error('loadStaff error', e); this.loading = false; }
    });
  }

  openEditModal(s: any) {
    this.editingStaff = s;
    this.showEditModal = true;
  }

  async activate(s: any) {
    if (!this.clinicId) return;
    try {
      await firstValueFrom(this.api.activateStaff(this.clinicId, s.id));
      alert('Usuario activado');
      this.loadStaff();
    } catch (e: any) {
      console.error('activate error', e);
      alert(e?.error?.message || 'Error al activar usuario');
    }
  }

  async deactivate(s: any) {
    if (!this.clinicId) return;
    try {
      await firstValueFrom(this.api.deactivateStaff(this.clinicId, s.id));
      alert('Usuario bloqueado');
      this.loadStaff();
    } catch (e: any) {
      console.error('deactivate error', e);
      alert(e?.error?.message || 'Error al bloquear usuario');
    }
  }

  async onUpdated() {
    this.showEditModal = false;
    this.editingStaff = null;
    await this.loadStaff();
  }

  async logout() {
    try {
      await this.auth.logout();
    } catch {
      window.location.href = '/';
    }
  }
}
