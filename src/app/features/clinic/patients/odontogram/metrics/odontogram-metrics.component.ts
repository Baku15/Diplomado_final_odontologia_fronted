import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DentalChartDto } from '../../../../../core/models/odontogram.model';
import { DonutChartComponent, DonutSlice } from '../../../../dentist/donut-chart.component';
import { BarChartComponent, BarChartItem } from '../../../../dentist/bar-chart.component';

@Component({
  standalone: true,
  selector: 'app-odontogram-metrics',
  imports: [CommonModule, DonutChartComponent, BarChartComponent],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- DONUT: ESTADO DE LOS DIENTES -->
      <div class="bg-white rounded-2xl border p-6 shadow">
        <h3 class="text-sm font-semibold mb-1">
          Estado de los dientes
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Distribución clínica del odontograma
        </p>

        <app-donut-chart
          [slices]="toothStatusSlices">
        </app-donut-chart>
      </div>

      <!-- BARRAS: PROCEDIMIENTOS POR DIENTE -->
      <div class="bg-white rounded-2xl border p-6 shadow">
        <h3 class="text-sm font-semibold mb-1">
          Procedimientos por diente
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Dientes con mayor carga clínica
        </p>

        <app-bar-chart
          *ngIf="proceduresByTooth.length > 0"
          [items]="proceduresByTooth">
        </app-bar-chart>

        <p *ngIf="proceduresByTooth.length === 0"
           class="text-xs text-slate-400">
          No hay procedimientos registrados.
        </p>
      </div>

    </div>
  `
})
export class OdontogramMetricsComponent implements OnChanges {

  @Input() chart!: DentalChartDto;

  toothStatusSlices: DonutSlice[] = [];
  proceduresByTooth: BarChartItem[] = [];

  ngOnChanges(): void {
    if (!this.chart) return;

    this.buildToothStatus();
    this.buildProceduresByTooth();
  }

  /* ===============================
     DONUT: ESTADO DE DIENTES
  =============================== */
  private buildToothStatus(): void {

    const counters: Record<string, number> = {
      SANO: 0,
      TRATAMIENTO: 0,
      AUSENTE: 0,
      IMPLANTE: 0
    };

    for (const tooth of this.chart.teeth || []) {
      const status = tooth.toothStatus;

      if (status === 'SANO') counters['SANO']++;
      if (status === 'TRATAMIENTO') counters['TRATAMIENTO']++;
      if (status === 'AUSENTE' || status === 'EXTRACCION') counters['AUSENTE']++;
      if (status === 'IMPLANTE' || status === 'PROTESIS') counters['IMPLANTE']++;
    }

    this.toothStatusSlices = [
      {
        label: 'Sanos',
        value: counters['SANO'],
        color: '#22c55e' // verde (igual dashboard)
      },
      {
        label: 'En tratamiento',
        value: counters['TRATAMIENTO'],
        color: '#facc15' // amarillo
      },
      {
        label: 'Ausentes / extraídos',
        value: counters['AUSENTE'],
        color: '#fb7185' // rojo
      },
      {
        label: 'Implantes / prótesis',
        value: counters['IMPLANTE'],
        color: '#38bdf8' // azul
      }
    ];
  }

  /* ===============================
     BARRAS: PROCEDIMIENTOS POR DIENTE
  =============================== */
  private buildProceduresByTooth(): void {

    const map = new Map<number, number>();

    for (const p of this.chart.procedures || []) {
      if (!p.toothNumber) continue;
      map.set(p.toothNumber, (map.get(p.toothNumber) || 0) + 1);
    }

    this.proceduresByTooth = Array.from(map.entries())
      .map(([tooth, count]) => ({
        label: `Diente ${tooth}`,
        value: count
      }))
      .sort((a, b) => b.value - a.value);
  }
}
