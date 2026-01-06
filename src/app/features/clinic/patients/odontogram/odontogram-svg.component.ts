// src/app/features/clinic/patients/odontogram/odontogram-svg.component.ts
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { ToothDto, DentalProcedureDto } from '../../../../core/models/odontogram.model';
import { CommonModule, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-odontogram-svg',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  template: `
    <div class="w-full">
      <!-- Tabs -->
      <div class="flex items-center justify-start gap-6 mb-3 border-b pb-2">
        <button (click)="activeSet = 'PERMANENT'"
                [class.active]="activeSet==='PERMANENT'"
                class="tab-btn">PERMANENTES</button>
        <button (click)="activeSet = 'DECIDUOUS'"
                [class.active]="activeSet==='DECIDUOUS'"
                class="tab-btn">DECÍDUOS</button>
      </div>

      <div class="bg-white rounded-lg border p-3">
        <div class="grid grid-cols-1 gap-4 items-start">
          <!-- Header row -->
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm text-slate-500">Arcada superior</div>
            <div class="invisible md:visible"></div>
          </div>

          <!-- Wrapper (position:relative so overlay helper doesn't affect layout) -->
          <div class="odontogram-wrapper relative">

            <!-- label PALADAR above upper arch -->
            <div class="arch-label">PALADAR</div>

            <!-- Upper arch -->
            <div class="arch-row arch-upper">
              <div class="half-group left">
                <div class="teeth-row">
                  <ng-container *ngFor="let n of leftUpper()">
                    <div class="tooth-wrap"
                         (click)="select(n,$event)"
                         [title]="'Diente ' + n"
                         [class.selected]="selectedNumber === n"
                         [class.persistent]="isPersistent(n)">
                      <div class="num-top">{{ n }}</div>

                      <svg viewBox="0 0 48 48" [attr.width]="svgSize" [attr.height]="svgSize" class="tooth-svg">
                        <g>
                          <path d="M8 8 C12 2,36 2,40 8 C37 10,34 12,34 22 C34 30,30 36,24 36 C18 36,14 30,14 22 C14 12,11 10,8 8 Z"
                                [attr.fill]="computedFill(n)"
                                [attr.stroke]="computedStroke(n)" [attr.stroke-width]="selectedNumber===n ? 2.4 : 1.2"></path>

                          <circle *ngIf="hasSurface(n,'O')" cx="24" cy="10" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'V')" cx="24" cy="36" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'M')" cx="10" cy="24" r="2.2" fill="#bbf7d0"></circle>
                          <circle *ngIf="hasSurface(n,'D')" cx="38" cy="24" r="2.2" fill="#bbf7d0"></circle>

                          <text x="24" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a"
                                paint-order="stroke" stroke="#fff" stroke-width="1.4">
                            {{ n }}
                          </text>
                        </g>
                      </svg>

                      <div *ngIf="badgeCount(n) > 0"
                           class="badge"
                           [class.badge-alert]="hasHighLoad(n)"
                           [title]="hasHighLoad(n) ? 'Alta carga clínica en este diente' : ''">
                        {{ badgeCount(n) }}
                      </div>

                      <!-- 🔵 evidencia fotográfica -->
                      <div *ngIf="hasImage(n)"
                           class="photo-dot"
                           title="Este diente tiene evidencia fotográfica">
                      </div>

                    </div>
                  </ng-container>
                </div>
              </div>

              <div class="half-group right">
                <div class="teeth-row">
                  <ng-container *ngFor="let n of rightUpper()">
                    <div class="tooth-wrap"
                         (click)="select(n,$event)"
                         [title]="'Diente ' + n"
                         [class.selected]="selectedNumber === n"
                         [class.persistent]="isPersistent(n)">
                      <div class="num-top">{{ n }}</div>

                      <svg viewBox="0 0 48 48" [attr.width]="svgSize" [attr.height]="svgSize" class="tooth-svg">
                        <g>
                          <path d="M8 8 C12 2,36 2,40 8 C37 10,34 12,34 22 C34 30,30 36,24 36 C18 36,14 30,14 22 C14 12,11 10,8 8 Z"
                                [attr.fill]="computedFill(n)"
                                [attr.stroke]="computedStroke(n)" [attr.stroke-width]="selectedNumber===n ? 2.4 : 1.2"></path>

                          <circle *ngIf="hasSurface(n,'O')" cx="24" cy="10" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'V')" cx="24" cy="36" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'M')" cx="10" cy="24" r="2.2" fill="#bbf7d0"></circle>
                          <circle *ngIf="hasSurface(n,'D')" cx="38" cy="24" r="2.2" fill="#bbf7d0"></circle>

                          <text x="24" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a"
                                paint-order="stroke" stroke="#fff" stroke-width="1.4">
                            {{ n }}
                          </text>
                        </g>
                      </svg>

                      <div *ngIf="badgeCount(n) > 0"
                           class="badge"
                           [class.badge-alert]="hasHighLoad(n)"
                           [title]="hasHighLoad(n) ? 'Alta carga clínica en este diente' : ''">
                        {{ badgeCount(n) }}
                      </div>

                      <!-- 🔵 evidencia fotográfica -->
                      <div *ngIf="hasImage(n)"
                           class="photo-dot"
                           title="Este diente tiene evidencia fotográfica">
                      </div>

                    </div>
                  </ng-container>
                </div>
              </div>
            </div>

            <!-- center midline -->
            <div class="midline" aria-hidden="true"></div>

            <!-- label LENGUA above lower arch -->
            <div class="arch-label arch-label-bottom">LENGUA</div>

            <!-- Lower arch -->
            <div class="arch-row arch-lower">
              <div class="half-group left">
                <div class="teeth-row">
                  <ng-container *ngFor="let n of leftLower()">
                    <div class="tooth-wrap"
                         (click)="select(n,$event)"
                         [title]="'Diente ' + n"
                         [class.selected]="selectedNumber === n"
                         [class.persistent]="isPersistent(n)">
                      <div class="num-top">{{ n }}</div>

                      <svg viewBox="0 0 48 48" [attr.width]="svgSize" [attr.height]="svgSize" class="tooth-svg">
                        <g>
                          <path d="M8 12 C12 6,36 6,40 12 C37 14,34 18,34 26 C34 33,30 36,24 36 C18 36,14 33,14 26 C14 18,11 14,8 12 Z"
                                [attr.fill]="computedFill(n)"
                                [attr.stroke]="computedStroke(n)" [attr.stroke-width]="selectedNumber===n ? 2.4 : 1.2"></path>

                          <circle *ngIf="hasSurface(n,'O')" cx="24" cy="10" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'V')" cx="24" cy="36" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'M')" cx="10" cy="24" r="2.2" fill="#bbf7d0"></circle>
                          <circle *ngIf="hasSurface(n,'D')" cx="38" cy="24" r="2.2" fill="#bbf7d0"></circle>

                          <text x="24" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a"
                                paint-order="stroke" stroke="#fff" stroke-width="1.4">
                            {{ n }}
                          </text>
                        </g>
                      </svg>

                      <div *ngIf="badgeCount(n) > 0"
                           class="badge"
                           [class.badge-alert]="hasHighLoad(n)"
                           [title]="hasHighLoad(n) ? 'Alta carga clínica en este diente' : ''">
                        {{ badgeCount(n) }}
                      </div>

                      <!-- 🔵 evidencia fotográfica -->
                      <div *ngIf="hasImage(n)"
                           class="photo-dot"
                           title="Este diente tiene evidencia fotográfica">
                      </div>

                    </div>
                  </ng-container>
                </div>
              </div>

              <div class="half-group right">
                <div class="teeth-row">
                  <ng-container *ngFor="let n of rightLower()">
                    <div class="tooth-wrap"
                         (click)="select(n,$event)"
                         [title]="'Diente ' + n"
                         [class.selected]="selectedNumber === n"
                         [class.persistent]="isPersistent(n)">
                      <div class="num-top">{{ n }}</div>

                      <svg viewBox="0 0 48 48" [attr.width]="svgSize" [attr.height]="svgSize" class="tooth-svg">
                        <g>
                          <path d="M8 12 C12 6,36 6,40 12 C37 14,34 18,34 26 C34 33,30 36,24 36 C18 36,14 33,14 26 C14 18,11 14,8 12 Z"
                                [attr.fill]="computedFill(n)"
                                [attr.stroke]="computedStroke(n)" [attr.stroke-width]="selectedNumber===n ? 2.4 : 1.2"></path>

                          <circle *ngIf="hasSurface(n,'O')" cx="24" cy="10" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'V')" cx="24" cy="36" r="2.2" fill="#fde68a"></circle>
                          <circle *ngIf="hasSurface(n,'M')" cx="10" cy="24" r="2.2" fill="#bbf7d0"></circle>
                          <circle *ngIf="hasSurface(n,'D')" cx="38" cy="24" r="2.2" fill="#bbf7d0"></circle>

                          <text x="24" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a"
                                paint-order="stroke" stroke="#fff" stroke-width="1.4">
                            {{ n }}
                          </text>
                        </g>
                      </svg>

                      <div *ngIf="badgeCount(n) > 0"
                           class="badge"
                           [class.badge-alert]="hasHighLoad(n)"
                           [title]="hasHighLoad(n) ? 'Alta carga clínica en este diente' : ''">
                        {{ badgeCount(n) }}
                      </div>
                      <!-- 🔵 evidencia fotográfica -->
                      <div *ngIf="hasImage(n)"
                           class="photo-dot"
                           title="Este diente tiene evidencia fotográfica">
                      </div>

                    </div>
                  </ng-container>
                </div>
              </div>
            </div>

            <!-- legend (unchanged) -->
            <div class="legend mt-3 text-xs text-slate-600 flex gap-3 items-center">
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-emerald-400 inline-block border"></span> Implante / prótesis</div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-yellow-300 inline-block border"></span> Caries</div>
              <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-rose-300 inline-block border"></span> Ausente / extraído</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --tooth-size: 80px; /* reverted to previous size */
      --svg-size: 48;
      display:block;
    }

    .tab-btn { background: transparent; border: none; padding: 6px 6px; cursor: pointer; color: #64748b; font-weight: 600; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: #0ea5e9; border-bottom-color: #0ea5e9; }

    .odontogram-wrapper {
      padding: 6px 2px;
      max-width: 100%;
      margin: 0 auto;
      position: relative; /* for helper overlay */
    }

    /* big arch labels */
    .arch-label {
      text-align: center;
      font-size: 13px;
      color: #475569;
      font-weight: 600;
      margin-bottom: 6px;
      letter-spacing: 1px;
    }
    .arch-label-bottom { margin-top: 8px; margin-bottom: 6px; }

    .arch-row { display: flex; gap: 8px; align-items: flex-end; justify-content: center; margin: 6px 0; }
    .half-group { display:flex; flex-direction: column; gap:6px; align-items: center; width: 50%; min-width: 100px; }
    .half-group.left { align-items: flex-end; }
    .half-group.right { align-items: flex-start; }

    .teeth-row { display:flex; gap:8px; flex-wrap: wrap; align-items: center; justify-content: center; }
    .tooth-wrap {
      width: var(--tooth-size);
      height: var(--tooth-size);
      min-width: var(--tooth-size);
      min-height: var(--tooth-size);
      display:flex;
      align-items:center;
      justify-content:center;
      position:relative;
      background: #fff;
      border-radius: 10px;
      border: 1px solid #eef2f6;
      transition: transform .12s ease, box-shadow .12s ease;
      cursor: pointer;
      padding: 6px;
      box-sizing: border-box;
      overflow: visible;
    }
    .tooth-wrap:hover { transform: translateY(-3px); box-shadow: 0 6px 12px rgba(15,23,42,0.05); }

    /* top small number */
    .num-top {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #64748b;
      z-index: 6;
      pointer-events: none;
    }

    /* selection and persistent marker */
    .tooth-wrap.selected { box-shadow: 0 8px 18px rgba(14,165,233,0.12); border-color: rgba(14,165,233,0.6); }
    .tooth-wrap.persistent { border-color: rgba(59,130,246,0.15); background: rgba(239,246,255,0.7); }

    .tooth-svg { display:block; z-index: 2; }

    .badge { position: absolute; top: -6px; right: -6px; background: #fb7185; color: white; font-size: 10px; padding: 2px 6px; border-radius: 999px; line-height: 1; border: 2px solid white; z-index: 8; }

    .badge-alert {
      background: #dc2626; /* rojo clínico */
      animation: pulse 1.4s infinite;
    }

    /* 🔵 evidencia fotográfica */
    .photo-dot {
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: #3b82f6; /* azul clínico */
      border-radius: 50%;
      border: 2px solid white;
      z-index: 9;
    }


    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.6); }
      70%  { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
      100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
    }

    .midline { width: 100%; height: 0; border-top: 2px dashed #e2e8f0; margin: 8px 0; }

    .legend { display:flex; gap:10px; align-items:center; flex-wrap:wrap; color: #475569; font-size: 12px; }

    @media (min-width: 768px) {
      :host { --tooth-size: 86px; --svg-size: 50; }
      .arch-row { gap: 10px; }
    }
    @media (min-width: 1024px) {
      :host { --tooth-size: 92px; --svg-size: 56; }
      .arch-row { gap: 10px; }
    }
    @media (max-width: 640px) {
      .half-group { min-width: 42%; }
      :host { --tooth-size: 60px; --svg-size: 40; }
    }

    text { paint-order: stroke; }
  `]
})
export class OdontogramSvgComponent {
  @Input() teeth: ToothDto[] | undefined;
  @Input() chartProcedures: DentalProcedureDto[] | undefined;
  @Input() teethWithImages: number[] = [];
  @Output() selectTooth = new EventEmitter<{ toothNumber: number; tooth?: ToothDto }>();
  @Output() edit = new EventEmitter<number>();
  @Output() procedure = new EventEmitter<number>();

  activeSet: 'PERMANENT' | 'DECIDUOUS' = 'PERMANENT';

  selectedNumber?: number;
  selectedTooth?: ToothDto | undefined;
  activeChip?: string;

  chips = [
    { key: 'maxila', label: 'Maxila' },
    { key: 'mandibula', label: 'Mandíbula' },
    { key: 'face', label: 'Face' },
    { key: 'arcada_sup', label: 'Arcada superior' },
    { key: 'arcada_inf', label: 'Arcada inferior' },
    { key: 'all', label: 'Arcadas' },
  ];

  upperPermanent = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
  lowerPermanent = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];

  upperDeciduous = [55,54,53,52,51,61,62,63,64,65].slice(0,8);
  lowerDeciduous = [85,84,83,82,81,71,72,73,74,75].slice(0,8);

  // compute svg size safely (no getComputedStyle)
  svgSize = this.computeSvgSize();

  @HostListener('window:resize')
  onResize() {
    this.svgSize = this.computeSvgSize();
  }

  private computeSvgSize(): number {
    const w = window?.innerWidth || 1024;
    if (w >= 1200) return 56;
    if (w >= 1024) return 52;
    if (w >= 768) return 50;
    if (w >= 420) return 48;
    return 40;
  }

  // helpers to split left / right groups (match visual ordering)
  leftUpper() { return (this.activeSet === 'PERMANENT' ? this.upperPermanent.slice(0,8) : this.upperDeciduous.slice(0,8)); }
  rightUpper() { return (this.activeSet === 'PERMANENT' ? this.upperPermanent.slice(8) : this.upperDeciduous.slice(8)); }
  leftLower() { return (this.activeSet === 'PERMANENT' ? this.lowerPermanent.slice(0,8) : this.lowerDeciduous.slice(0,8)); }
  rightLower() { return (this.activeSet === 'PERMANENT' ? this.lowerPermanent.slice(8) : this.lowerDeciduous.slice(8)); }

  getTooth(n: number): ToothDto | undefined {
    return this.teeth?.find(t => t.toothNumber === n);
  }

  /** Return true when a tooth has persistent data (so we keep a subtle highlight) */
  isPersistent(n: number): boolean {
    const t = this.getTooth(n);
    if (!t) return false;
    const hasStatus = !!t.toothStatus && t.toothStatus !== '';
    const hasNotes = !!t.notes && t.notes.trim().length > 0;
    const hasSurfaces = !!t.surfaceStates && Object.keys((t.surfaceStates as any) || {}).length > 0;
    const hasProcedures = !!this.chartProcedures && this.chartProcedures.some(p => p.toothNumber === n);
    return hasStatus || hasNotes || hasSurfaces || hasProcedures;
  }

  /** computed fill: selection > explicit toothStatus colors > persistent highlight > white */
  computedFill(n: number): string {
    const t = this.getTooth(n);

    // Selección siempre gana
    if (this.selectedNumber === n) return '#dbeafe';

    // Estados clínicos explícitos (siempre ganan)
    if (t) {
      if (t.toothStatus === 'IMPLANTE' || t.toothStatus === 'PROTESIS') return '#ecfdf5';
      if (t.toothStatus === 'EXTRACCION' || t.toothStatus === 'AUSENTE') return '#fff1f2';
      if (t.toothStatus === 'TRATAMIENTO') return '#fffbeb';
    }

// 🔥 HEATMAP POR CARGA CLÍNICA (prioridad ALTA)
    const heat = this.getHeatColor(this.getProcedureCount(n));
    if (heat) return heat;

// Persistencia suave SOLO si no hay carga
    if (this.isPersistent(n)) return '#f0f9ff';

    return '#ffffff';
  }


    /** computed stroke color depending on selection / status */
  computedStroke(n: number): string {
    const t = this.getTooth(n);
    if (this.selectedNumber === n) return '#0369a1'; // strong blue stroke when selected
    if (!t) return '#cbd5e1';
    if (t.toothStatus === 'IMPLANTE' || t.toothStatus === 'PROTESIS') return '#10b981';
    if (t.toothStatus === 'EXTRACCION' || t.toothStatus === 'AUSENTE') return '#ef4444';
    return '#94a3b8';
  }

  hasSurface(n: number, s: string) {
    const t = this.getTooth(n);
    if (!t || !t.surfaceStates) return false;
    const v = (t.surfaceStates as any)[s];
    return !!v && v.toString().trim().length > 0;
  }

  badgeCount(n: number) {
    let count = 0;
    const t = this.getTooth(n);
    if (t?.notes) count++;
    if (this.chartProcedures) count += this.chartProcedures.filter(p => p.toothNumber === n).length;
    return count;
  }

  proceduresForSelected() {
    if (!this.selectedNumber || !this.chartProcedures) return [];
    return this.chartProcedures.filter(p => p.toothNumber === this.selectedNumber);
  }

  select(n: number, evt?: MouseEvent) {
    evt?.stopPropagation();
    // toggle selection: clicking same tooth deselects
    if (this.selectedNumber === n) {
      this.selectedNumber = undefined;
      this.selectedTooth = undefined;
      this.selectTooth.emit({ toothNumber: n, tooth: undefined });
      return;
    }

    this.selectedNumber = n;
    this.selectedTooth = this.getTooth(n);
    this.selectTooth.emit({ toothNumber: n, tooth: this.selectedTooth });
  }

  editSelected() {
    if (!this.selectedNumber) return;
    this.edit.emit(this.selectedNumber);
  }

  addProcedure() {
    if (!this.selectedNumber) return;
    this.procedure.emit(this.selectedNumber);
  }

  onChip(key: string) {
    this.activeChip = this.activeChip === key ? undefined : key;
  }

  /** Cantidad de procedimientos asociados al diente */
  getProcedureCount(n: number): number {
    if (!this.chartProcedures) return 0;
    return this.chartProcedures.filter(p => p.toothNumber === n).length;
  }

  /** Color según carga clínica */
  getHeatColor(count: number): string | null {
    if (count === 1) return '#e0f2fe';        // azul suave
    if (count === 2 || count === 3) return '#fed7aa'; // naranja
    if (count >= 4) return '#fecaca';         // rojo
    return null;
  }

  hasHighLoad(n: number): boolean {
    if (!this.chartProcedures) return false;
    return this.chartProcedures.filter(p => p.toothNumber === n).length >= 4;
  }

  hasImage(n: number): boolean {
    console.log('hasImage?', n, this.teethWithImages);
    return this.teethWithImages.includes(n);
  }




}
