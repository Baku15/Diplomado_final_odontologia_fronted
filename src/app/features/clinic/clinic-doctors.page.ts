import { Component, OnInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ClinicStaffApi, StaffView } from './clinic-staff.api';
import { AuthService } from '../../core/services/auth.service';
import { CreateStaffModalComponent } from './create-staff-modal.component';
import { EditStaffModalComponent } from './edit-staff-modal.component';

@Component({
  standalone: true,
  selector: 'app-clinic-doctors-page',
  imports: [CommonModule, CreateStaffModalComponent, EditStaffModalComponent],
  template: `
    <div class="max-w-6xl mx-auto">

      <!-- HEADER -->
      <header class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">
            Lista de doctores
          </h1>
          <p class="text-sm text-slate-600">
            Gestiona los odontólogos que atienden en tu clínica.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            (click)="openDoctorModal()"
            class="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + Agregar odontólogo
          </button>
        </div>
      </header>

      <!-- ESTADO DE CARGA -->
      <div *ngIf="loading" class="text-sm text-slate-500 mb-4">
        Cargando doctores...
      </div>

      <div *ngIf="!loading && doctors.length === 0" class="text-sm text-slate-500 mb-4">
        Todavía no hay doctores registrados en la clínica.
      </div>

      <!-- LISTA DE DOCTORES -->
      <div class="space-y-3">
        <div
          *ngFor="let d of doctors"
          class="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between"
        >
          <div>
            <div class="font-medium text-slate-900">
              {{ d.nombre }} {{ d.apellido }}
              <span class="text-xs text-slate-500">({{ d.username }})</span>
            </div>
            <div class="text-xs text-slate-500">
              {{ d.email }} · {{ d.phone || 'Sin teléfono' }}
            </div>
            <div class="text-[11px] text-slate-500 mt-1">
              Roles:
              <span *ngFor="let r of d.roles; let i = index">
                {{ r }}<span *ngIf="i < d.roles.length - 1">, </span>
              </span>
            </div>
          </div>

          <!-- ACCIONES -->
          <div class="flex flex-col items-end gap-2">
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              [ngClass]="{
                'bg-emerald-50 text-emerald-700 border border-emerald-200': d.status === 'ACTIVE',
                'bg-amber-50 text-amber-700 border border-amber-200': d.status !== 'ACTIVE'
              }"
            >
              {{ d.status }}
            </span>

            <div class="flex gap-2 mt-2">
              <button
                (click)="openEditModal(d)"
                class="px-2 py-1 rounded border text-xs hover:bg-slate-100"
              >
                Editar
              </button>

              <button
                *ngIf="d.status !== 'ACTIVE'"
                (click)="activate(d)"
                class="px-2 py-1 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700"
              >
                Activar
              </button>

              <button
                *ngIf="d.status === 'ACTIVE'"
                (click)="deactivate(d)"
                class="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODALES -->
      <app-create-staff-modal
        [visible]="showDoctorModal"
        [clinicId]="clinicId"
        mode="doctor"
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
    </div>
  `,
})
export class ClinicDoctorsPage implements OnInit {
  private api = inject(ClinicStaffApi);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  // 🟡 Para saber si estamos en navegador o SSR
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  clinicId: number | null = null;
  loading = false;

  doctors: StaffView[] = [];

  showDoctorModal = false;
  showEditModal = false;
  editingStaff: StaffView | null = null;

  async ngOnInit(): Promise<void> {
    // 🟡 En SSR NO hacemos nada de llamadas HTTP
    if (!this.isBrowser) {
      console.log('ClinicDoctorsPage (SSR): saltando carga de datos');
      return;
    }

    try {
      const d: any = await firstValueFrom(this.auth.userData$);

      let cid: number | null = null;

      // 1) Primero intentamos clinic_id en el token
      if (d?.clinic_id) {
        cid = Number(d.clinic_id);
      } else {
        // 2) Fallback: /api/me
        try {
          const me: any = await firstValueFrom(
            this.http.get('/api/me', { withCredentials: true })
          );
          if (me?.clinicId) {
            cid = Number(me.clinicId);
          }
        } catch (err) {
          console.error('ClinicDoctorsPage: error llamando a /api/me', err);
        }
      }

      if (cid && Number.isFinite(cid)) {
        this.clinicId = cid;
        await this.loadDoctors();
      } else {
        console.warn(
          'ClinicDoctorsPage: no se pudo resolver clinicId; no se listarán doctores.'
        );
      }
    } catch (err) {
      console.error('ClinicDoctorsPage: error en ngOnInit', err);
    }
  }

  async loadDoctors() {
    if (!this.clinicId) return;
    this.loading = true;

    this.api.listStaff(this.clinicId, 0, 50).subscribe({
      next: (p) => {
        const content = p.content ?? [];
        // 👇 solo doctores (rol dentist)
        this.doctors = content.filter((s) =>
          (s.roles || []).some(
            (r) => r === 'ROLE_DENTIST' || r === 'DENTIST'
          )
        );
        this.loading = false;
      },
      error: (e) => {
        console.error('loadDoctors error', e);
        this.loading = false;
      },
    });
  }

  openDoctorModal() {
    this.showDoctorModal = true;
  }

  onModalClosed() {
    this.showDoctorModal = false;
  }

  openEditModal(d: StaffView) {
    this.editingStaff = d;
    this.showEditModal = true;
  }

  async onCreated() {
    this.showDoctorModal = false;
    await this.loadDoctors();
  }

  async onUpdated() {
    this.showEditModal = false;
    this.editingStaff = null;
    await this.loadDoctors();
  }

  async activate(d: StaffView) {
    if (!this.clinicId) return;
    try {
      await firstValueFrom(this.api.activateStaff(this.clinicId, d.id));
      alert('Doctor activado');
      await this.loadDoctors();
    } catch (e: any) {
      console.error('activate error', e);
      alert(e?.error?.message || 'Error al activar doctor');
    }
  }

  async deactivate(d: StaffView) {
    if (!this.clinicId) return;
    try {
      await firstValueFrom(this.api.deactivateStaff(this.clinicId, d.id));
      alert('Doctor bloqueado');
      await this.loadDoctors();
    } catch (e: any) {
      console.error('deactivate error', e);
      alert(e?.error?.message || 'Error al bloquear doctor');
    }
  }
}
