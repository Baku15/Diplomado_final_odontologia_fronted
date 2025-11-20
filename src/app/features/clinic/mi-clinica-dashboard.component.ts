// src/app/features/clinic/mi-clinica-dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import { CurrentUserService } from '../../core/services/current-user.service';
import { ClinicStaffApi } from '../../core/services/clinic-staff.api';
import { DoctorProfileWizard } from './doctor-profile-wizard.component';
import { CreateDoctorForm } from './create-doctor-form.component';
import { CreateAssistantForm } from './create-assistant-form.component';
import {AuthService} from '../../core/services/auth.service';

@Component({
  selector: 'app-mi-clinica-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, RouterLink, DoctorProfileWizard, CreateDoctorForm, CreateAssistantForm],
  template: `
    <main class="max-w-6xl mx-auto p-6">
      <header class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Mi clínica</h1>
          <p class="text-sm text-slate-500 mt-1">Administra tu clínica, personal y horarios.</p>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="openWizard()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700">
            Completar perfil profesional
          </button>
          <a routerLink="/" class="px-4 py-2 border rounded-lg text-sm">Volver</a>
        </div>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-xl bg-white shadow-sm border">
          <h3 class="text-sm font-semibold text-slate-700 mb-2">Personal</h3>
          <p class="text-xs text-slate-500">Crea odontólogos y asistentes para tu clínica.</p>
          <div class="mt-4 flex gap-2">
            <button (click)="showCreateDoctor = true" class="px-3 py-2 bg-indigo-600 text-white rounded-md">Crear odontólogo</button>
            <button (click)="showCreateAssistant = true" class="px-3 py-2 border rounded-md">Crear asistente</button>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-white shadow-sm border">
          <h3 class="text-sm font-semibold text-slate-700 mb-2">Citas</h3>
          <p class="text-xs text-slate-500">Verás un calendario aquí (próximamente).</p>
        </div>

        <div class="p-4 rounded-xl bg-white shadow-sm border">
          <h3 class="text-sm font-semibold text-slate-700 mb-2">Configuración</h3>
          <p class="text-xs text-slate-500">Permisos, horarios, consultorios, datos fiscales.</p>
        </div>
      </section>

      <!-- Modal: Crear odontólogo -->
      <div *ngIf="showCreateDoctor" class="fixed inset-0 z-50 backdrop-blur-sm flex items-start justify-center pt-20">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
          <div class="flex justify-end">
            <button class="text-slate-400" (click)="showCreateDoctor = false" aria-label="Cerrar">✕</button>
          </div>
          <app-create-doctor-form
            [clinicId]="clinicId"
            (created)="onCreated($event)"
            (cancel)="showCreateDoctor = false">
          </app-create-doctor-form>
        </div>
      </div>

      <!-- Modal: Crear asistente -->
      <div *ngIf="showCreateAssistant" class="fixed inset-0 z-50 backdrop-blur-sm flex items-start justify-center pt-20">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
          <div class="flex justify-end">
            <button class="text-slate-400" (click)="showCreateAssistant = false" aria-label="Cerrar">✕</button>
          </div>
          <app-create-assistant-form
            [clinicId]="clinicId"
            (created)="onCreated($event)"
            (cancel)="showCreateAssistant = false">
          </app-create-assistant-form>
        </div>
      </div>

      <!-- Wizard perfil odontólogo -->
      <app-doctor-profile-wizard *ngIf="wizardOpen" (close)="closeWizard()"></app-doctor-profile-wizard>
    </main>
  `,
})
export class MiClinicaDashboardComponent implements OnInit {
  private cu = inject(CurrentUserService);
  private api = inject(ClinicStaffApi);
  private auth = inject(AuthService);
  private router = inject(Router);

  clinicId: number | null = null;

  showCreateDoctor = false;
  showCreateAssistant = false;
  wizardOpen = false;

  constructor() {
    // no hacemos async en constructor
  }

  ngOnInit(): void {
    this.init();
  }

  // init robusto: obtiene clinicId (si existe) de los claims del token
  private async init() {
    try {
      const cid = await this.cu.getClinicId();
      if (cid !== null && typeof cid === 'number' && Number.isFinite(cid)) {
        this.clinicId = cid;
      } else {
        this.clinicId = null;
        console.warn('MiClinicaDashboard: clinic_id no encontrado en token.');
      }
    } catch (err) {
      console.error('MiClinicaDashboard: error leyendo clinicId', err);
      this.clinicId = null;
    }
  }

  openWizard() {
    this.wizardOpen = true;
  }

  closeWizard() {
    this.wizardOpen = false;
  }

  onCreated(event: unknown) {
    // Evento recibido cuando se creó doctor/assistant.
    // Puedes mejorar: refrescar listas, mostrar toast, etc.
    this.showCreateDoctor = false;
    this.showCreateAssistant = false;
    // ejemplo simple: recargar datos si necesitas
    // this.loadStaff();
    window.setTimeout(() => window.alert('Creación completada'), 50);
  }

  async logout() {
    try {
      await this.auth.logout();
      // auth.logout ya navega a '/', pero por si acaso:
      // this.router.navigateByUrl('/');
    } catch (e) {
      console.error('Logout error', e);
      // fallback forzado
      window.location.href = '/';
    }
  }
}

