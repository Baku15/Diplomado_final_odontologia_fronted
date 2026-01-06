import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AppointmentsService } from '../../core/services/appointments.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-consultation-filtered-list',
  imports: [CommonModule],
  template: `
    <section class="bg-white rounded-2xl border p-6 shadow">

      <div class="flex justify-between mb-4">
        <h3 class="font-semibold">Consultas filtradas</h3>
        <button class="text-sm text-blue-600" (click)="clear.emit()">
          Limpiar
        </button>
      </div>

      <ul class="divide-y">
        <li *ngFor="let c of consultations"
            class="py-3 px-3 rounded-lg"
            [ngClass]="{ 'bg-blue-50 border border-blue-400': c.status === 'ACTIVE' }">

          <div class="flex justify-between text-sm">
            <div>
              <div class="font-semibold">
                {{ c.startedAt | date:'HH:mm' }}
              </div>
              <div class="text-slate-500">
                {{ c.patientName }}
              </div>
            </div>

            <span class="px-2 py-1 rounded-full text-xs"
                  [ngClass]="statusClass(c.status)">
              {{ c.status }}
            </span>
          </div>
        </li>
      </ul>

      <div *ngIf="consultations.length === 0 && last"
           class="text-center text-sm text-slate-500 py-6">
        No hay consultas registradas en este período
      </div>

      <div class="text-center mt-4" *ngIf="!last">
        <button class="px-4 py-2 text-sm border rounded"
                (click)="loadMore()">
          Cargar más
        </button>
      </div>

    </section>
  `
})
export class ConsultationFilteredListComponent
  implements OnInit, OnChanges {

  private service = inject(AppointmentsService);
  private platformId = inject(PLATFORM_ID);

  @Input() status?: string;
  @Input() date?: string;
  @Input() period!: 'TODAY' | 'WEEK' | 'MONTH';

  @Input() from?: string;
  @Input() to?: string;


  @Output() clear = new EventEmitter<void>();

  consultations: any[] = [];
  page = 0;
  last = false;

  async ngOnInit() {

  }

  private initialized = false;

  async ngOnChanges(changes: SimpleChanges) {
    if (!isPlatformBrowser(this.platformId)) return;

    // ⛔ Solo bloquear la PRIMERA vez real
    if (!this.initialized) {
      this.initialized = true;
      return;
    }

    await this.reset();
  }


  private async reset() {
    this.consultations = [];
    this.page = 0;
    this.last = false;
    await this.load();
  }



  private async load() {
    if (this.last) return;

    const res = await firstValueFrom(
      this.service.getDoctorConsultations({
        status: this.status,
        date: this.date,
        from: this.from,
        to: this.to,
        period: this.period,
        page: this.page,
        size: 10
      })
    );

    this.consultations.push(...res.content);
    this.last = res.last;
    this.page++;
  }

  loadMore() {
    this.load();
  }

  statusClass(status: string): string {
    return status === 'ACTIVE'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-emerald-100 text-emerald-700';
  }


}

