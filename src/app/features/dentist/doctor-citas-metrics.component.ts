import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartComponent, BarChartItem } from './bar-chart.component';
import { DonutChartComponent } from './donut-chart.component';
import { AppointmentDashboardMetrics } from '../../core/models/appointment-dashboard-metrics.model';

/* ================================
   TIPOS
================================ */
export type MetricPeriod =
  | 'TODAY'
  | 'WEEK'
  | 'MONTH';

type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

interface DonutSliceUI {
  label: string;                 // Texto visible
  value: number;
  color: string;
  status: AppointmentStatus;     // Código backend
}

@Component({
  standalone: true,
  selector: 'app-doctor-citas-metrics',
  imports: [
    CommonModule,
    DonutChartComponent,
    BarChartComponent
  ],
  template: `
    <section *ngIf="metrics"
             class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ================= DONUT ================= -->
      <div class="bg-white rounded-2xl border p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-900 mb-1">
          {{ periodLabel }}
        </h3>

        <p class="text-xs text-slate-500 mb-4">
          Resumen general de las citas en el período seleccionado
        </p>

        <app-donut-chart
          [slices]="donutSlices"
          (sliceClick)="onSliceClick($event)">
        </app-donut-chart>

        <p class="mt-3 text-xs text-slate-500">
          Haz clic en un estado para ver las citas correspondientes
        </p>
      </div>

      <!-- ================= HISTÓRICO ================= -->
      <div class="bg-white rounded-2xl border p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-900 mb-1">
          Atenciones realizadas por día
        </h3>

        <p class="text-xs text-slate-500 mb-4">
          Citas <strong>completadas</strong> (datos históricos)
        </p>

        <app-bar-chart
          [items]="historicalBars"
          (barClick)="onDateSelected($event)">
        </app-bar-chart>

        <p class="mt-3 text-xs text-slate-400">
          ℹ️ Solo se muestran días con atención registrada.
        </p>
      </div>

      <!-- ================= FUTURO ================= -->
      <div class="bg-white rounded-2xl border p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-900 mb-1">
          Próximas citas
        </h3>

        <p class="text-xs text-slate-500 mb-4">
          Carga de trabajo futura
        </p>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Próxima semana</span>
            <span class="font-semibold">
              {{ metrics.future.nextWeekScheduled }}
            </span>
          </div>

          <div class="flex justify-between">
            <span>Próximo mes</span>
            <span class="font-semibold">
              {{ metrics.future.nextMonthScheduled }}
            </span>
          </div>
        </div>
      </div>

    </section>
  `
})
export class DoctorCitasMetricsComponent {

  @Input() metrics!: AppointmentDashboardMetrics;
  @Input() period!: MetricPeriod;

  @Output() statusSelected = new EventEmitter<AppointmentStatus>();
  @Output() dateSelected = new EventEmitter<string>();

  /* ================================
     LABEL PERIODO
  ================================ */
  get periodLabel(): string {
    switch (this.period) {
      case 'WEEK': return 'Semana';
      case 'MONTH': return 'Mes';
      default: return 'Hoy';
    }
  }

  /* ================================
     DONUT (UI + BACKEND)
  ================================ */
  private readonly slices: DonutSliceUI[] = [
    { label: 'Programadas', color: '#3b82f6', status: 'SCHEDULED', value: 0 },
    { label: 'Completadas', color: '#10b981', status: 'COMPLETED', value: 0 },
    { label: 'Canceladas', color: '#ef4444', status: 'CANCELLED', value: 0 },
    { label: 'No asistieron', color: '#f59e0b', status: 'NO_SHOW', value: 0 }
  ];

  get donutSlices(): DonutSliceUI[] {
    const t = this.metrics.today;

    return this.slices.map(s => ({
      ...s,
      value:
        s.status === 'SCHEDULED' ? t.scheduled :
          s.status === 'COMPLETED' ? t.completed :
            s.status === 'CANCELLED' ? t.cancelled :
              t.noShow
    }));
  }

  /* ================================
     HISTÓRICO
  ================================ */
  get historicalBars(): BarChartItem[] {
    return Object.entries(this.metrics.historical.completedByDate)
      .map(([date, value]) => ({
        label: date,
        value
      }));
  }

  /* ================================
     EVENTS
  ================================ */
  onSliceClick(label: string): void {
    const slice = this.slices.find(s => s.label === label);
    if (slice) {
      this.statusSelected.emit(slice.status); // 👈 backend-safe
    }
  }

  onDateSelected(item: BarChartItem): void {
    this.dateSelected.emit(item.label);
  }
}
