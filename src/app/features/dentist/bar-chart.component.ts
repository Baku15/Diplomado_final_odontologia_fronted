import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartItem {
  label: string;
  value: number;
  meta?: {
    weekIndex?: number;
  };
}

@Component({
  standalone: true,
  selector: 'app-bar-chart',
  imports: [CommonModule],
  template: `
    <div *ngIf="items.length === 0"
         class="text-sm text-slate-500 text-center py-6">
      No hay actividad registrada en este período
    </div>

    <div *ngIf="items.length > 0" class="space-y-2">
      <div *ngFor="let item of items"
           class="cursor-pointer"
           (click)="select(item)">

        <div class="flex justify-between text-xs text-slate-600 mb-1">
          <span>{{ item.label }}</span>
          <span class="font-semibold">{{ item.value }}</span>
        </div>

        <div class="h-2 bg-slate-200 rounded overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all"
            [style.width.%]="percent(item.value)">
          </div>
        </div>
      </div>
    </div>
  `
})
export class BarChartComponent {

  @Input({ required: true }) items: BarChartItem[] = [];
  @Output() barClick = new EventEmitter<BarChartItem>();

  private maxValue(): number {
    const max = Math.max(...this.items.map(d => d.value));
    return max > 0 ? max : 1;
  }

  percent(value: number): number {
    return value === 0 ? 2 : (value / this.maxValue()) * 100;
  }

  select(item: BarChartItem): void {
    this.barClick.emit(item);
  }
}
