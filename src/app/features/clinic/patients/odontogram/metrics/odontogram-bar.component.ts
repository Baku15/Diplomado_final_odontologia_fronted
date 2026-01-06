import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DentalProcedureDto} from '../../../../../core/models/odontogram.model';

@Component({
  standalone: true,
  selector: 'app-odontogram-bar',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border p-4">
      <h3 class="text-sm font-semibold text-slate-800 mb-1">
        Procedimientos por diente
      </h3>
      <p class="text-xs text-slate-500 mb-3">
        Dientes con mayor carga clínica
      </p>

      <div *ngIf="rows.length === 0"
           class="text-xs text-slate-400">
        No hay procedimientos registrados.
      </div>

      <div *ngIf="rows.length"
           class="space-y-2">
        <div *ngFor="let r of rows"
             class="flex items-center gap-2">

          <!-- Diente -->
          <div class="w-10 text-xs text-slate-600">
            {{ r.tooth }}
          </div>

          <!-- Barra -->
          <div class="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
            <div
              class="h-3 bg-indigo-500"
              [style.width.%]="r.percent">
            </div>
          </div>

          <!-- Conteo -->
          <div class="w-6 text-xs text-slate-500 text-right">
            {{ r.count }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class OdontogramBarComponent implements OnChanges {

  @Input() procedures: DentalProcedureDto[] = [];

  rows: {
    tooth: number;
    count: number;
    percent: number;
  }[] = [];

  ngOnChanges(): void {
    const map = new Map<number, number>();

    for (const p of this.procedures) {
      if (!p.toothNumber) continue;
      map.set(p.toothNumber, (map.get(p.toothNumber) || 0) + 1);
    }

    if (map.size === 0) {
      this.rows = [];
      return;
    }

    const max = Math.max(...map.values());

    this.rows = Array.from(map.entries())
      .map(([tooth, count]) => ({
        tooth,
        count,
        percent: (count / max) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }
}
