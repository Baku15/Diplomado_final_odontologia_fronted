import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import { PatientTimelineService } from '../../../../core/services/patient-timeline.service';

@Component({
  standalone: true,
  selector: 'app-patient-timeline-page',
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">

      <!-- Título con botón a la derecha -->
      <header class="flex justify-between items-start mb-2">
        <div>
          <h1 class="text-2xl font-semibold text-slate-800">
            Timeline clínico del paciente
          </h1>
          <p class="text-sm text-slate-500">
            Historial cronológico de consultas y procedimientos
          </p>
        </div>

        <button
          class="text-sm px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center gap-1"
          (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al paciente
        </button>
      </header>

      <!-- Filtros -->
      <div class="flex gap-2">
        <button
          *ngFor="let s of STATUS_FILTERS"
          (click)="changeFilter(s)"
          class="px-4 py-1.5 rounded-full text-sm border transition"
          [ngClass]="statusFilter === s
            ? 'bg-sky-600 text-white border-sky-600'
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'"
        >
          {{ s }}
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-slate-500 text-sm">
        Cargando timeline…
      </div>

      <!-- Sin resultados -->
      <div *ngIf="!loading && items.length === 0"
           class="text-slate-500 text-sm">
        No hay eventos clínicos registrados.
      </div>

      <!-- Timeline -->
      <div *ngFor="let c of items"
           class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">

        <!-- Header consulta -->
        <div class="flex justify-between items-center">
          <div>
            <div class="text-base font-semibold text-slate-800">
              Consulta #{{ c.consultationId }}
            </div>
            <div class="text-xs text-slate-500 mt-0.5">
              Inicio: {{ c.startedAt | date:'short' }}
              <span *ngIf="c.endedAt">
                · Fin: {{ c.endedAt | date:'short' }}
              </span>
            </div>
          </div>

          <span
            class="text-xs px-2.5 py-1 rounded-full font-medium"
            [ngClass]="{
              'bg-emerald-100 text-emerald-700': c.status === 'CLOSED',
              'bg-sky-100 text-sky-700': c.status === 'ACTIVE'
            }">
            {{ c.status }}
          </span>
        </div>

        <!-- Acción ver detalle -->
        <div class="mt-3">
          <button
            class="text-sm text-sky-600 hover:underline"
            (click)="toggleDetails(c.consultationId)">
            {{ expandedConsultationId === c.consultationId
            ? 'Ocultar detalle'
            : 'Ver detalle' }}
          </button>
        </div>

        <!-- Detalle -->
        <div *ngIf="expandedConsultationId === c.consultationId"
             class="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">

          <div *ngIf="c.summary">
            <div class="text-sm font-medium text-slate-700">Resumen</div>
            <div class="text-sm text-slate-600">
              {{ c.summary }}
            </div>
          </div>

          <div *ngIf="c.clinicalNotes">
            <div class="text-sm font-medium text-slate-700">Notas clínicas</div>
            <div class="text-sm text-slate-600">
              {{ c.clinicalNotes }}
            </div>
          </div>

          <div *ngIf="c.procedures?.length">
            <div class="text-sm font-medium text-slate-700">Procedimientos</div>
            <ul class="mt-1 space-y-1 text-sm text-slate-600">
              <li *ngFor="let p of c.procedures"
                  class="flex gap-2 items-center">
                🦷
                <span>
                  Diente {{ p.toothNumber }} — {{ p.type }}
                  <span class="text-xs text-slate-400">
                    ({{ p.status }})
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <!-- Acción -->
          <button
            *ngIf="c.status === 'ACTIVE'"
            class="mt-3 px-4 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition"
            (click)="continueConsultation(c.consultationId)">
            Continuar consulta
          </button>
        </div>
      </div>

      <!-- Paginación -->
      <div *ngIf="!loading && totalPages > 0"
           class="flex justify-between items-center pt-6 border-t">

        <button
          class="px-4 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          [disabled]="page === 0"
          (click)="changePage(-1)">
          ← Anterior
        </button>

        <span class="text-sm text-slate-600">
          Página <strong>{{ page + 1 }}</strong> de {{ totalPages }}
        </span>

        <button
          class="px-4 py-1.5 border rounded-lg text-sm disabled:opacity-40"
          [disabled]="page + 1 >= totalPages"
          (click)="changePage(1)">
          Siguiente →
        </button>
      </div>

    </div>
  `,
})
export class PatientTimelinePage implements OnInit {

  readonly STATUS_FILTERS: Array<'ALL' | 'ACTIVE' | 'CLOSED'> = [
    'ALL',
    'ACTIVE',
    'CLOSED',
  ];

  private route = inject(ActivatedRoute);
  private service = inject(PatientTimelineService);
  private router = inject(Router);


  patientId!: number;

  loading = true;
  items: any[] = [];

  page = 0;
  totalPages = 0;

  statusFilter: 'ALL' | 'ACTIVE' | 'CLOSED' = 'ALL';
  expandedConsultationId: number | null = null;

  async ngOnInit() {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    await this.load();
  }

  async load() {
    this.loading = true;

    const res = await this.service.getTimeline(
      this.patientId,
      this.page,
      5,
      this.statusFilter
    );

    this.items = res?.content ?? [];
    this.totalPages = Math.max(1, res?.totalPages ?? 1);

    this.loading = false;
  }

  toggleDetails(id: number) {
    this.expandedConsultationId =
      this.expandedConsultationId === id ? null : id;
  }

  async changePage(delta: number) {
    this.page += delta;
    await this.load();
  }

  async changeFilter(status: 'ALL' | 'ACTIVE' | 'CLOSED') {
    this.statusFilter = status;
    this.page = 0;
    await this.load();
  }

  continueConsultation(consultationId: number) {
    console.log('Continuar consulta', consultationId);
  }

  goBack() {
    this.router.navigate(['/dashboard/pacientes', this.patientId]);
  }
}
