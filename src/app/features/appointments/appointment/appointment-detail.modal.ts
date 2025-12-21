import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../core/models/appointment.model';
import { PatientService } from '../../../core/services/patient.service';
import { ConsultationService } from '../../../core/services/consultation.service';

@Component({
  standalone: true,
  selector: 'app-appointment-detail-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-5">

        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-slate-800">
            Detalle de la cita
          </h3>
          <button
            class="text-slate-500 hover:text-slate-700"
            (click)="close.emit()"
          >
            ✕
          </button>
        </div>

        <!-- 🔄 LOADING -->
        <div *ngIf="loading" class="text-sm text-slate-500 mb-4">
          Cargando información clínica…
        </div>

        <!-- ===================== -->
        <!-- DATOS CLÍNICOS -->
        <!-- ===================== -->
        <div *ngIf="!loading && appointment.consultationId" class="space-y-3 mb-4">

          <div class="flex justify-between">
            <span class="text-slate-500">Paciente</span>
            <span class="font-medium">
              {{ patientName || '—' }}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-slate-500">ID Paciente</span>
            <span class="font-medium">
              {{ appointment.patientId }}
            </span>
          </div>

          <div *ngIf="consultationSummary">
            <div class="text-slate-500 mb-1">Resumen clínico</div>
            <div class="bg-slate-50 border rounded p-2 text-slate-700 text-sm">
              {{ consultationSummary }}
            </div>
          </div>

        </div>

        <!-- ===================== -->
        <!-- INFO GENERAL -->
        <!-- ===================== -->
        <div class="space-y-3 text-sm">

          <div class="flex justify-between">
            <span class="text-slate-500">Fecha</span>
            <span class="font-medium">{{ appointment.date }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-slate-500">Horario</span>
            <span class="font-medium">
              {{ appointment.startTime }} – {{ appointment.endTime }}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-slate-500">Duración</span>
            <span class="font-medium">
              {{ appointment.durationMinutes }} min
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-slate-500">Estado</span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              [ngClass]="statusClass(appointment.status)"
            >
              {{ appointment.status }}
            </span>
          </div>

          <div *ngIf="appointment.reason">
            <div class="text-slate-500 mb-1">Motivo</div>
            <div class="bg-slate-50 border rounded p-2 text-slate-700">
              {{ appointment.reason }}
            </div>
          </div>

          <!-- CONTEXTO -->
          <div class="mt-4 p-3 rounded border text-xs"
               [ngClass]="appointment.consultationId
                 ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                 : 'bg-slate-50 border-slate-200 text-slate-600'">

            <ng-container *ngIf="appointment.consultationId; else directTpl">
              🦷 Cita asociada a una consulta clínica.
            </ng-container>

            <ng-template #directTpl>
              📞 Cita creada por llamada / paciente no registrado.
            </ng-template>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end mt-6">
          <button
            class="px-4 py-2 rounded-lg border text-sm hover:bg-slate-50"
            (click)="close.emit()"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  `
})
export class AppointmentDetailModal implements OnInit {

  @Input() appointment!: Appointment;
  @Output() close = new EventEmitter<void>();
  @Input() clinicId!: number;


  patientName?: string;
  consultationSummary?: string;
  loading = false;

  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);

  async ngOnInit() {

    // 👉 SOLO si es cita clínica
    if (!this.appointment.consultationId || !this.appointment.patientId) {
      return;
    }

    this.loading = true;

    try {
      const patient = await this.patientService.getPatient(
        this.appointment.patientId
      );

      this.patientName =
        `${patient.givenName} ${patient.familyName}`;

      const consultation = await this.consultationService.getById(
        this.clinicId,
        this.appointment.patientId,
        this.appointment.consultationId
      );

      this.consultationSummary =
        consultation.summary || 'Sin resumen clínico';


    } catch (err) {
      console.warn('No se pudo cargar detalle clínico', err);
    } finally {
      this.loading = false;
    }
  }

  statusClass(status: string) {
    return {
      'bg-emerald-100 text-emerald-700': status === 'COMPLETED',
      'bg-rose-100 text-rose-700': status === 'CANCELLED',
      'bg-amber-100 text-amber-700': status === 'NO_SHOW',
      'bg-slate-100 text-slate-700': true
    };
  }


}
