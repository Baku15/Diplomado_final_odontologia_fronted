import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  OnChanges,
  SimpleChanges,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AppointmentsService } from '../../core/services/appointments.service';
import { Appointment } from '../../core/models/appointment.model';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-doctor-citas-filtered-list',
  imports: [CommonModule],
  template: `
    <section class="bg-white rounded-2xl border p-6 shadow">

      <div class="flex justify-between mb-4">
        <h3 class="text-lg font-semibold">Citas filtradas</h3>
        <button class="text-sm text-blue-600" (click)="clear.emit()">
          Limpiar
        </button>
      </div>

      <ul class="divide-y">
        <li *ngFor="let a of appointments"
            class="py-3 px-3 rounded-lg mb-2"
            [ngClass]="{
              'border border-blue-400 bg-blue-50': isCurrent(a)
            }">

          <div class="flex justify-between items-center text-sm">
            <div>
              <div class="font-semibold">
                {{ a.startTime }} – {{ a.endTime }}
              </div>
              <div class="text-slate-500">
                {{ a.patientId ? ('Paciente #' + a.patientId) : 'Paciente no registrado' }}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span *ngIf="isCurrent(a)"
                    class="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">
                EN CURSO
              </span>

              <span class="px-2 py-1 rounded-full text-xs"
                    [ngClass]="statusClass(a.status)">
                {{ a.status }}
              </span>
            </div>
          </div>
        </li>
      </ul>

      <div class="mt-4 text-center" *ngIf="!last">
        <button
          class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50"
          (click)="loadMore()">
          Cargar más
        </button>
      </div>

    </section>
  `
})
export class DoctorCitasFilteredListComponent
  implements OnInit, OnChanges {

  private appointmentsService = inject(AppointmentsService);
  private platformId = inject(PLATFORM_ID);

  @Input() status?: string;
  @Input() date?: string;
  @Input() period!: 'TODAY' | 'WEEK' | 'MONTH';

  @Output() clear = new EventEmitter<void>();

  appointments: Appointment[] = [];
  page = 0;
  last = false;

  /** 🔒 BLOQUEO DE CARGA */
  private loading = false;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.resetAndLoad();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (
      changes['status'] ||
      changes['date'] ||
      changes['period']
    ) {
      await this.resetAndLoad();
    }
  }

  private async resetAndLoad(): Promise<void> {
    this.appointments = [];
    this.page = 0;
    this.last = false;
    await this.load();
  }

  private async load(): Promise<void> {
    if (this.last || this.loading) return;

    this.loading = true;

    try {
      const res = await firstValueFrom(
        this.appointmentsService.getDoctorAppointments({
          status: this.status,
          period: this.period,
          date: this.date,
          page: this.page,
          size: 10
        })
      );

      this.appointments.push(...res.content);
      this.last = res.last;
      this.page++;

    } finally {
      this.loading = false;
    }
  }

  async loadMore(): Promise<void> {
    await this.load();
  }

  isCurrent(a: Appointment): boolean {
    const now = new Date();
    const start = this.toDate(a.startTime);
    const end = this.toDate(a.endTime);
    return start <= now && now <= end;
  }

  private toDate(time: string): Date {
    const [h, m, s] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, s || 0, 0);
    return d;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      case 'NO_SHOW': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100';
    }
  }
}
