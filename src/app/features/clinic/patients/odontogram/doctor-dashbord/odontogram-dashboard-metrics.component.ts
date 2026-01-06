import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorDashboardMetrics } from '../../../../../core/models/doctor-dashboard-metrics.model';
import { ToothInterventionDetail } from '../../../../../core/models/tooth-intervention-detail.model';
import { DoctorDashboardService } from '../../../../../core/services/doctor-dashboard.service';
import { TeethInterventionDetailModal } from './teeth-intervention-detail.modal';

@Component({
  standalone: true,
  selector: 'app-doctor-dashboard-metrics',
  imports: [
    CommonModule,
    TeethInterventionDetailModal
  ],
  template: `
    <section *ngIf="metrics"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      <!-- ================= CONSULTAS ================= -->
      <div class="metric-card accent-blue">
        <div class="header">
          <span class="dot bg-blue-500"></span>
          <span class="title">Consultas con actividad clínica</span>
        </div>
        <div class="value">{{ metrics.totalConsultationsWithActivity }}</div>
        <div class="hint">
          Consultas donde se registraron procedimientos en el odontograma
        </div>
      </div>

      <!-- ================= PROCEDIMIENTOS ================= -->
      <div class="metric-card accent-indigo">
        <div class="header">
          <span class="dot bg-indigo-500"></span>
          <span class="title">Procedimientos realizados</span>
        </div>
        <div class="value">{{ metrics.totalProcedures }}</div>
        <div class="hint">
          Total de tratamientos registrados en el período
        </div>
      </div>

      <!-- ================= COMPLETADOS ================= -->
      <div class="metric-card accent-green">
        <div class="header">
          <span class="dot bg-green-500"></span>
          <span class="title">Tratamientos finalizados</span>
        </div>
        <div class="value">{{ metrics.completedProcedures }}</div>
        <div class="hint">
          Procedimientos cerrados clínicamente
        </div>
      </div>

      <!-- ================= PENDIENTES ================= -->
      <div class="metric-card accent-amber">
        <div class="header">
          <span class="dot bg-amber-500"></span>
          <span class="title">Tratamientos pendientes</span>
        </div>
        <div class="value">{{ metrics.pendingProcedures }}</div>
        <div class="hint">
          Procedimientos iniciados y aún no concluidos
        </div>
      </div>

      <!-- ================= DIENTES INTERVENIDOS ================= -->
      <div class="metric-card accent-purple relative">
        <div class="header">
          <span class="dot bg-purple-500"></span>
          <span class="title">Dientes intervenidos</span>
        </div>

        <div class="value">{{ metrics.totalTeethIntervened }}</div>

        <div class="hint mb-2">
          Piezas dentales con al menos una intervención clínica
        </div>

        <button
          *ngIf="metrics.totalTeethIntervened > 0"
          class="detail-btn"
          (click)="openDetails()">
          Ver detalle
        </button>
      </div>

      <!-- ================= ALTA CARGA ================= -->
      <div class="metric-card accent-red">
        <div class="header">
          <span class="dot bg-red-500"></span>
          <span class="title">Alta carga clínica</span>
        </div>
        <div class="value">{{ metrics.teethWithHighClinicalLoad }}</div>
        <div class="hint">
          Dientes con múltiples procedimientos asociados
        </div>
      </div>

      <!-- ================= EVIDENCIA ================= -->
      <div class="metric-card accent-teal">
        <div class="header">
          <span class="dot bg-teal-500"></span>
          <span class="title">Evidencia clínica documentada</span>
        </div>
        <div class="value">{{ metrics.teethWithImages }}</div>
        <div class="hint">
          Piezas con imágenes o archivos clínicos adjuntos
        </div>
      </div>

    </section>

    <!-- ================= MODAL DETALLE ================= -->
    <app-teeth-intervention-detail-modal
      *ngIf="detailsOpen"
      [details]="details"
      (closed)="detailsOpen = false">
    </app-teeth-intervention-detail-modal>
  `,
  styles: [`
    .metric-card {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      padding: 18px;
      box-shadow: 0 4px 10px rgba(15,23,42,0.05);
      transition: transform .15s ease, box-shadow .15s ease;
      position: relative;
      overflow: hidden;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(15,23,42,0.08);
    }

    .metric-card::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 4px;
    }

    .accent-blue::before    { background: #3b82f6; }
    .accent-indigo::before { background: #6366f1; }
    .accent-green::before  { background: #22c55e; }
    .accent-amber::before  { background: #f59e0b; }
    .accent-purple::before { background: #a855f7; }
    .accent-red::before    { background: #ef4444; }
    .accent-teal::before   { background: #14b8a6; }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: #475569;
    }

    .value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin: 4px 0;
    }

    .hint {
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }

    .detail-btn {
      margin-top: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #7c3aed;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
    }

    .detail-btn:hover {
      text-decoration: underline;
    }
  `]
})
export class OdontogramDashboardMetricsComponent {

  @Input() metrics!: DoctorDashboardMetrics;
  @Input() from?: string;
  @Input() to?: string;

  detailsOpen = false;
  details: ToothInterventionDetail[] = [];

  constructor(
    private dashboardService: DoctorDashboardService
  ) {}

  async openDetails() {
    if (!this.from || !this.to) return;

    this.details =
      await this.dashboardService.getTeethInterventionDetail(
        this.from,
        this.to
      );

    this.detailsOpen = true;
  }

}
