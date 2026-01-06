  import { Component, Input, Output, EventEmitter } from '@angular/core';
  import { CommonModule } from '@angular/common';

  export interface DonutSlice {
    label: string;
    value: number;
    color: string;
  }

  interface RenderSlice {
    label: string;
    color: string;
    path?: string;     // solo para arcos
    full?: boolean;    // 👈 círculo completo
  }

  @Component({
    standalone: true,
    selector: 'app-donut-chart',
    imports: [CommonModule],
    template: `
      <div class="flex items-center gap-6">

        <!-- DONUT SVG -->
        <svg width="160" height="160" viewBox="0 0 200 200">

          <!-- fondo -->
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="26">
          </circle>

          <!-- 🔴 CÍRCULO COMPLETO (1 solo slice) -->
          <circle
            *ngIf="renderSlices.length === 1 && renderSlices[0].full"
            cx="100"
            cy="100"
            r="70"
            fill="none"
            [attr.stroke]="renderSlices[0].color"
            stroke-width="26"
            class="cursor-pointer"
            (click)="select(renderSlices[0].label)">
          </circle>

          <!-- 🟢 ARCS NORMALES (2+ slices) -->
          <ng-container *ngFor="let s of renderSlices">
            <path
              *ngIf="s.path"
              [attr.d]="s.path"
              [attr.fill]="s.color"
              class="cursor-pointer"
              (click)="select(s.label)">
            </path>
          </ng-container>

          <!-- sin datos -->
          <text *ngIf="renderSlices.length === 0"
                x="100"
                y="105"
                text-anchor="middle"
                class="fill-slate-400 text-sm">
            Sin datos
          </text>

        </svg>

        <!-- LEYENDA -->
        <ul class="space-y-2 text-sm">
          <li *ngFor="let s of slices"
              class="flex items-center gap-2 cursor-pointer"
              (click)="select(s.label)">
            <span class="w-3 h-3 rounded-full"
                  [style.background]="s.color"></span>
            {{ s.label }} ({{ s.value }})
          </li>
        </ul>

      </div>
    `
  })
  export class DonutChartComponent {

    @Input() slices: DonutSlice[] = [];
    @Output() sliceClick = new EventEmitter<string>();

    private readonly CX = 100;
    private readonly CY = 100;
    private readonly OUTER_R = 70;
    private readonly INNER_R = 44;

    get total(): number {
      return this.slices.reduce((sum, s) => sum + s.value, 0);
    }

    get renderSlices(): RenderSlice[] {
      const active = this.slices.filter(s => s.value > 0);

      if (active.length === 0) return [];

      // ✅ CASO CLAVE: SOLO 1 SLICE → CÍRCULO COMPLETO
      if (active.length === 1) {
        return [{
          label: active[0].label,
          color: active[0].color,
          full: true
        }];
      }

      // 🟢 CASO NORMAL: 2+ SLICES
      let startAngle = 0;

      return active.map(s => {
        const angle = (s.value / this.total) * 360;
        const endAngle = startAngle + angle;

        const path = this.describeDonutArc(
          this.CX,
          this.CY,
          this.INNER_R,
          this.OUTER_R,
          startAngle,
          endAngle
        );

        startAngle = endAngle;

        return {
          label: s.label,
          color: s.color,
          path
        };
      });
    }

    select(label: string): void {
      this.sliceClick.emit(label);
    }

    /* =========================
       GEOMETRÍA SVG
    ========================= */
    private polarToCartesian(cx: number, cy: number, r: number, angle: number) {
      const rad = (angle - 90) * Math.PI / 180;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      };
    }

    private describeDonutArc(
      cx: number,
      cy: number,
      innerR: number,
      outerR: number,
      startAngle: number,
      endAngle: number
    ): string {

      const largeArc = endAngle - startAngle > 180 ? 1 : 0;

      const p1 = this.polarToCartesian(cx, cy, outerR, startAngle);
      const p2 = this.polarToCartesian(cx, cy, outerR, endAngle);
      const p3 = this.polarToCartesian(cx, cy, innerR, endAngle);
      const p4 = this.polarToCartesian(cx, cy, innerR, startAngle);

      return `
        M ${p1.x} ${p1.y}
        A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}
        L ${p3.x} ${p3.y}
        A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}
        Z
      `;
    }
  }
