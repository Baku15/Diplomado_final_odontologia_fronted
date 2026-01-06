import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToothInterventionDetail } from '../../../../../core/models/tooth-intervention-detail.model';

@Component({
  standalone: true,
  selector: 'app-teeth-intervention-detail-modal',
  imports: [CommonModule],
  template: `
    <div class="backdrop" (click)="close()"></div>

    <div class="modal">
      <header>
        <h3>Dientes intervenidos</h3>

        <p class="summary" *ngIf="details.length">
          Durante este período,
          <strong>{{ details.length }} piezas dentales</strong>
          requirieron intervención clínica,
          destacando el
          <strong>diente {{ mostAffectedTooth?.toothNumber }}</strong>
          como el de mayor carga.
        </p>
      </header>

      <section *ngIf="details.length; else empty">
        <div class="list">
          <div class="row" *ngFor="let d of details">
            <span class="tooth">🦷 Diente {{ d.toothNumber }}</span>

            <span
              class="badge"
              [ngClass]="badgeClass(d.procedures)">
              {{ d.procedures }} tratamientos
            </span>
          </div>
        </div>
      </section>

      <ng-template #empty>
        <p class="empty">No hay dientes intervenidos en este período.</p>
      </ng-template>

      <footer>
        <button (click)="close()">Cerrar</button>
      </footer>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,.45);
      z-index: 50;
    }

    .modal {
      position: fixed;
      inset: 50% auto auto 50%;
      transform: translate(-50%, -50%);
      background: white;
      width: 440px;
      max-height: 70vh;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,.25);
      padding: 20px;
      z-index: 51;
      display: flex;
      flex-direction: column;
    }

    header h3 {
      font-size: 18px;
      font-weight: 600;
    }

    .summary {
      font-size: 13px;
      color: #475569;
      margin: 6px 0 14px;
      line-height: 1.4;
    }

    .list {
      overflow-y: auto;
      padding-right: 4px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .tooth {
      font-weight: 500;
    }

    /* ===== BADGES ===== */
    .badge {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }

    .low {
      background: #dcfce7;
      color: #166534;
    }

    .medium {
      background: #fef3c7;
      color: #92400e;
    }

    .high {
      background: #fee2e2;
      color: #991b1b;
    }

    .empty {
      font-size: 13px;
      color: #64748b;
      text-align: center;
      padding: 20px 0;
    }

    footer {
      margin-top: 16px;
      text-align: right;
    }

    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
    }
  `]
})
export class TeethInterventionDetailModal {

  @Input() details: ToothInterventionDetail[] = [];
  @Output() closed = new EventEmitter<void>();

  get mostAffectedTooth(): ToothInterventionDetail | null {
    if (!this.details.length) return null;
    return [...this.details].sort((a, b) => b.procedures - a.procedures)[0];
  }

  badgeClass(count: number): string {
    if (count >= 3) return 'high';
    if (count === 2) return 'medium';
    return 'low';
  }

  close() {
    this.closed.emit();
  }
}
