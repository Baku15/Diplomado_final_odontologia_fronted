// src/app/features/dentist/patients/patient-dashboard-metrics.component.ts
// 🔧 CORRECCIÓN COMPLETA (sliceClick devuelve string, NO objeto)

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDashboardMetrics } from '../../../core/models/patient-dashboard-metrics.model';
import { DonutChartComponent, DonutSlice } from '../donut-chart.component';
import { BarChartComponent, BarChartItem } from '../bar-chart.component';

@Component({
  standalone: true,
  selector: 'app-patient-dashboard-metrics',
  imports: [CommonModule, DonutChartComponent, BarChartComponent],
  templateUrl: './patient-dashboard-metrics.component.html'
})
export class PatientDashboardMetricsComponent {

  @Input() metrics!: PatientDashboardMetrics;
  @Output() segmentSelected = new EventEmitter<'NEW' | 'RECURRENT' | 'INACTIVE'>();

  private resolveColor(label: string): string {
    switch (label) {
      case 'Nuevos': return '#22c55e';
      case 'Recurrentes': return '#3b82f6';
      case 'Inactivos': return '#94a3b8';
      default: return '#94a3b8';
    }
  }

  get donutSlices(): DonutSlice[] {
    if (!this.metrics) return [];

    return [
      {
        label: 'Nuevos',
        value: this.metrics.newPatients,
        color: this.resolveColor('Nuevos')
      },
      {
        label: 'Recurrentes',
        value: Math.max(
          this.metrics.activePatients - this.metrics.newPatients,
          0
        ),
        color: this.resolveColor('Recurrentes')
      },
      {
        label: 'Inactivos',
        value: this.metrics.inactivePatients,
        color: this.resolveColor('Inactivos')
      }
    ];
  }

  get barItems(): BarChartItem[] {
    if (!this.metrics?.patientsByDate) return [];

    return this.metrics.patientsByDate.map(d => ({
      label: d.date,
      value: d.count
    }));
  }

  // 🔑 sliceClick emite DIRECTAMENTE el label (string)
  onDonutClick(label: string) {
    if (label === 'Nuevos') {
      this.segmentSelected.emit('NEW');
    } else if (label === 'Recurrentes') {
      this.segmentSelected.emit('RECURRENT');
    } else if (label === 'Inactivos') {
      this.segmentSelected.emit('INACTIVE');
    }
  }
}
