import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConsultationDashboardMetrics } from '../../core/models/consultation-dashboard-metrics.model';
import { DonutChartComponent, DonutSlice } from './donut-chart.component';
import { BarChartComponent, BarChartItem } from './bar-chart.component';

/* ================================
   TIPOS
================================ */
export type ConsultationStatus = 'IN_PROGRESS' | 'CLOSED';

@Component({
  standalone: true,
  selector: 'app-consultation-metrics',
  imports: [
    CommonModule,
    DonutChartComponent,
    BarChartComponent
  ],
  template: `
    <section *ngIf="metrics"
             class="grid grid-cols-1 lg:grid-cols-4 gap-6">

      <!-- ================= DONUT ================= -->
      <div class="bg-white rounded-2xl border p-6 shadow">
        <h3 class="font-semibold mb-1">
          {{ periodTitle }}
        </h3>

        <p class="text-xs text-slate-500 mb-3">
          Distribución de consultas según su estado clínico
        </p>

        <app-donut-chart
          [slices]="donutSlices"
          (sliceClick)="onDonutClick($event)">
        </app-donut-chart>

        <p class="mt-3 text-xs text-slate-500">
          Haz clic en un estado para ver las consultas correspondientes
        </p>
      </div>

      <!-- ================= HISTÓRICO ================= -->
      <div class="bg-white rounded-2xl border p-6 shadow">
        <h3 class="font-semibold mb-1">
          {{ historicalTitle }}
        </h3>

        <p class="text-xs text-slate-500 mb-3">
          Consultas finalizadas por día dentro del período seleccionado
        </p>

        <app-bar-chart
          [items]="historicalBars"
          (barClick)="onDateSelected($event)">
        </app-bar-chart>
      </div>

      <!-- ================= TIEMPOS ================= -->
      <div *ngIf="metrics.time"
           class="bg-white rounded-2xl border p-6 shadow">
        <h3 class="font-semibold mb-3">
          Tiempos de consulta
        </h3>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Duración promedio</span>
            <span class="font-semibold">
              {{ metrics.time.averageDurationMinutes | number:'1.0-0' }} min
            </span>
          </div>

          <div class="flex justify-between">
            <span>Consulta más larga registrada</span>
            <span class="font-semibold">
              {{ metrics.time.longestDurationMinutes }} min
            </span>
          </div>

          <div class="flex justify-between">
            <span>Consultas largas (&gt; 60 min)</span>
            <span class="font-semibold">
              {{ metrics.time.longConsultationsCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- ================= ALERTAS ================= -->
      <div class="bg-white rounded-2xl border p-6 shadow">
        <h3 class="font-semibold mb-3">
          Alertas clínicas
        </h3>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Abiertas +2 horas</span>
            <span class="font-semibold text-amber-600">
              {{ metrics.risk.openOver2Hours }}
            </span>
          </div>

          <div class="flex justify-between">
            <span>Abiertas +24 horas</span>
            <span class="font-semibold text-rose-600">
              {{ metrics.risk.openOver1Day }}
            </span>
          </div>
        </div>
      </div>

    </section>
  `
})

export class ConsultationMetricsComponent {

  @Input() metrics!: ConsultationDashboardMetrics;
  @Input() period: 'TODAY' | 'WEEK' | 'MONTH' = 'TODAY';

  @Output() statusSelected = new EventEmitter<ConsultationStatus>();
  @Output() dateSelected = new EventEmitter<BarChartItem>();

  /* ================================
     TÍTULOS
  ================================ */
  get periodTitle(): string {
    switch (this.period) {
      case 'WEEK': return 'Consultas de los últimos 7 días';
      case 'MONTH': return 'Consultas de los últimos 30 días';
      default: return 'Consultas de hoy';
    }
  }

  get historicalTitle(): string {
    switch (this.period) {
      case 'WEEK': return 'Consultas finalizadas (últimos 7 días)';
      case 'MONTH': return 'Consultas finalizadas (últimos 30 días)';
      default: return 'Consultas finalizadas hoy';
    }
  }

  /* ================================
     DONUT DATA
  ================================ */
  get donutSlices(): DonutSlice[] {
    const t = this.metrics.today;

    return [
      {
        label: 'En curso',
        value: t.inProgress,
        color: '#3b82f6'
      },
      {
        label: 'Finalizadas',
        value: t.closed,
        color: '#10b981'
      }
    ];
  }

  /* ================================
     HISTÓRICO
  ================================ */
  get historicalBars(): BarChartItem[] {
    return Object.entries(this.metrics.historical.closedByDate)
      .map(([date, value]) => ({
        label: date,
        value
      }));
  }

  /* ================================
     EVENTS
  ================================ */
  onDonutClick(label: string): void {
    if (label === 'En curso') {
      this.statusSelected.emit('IN_PROGRESS');
    }
    if (label === 'Finalizadas') {
      this.statusSelected.emit('CLOSED');
    }
  }


  onDateSelected(item: BarChartItem): void {
    console.log('[CONSULTATION_METRICS] barClick recibido', item);
    this.dateSelected.emit(item);
  }
}
