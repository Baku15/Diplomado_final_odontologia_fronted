import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToothDto} from '../../../../../core/models/odontogram.model';

@Component({
  standalone: true,
  selector: 'app-odontogram-donut',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border p-4">
      <h3 class="text-sm font-semibold text-slate-800 mb-1">
        Estado de los dientes
      </h3>
      <p class="text-xs text-slate-500 mb-3">
        Distribución clínica del odontograma
      </p>

      <!-- DONUT SVG -->
      <div class="flex justify-center">
        <svg viewBox="0 0 36 36" class="w-40 h-40">
          <ng-container *ngFor="let s of slices; let i = index">
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="transparent"
              stroke-width="3.5"
              [attr.stroke]="s.color"
              [attr.stroke-dasharray]="s.percent + ' ' + (100 - s.percent)"
              [attr.stroke-dashoffset]="offsets[i]"
            />
          </ng-container>
        </svg>
      </div>

      <!-- LEYENDA -->
      <ul class="mt-4 space-y-1 text-xs">
        <li *ngFor="let s of slices" class="flex items-center gap-2">
          <span
            class="inline-block w-2.5 h-2.5 rounded-full"
            [style.background]="s.color">
          </span>
          <span class="text-slate-700">
            {{ s.label }} ({{ s.value }})
          </span>
        </li>
      </ul>
    </div>
  `
})
export class OdontogramDonutComponent implements OnChanges {

  @Input() teeth: ToothDto[] = [];

  slices: {
    label: string;
    value: number;
    percent: number;
    color: string;
  }[] = [];

  offsets: number[] = [];

  ngOnChanges(): void {
    const total = this.teeth.length || 1;

    const data = [
      { label: 'Sanos', value: this.count('SANO'), color: '#22c55e' },
      { label: 'En tratamiento', value: this.count('TRATAMIENTO'), color: '#facc15' },
      {
        label: 'Ausentes / extraídos',
        value: this.count('AUSENTE') + this.count('EXTRACCION'),
        color: '#fb7185'
      },
      {
        label: 'Implantes / prótesis',
        value: this.count('IMPLANTE') + this.count('PROTESIS'),
        color: '#38bdf8'
      }
    ];

    this.slices = [];
    this.offsets = [];

    let acc = 0;

    for (const d of data) {
      const percent = (d.value / total) * 100;
      this.offsets.push(100 - acc);
      acc += percent;

      this.slices.push({
        label: d.label,
        value: d.value,
        percent,
        color: d.color
      });
    }
  }

  private count(status: string): number {
    return this.teeth.filter(t => t.toothStatus === status).length;
  }
}
