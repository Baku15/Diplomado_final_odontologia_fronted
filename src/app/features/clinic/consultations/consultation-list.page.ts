// src/app/features/clinic/consultations/consultation-list.page.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { ClinicalConsultationDto } from '../../../core/models/consultation.model';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  standalone: true,
  selector: 'app-consultation-list-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-6 py-8 bg-slate-50 min-h-screen">

      <!-- Header -->

      <!-- Banner de mensaje contextual -->
      <div *ngIf="flashMessage"
           class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"/>
            </svg>
          </div>

          <div class="flex-1">
            <div class="font-semibold text-emerald-800">
              {{ flashMessage.title }}
            </div>
            <div class="text-sm text-emerald-700 mt-1">
              {{ flashMessage.message }}
            </div>
          </div>

          <button
            class="text-emerald-600 hover:text-emerald-800"
            (click)="flashMessage = null">
            ✕
          </button>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">
            Consultas del paciente
          </h1>
          <p class="text-sm text-slate-500">
            Gestión y seguimiento clínico
          </p>
        </div>

        <!-- Nueva consulta SOLO si no hay ACTIVE -->
        <button
          *ngIf="!activeConsultation"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 text-white font-medium shadow-sm hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
          (click)="startConsultation()"
        >
          <span class="text-lg leading-none">＋</span>
          Nueva consulta
        </button>
      </div>

      <!-- Consulta ACTIVA -->
      <div
        *ngIf="activeConsultation"
        class="mb-8 rounded-xl border border-teal-200 bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex h-2.5 w-2.5 rounded-full bg-teal-600"></span>
              <h2 class="font-semibold text-slate-800">
                Consulta activa
              </h2>
            </div>
            <p class="text-sm text-slate-600">
              Iniciada el {{ activeConsultation.startedAt | date:'medium' }}
            </p>
          </div>

          <div class="flex gap-3">
            <button
              class="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-700"
              (click)="continueConsultation()"
            >
              Continuar consulta
            </button>

            <button
              class="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-slate-700 font-medium border border-slate-300 hover:bg-slate-200"
              (click)="goBackToPatient()"
            >
              Regresar
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        *ngIf="!consultations.length"
        class="rounded-xl border border-dashed border-slate-300 p-10 text-center bg-white"
      >
        <div class="text-lg font-medium text-slate-700 mb-1">
          Sin consultas registradas
        </div>
        <p class="text-sm text-slate-500">
          Inicia una nueva consulta para este paciente
        </p>
      </div>

      <!-- Tabla -->
      <div
        *ngIf="consultations.length"
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <table class="w-full text-sm">
          <thead class="bg-slate-100 text-slate-600">
          <tr>
            <th class="px-4 py-3 text-left font-medium">ID</th>
            <th class="px-4 py-3 text-left font-medium">Estado</th>
            <th class="px-4 py-3 text-left font-medium">Inicio</th>
            <th class="px-4 py-3 text-left font-medium">Fin</th>
            <th class="px-4 py-3 text-right font-medium">Acciones</th>
          </tr>
          </thead>

          <tbody class="divide-y">
          <tr
            *ngFor="let c of consultations"
            class="hover:bg-slate-50 transition"
          >
            <td class="px-4 py-3 font-mono text-slate-700">
              #{{ c.id }}
            </td>

            <!-- Estado -->
            <td class="px-4 py-3">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  [ngClass]="{
                    'bg-teal-100 text-teal-800': c.status === 'ACTIVE',
                    'bg-orange-100 text-orange-800': c.status === 'IN_PROGRESS',
                    'bg-slate-200 text-slate-700': c.status === 'CLOSED'
                  }"
                >
                  {{ statusLabel(c.status) }}
                </span>
            </td>

            <td class="px-4 py-3 text-slate-600">
              {{ c.startedAt | date:'short' }}
            </td>

            <td class="px-4 py-3 text-slate-600">
              {{ c.endedAt ? (c.endedAt | date:'short') : '—' }}
            </td>

            <!-- Acciones -->
            <td class="px-4 py-3 text-right">

              <!-- ACTIVE -->
              <button
                *ngIf="c.status === 'ACTIVE'"
                class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium
                         bg-teal-600 text-white hover:bg-teal-700"
                (click)="continueConsultation()"
              >
                Continuar
              </button>

              <!-- IN_PROGRESS -->
              <button
                *ngIf="c.status === 'IN_PROGRESS'"
                class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium
                         bg-orange-100 text-orange-800 hover:bg-orange-200"
                [routerLink]="['./', c.id]"
              >
                Ver sesión
              </button>

              <!-- CLOSED -->
              <button
                *ngIf="c.status === 'CLOSED'"
                class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium
                         bg-slate-100 text-slate-700 hover:bg-slate-200"
                [routerLink]="['./', c.id]"
              >
                Ver historial
              </button>

            </td>
          </tr>
          </tbody>
        </table>
      </div>

    </div>
  `,
})
export class ConsultationListPage implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultationService = inject(ConsultationService);
  private patientService = inject(PatientService);

  clinicId!: number;
  patientId!: number;

  consultations: ClinicalConsultationDto[] = [];
  activeConsultation: ClinicalConsultationDto | null = null;

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.flashMessage = nav?.extras?.state?.['flashMessage'] || null;
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.patientId) {
      throw new Error('Paciente inválido');
    }

    const clinicId = await this.patientService.getClinicIdForRoutes();
    if (clinicId === null) {
      throw new Error('Clínica no encontrada');
    }
    this.clinicId = clinicId;

// 🔥 ACTIVE o IN_PROGRESS = consulta abierta
    this.activeConsultation =
      await this.consultationService.getActiveOrInProgress(
        this.clinicId,
        this.patientId
      );


    this.consultations =
      await this.consultationService.listConsultations(
        this.clinicId,
        this.patientId
      );
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'IN_PROGRESS':
        return 'Tratamiento en curso';
      case 'CLOSED':
        return 'Finalizada';
      default:
        return status;
    }
  }

  startConsultation() {
    // ⚠️ NO se crea consulta aquí
    // La consulta se creará cuando haya acción clínica real en el odontograma
    this.router.navigate([
      '/dashboard/pacientes',
      this.patientId,
      'odontograma',
    ]);
  }


  continueConsultation() {
    this.router.navigate([
      '/dashboard/pacientes',
      this.patientId,
      'odontograma',
    ]);
  }

  goBackToPatient() {
    this.router.navigate([
      '/dashboard/pacientes',
      this.patientId,
    ]);
  }

  flashMessage: {
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null = null;
}
