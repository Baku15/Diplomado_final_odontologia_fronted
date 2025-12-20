import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { ClinicalConsultationDto } from '../../../core/models/consultation.model';
import { PatientService } from '../../../core/services/patient.service';
import { CloseConsultationModal } from './close-consultation.modal';
import { DentalProcedureDto } from '../../../core/models/odontogram.model';

@Component({
  standalone: true,
  selector: 'app-consultation-detail-page',
  imports: [CommonModule, CloseConsultationModal],
  template: `
    <div class="min-h-screen bg-slate-50 py-8" *ngIf="consultation">
      <div class="max-w-5xl mx-auto px-6">

        <!-- Header -->
        <div class="flex justify-between items-start mb-8">
          <div>
            <h1 class="text-2xl font-semibold text-slate-800">
              Consulta clínica #{{ consultation.id }}
            </h1>
            <p class="text-sm text-slate-500">
              Detalle completo de la atención
            </p>
          </div>

          <button
            class="rounded-lg bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
            (click)="goBackToList()"
          >
            ← Volver
          </button>
        </div>

        <!-- Estado -->
        <div class="bg-white border rounded-xl p-6 mb-8 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <div class="text-xs text-slate-500 uppercase">Estado</div>
              <span
                class="inline-flex mt-1 rounded-full px-3 py-1 text-sm font-medium"
                [ngClass]="statusClass(consultation.status)"
              >
                {{ statusLabel(consultation.status) }}
              </span>
            </div>

            <div>
              <div class="text-xs text-slate-500 uppercase">Inicio</div>
              <div class="font-medium">
                {{ consultation.startedAt | date:'medium' }}
              </div>
            </div>

            <div *ngIf="consultation.endedAt">
              <div class="text-xs text-slate-500 uppercase">Fin</div>
              <div class="font-medium">
                {{ consultation.endedAt | date:'medium' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Métricas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          <div class="bg-white border rounded-xl p-5 shadow-sm">
            <div class="text-xs text-slate-500 uppercase">Procedimientos</div>
            <div class="text-2xl font-semibold mt-1">
              {{ procedures.length }}
            </div>
          </div>

          <div class="bg-white border rounded-xl p-5 shadow-sm">
            <div class="text-xs text-slate-500 uppercase">Duración</div>
            <div class="text-2xl font-semibold mt-1">
              {{ durationMinutes }} min
            </div>
          </div>

          <!-- SOLO si ACTIVE -->
          <div
            *ngIf="consultation.status === 'ACTIVE'"
            class="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-center justify-center"
          >
            <button
              class="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700"
              (click)="showCloseModal = true"
            >
              Finalizar consulta
            </button>
          </div>

        </div>

        <!-- Aviso + acción IN_PROGRESS -->
        <div
          *ngIf="consultation.status === 'IN_PROGRESS'"
          class="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-5
         flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div class="text-orange-800">
            ⚠️ El tratamiento continúa. Esta consulta forma parte de un proceso clínico en curso.
          </div>

          <button
            class="inline-flex items-center gap-2 rounded-lg
           bg-orange-600 px-4 py-2 text-white font-medium
           hover:bg-orange-700"
            (click)="continueTreatment()"
          >
            Continuar tratamiento
          </button>
        </div>


        <!-- Procedimientos -->
        <div>
          <h2 class="text-lg font-semibold mb-4">Procedimientos realizados</h2>

          <div *ngIf="procedures.length === 0"
               class="bg-white border-dashed border rounded-xl p-8 text-center text-slate-500">
            No se registraron procedimientos
          </div>

          <ul *ngIf="procedures.length" class="space-y-3">
            <li *ngFor="let p of procedures"
                class="bg-white border rounded-xl p-4 shadow-sm">
              <div class="font-medium">
                {{ p.type }} · Diente {{ p.toothNumber ?? 'General' }}
              </div>
              <div class="text-sm text-slate-600">
                {{ p.description || 'Sin descripción clínica' }}
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>

    <!-- Modal -->
    <app-close-consultation-modal
      *ngIf="showCloseModal"
      (cancel)="showCloseModal = false"
      (submit)="onCloseConsultation($event)"
    />
  `
})
export class ConsultationDetailPage implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultationService = inject(ConsultationService);
  private patientService = inject(PatientService);

  consultation!: ClinicalConsultationDto;
  procedures: DentalProcedureDto[] = [];

  clinicId!: number;
  patientId!: number;
  consultationId!: number;

  durationMinutes = 0;
  showCloseModal = false;

  async ngOnInit() {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.consultationId = Number(this.route.snapshot.paramMap.get('consultationId'));

    const clinicId = await this.patientService.getClinicIdForRoutes();

// 🛡️ SSR-safe: en render servidor puede no existir clínica
    if (clinicId === null) {
      console.warn('[SSR] Clínica no detectada aún, se resolverá en cliente');
      return;
    }

    this.clinicId = clinicId;


    this.consultation = await this.consultationService.getById(
      this.clinicId,
      this.patientId,
      this.consultationId
    );

    this.procedures = await this.consultationService.listProcedures(
      this.clinicId,
      this.patientId,
      this.consultationId
    );

    this.calculateDuration();
  }


  calculateDuration() {
    if (!this.consultation.endedAt) return;
    const start = new Date(this.consultation.startedAt).getTime();
    const end = new Date(this.consultation.endedAt).getTime();
    this.durationMinutes = Math.round((end - start) / 60000);
  }

  async onCloseConsultation(req: {
    summary?: string;
    clinicalNotes?: string;
    requireNextAppointment: boolean;
  }) {

    this.showCloseModal = false;

    // 🔥 SIEMPRE enviar al backend
    await this.consultationService.closeConsultation(
      this.clinicId,
      this.patientId,
      this.consultation.id,
      req
    );

    // 🅱️ continuar tratamiento → ir a agenda
    if (req.requireNextAppointment) {
      this.router.navigate(
        ['/dashboard/citas'],
        {
          queryParams: {
            patientId: this.patientId,
            consultationId: this.consultation.id,
            doctorId: this.consultation.dentistId
          }
        }
      );
      return;
    }

    // 🅰️ cierre definitivo
    this.router.navigate([
      '/dashboard/pacientes',
      this.patientId
    ]);
  }



  goBackToList() {
    this.router.navigate([
      '/dashboard/pacientes',
      this.patientId,
      'consultas'
    ]);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'IN_PROGRESS': return 'Tratamiento en curso';
      case 'CLOSED': return 'Finalizada';
      default: return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-teal-100 text-teal-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'CLOSED': return 'bg-slate-200 text-slate-700';
      default: return '';
    }
  }

  continueTreatment() {
    this.router.navigate([
      '/dashboard/pacientes',
      this.patientId,
      'odontograma'
    ]);
  }

}
