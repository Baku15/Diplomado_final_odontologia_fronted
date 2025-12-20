// src/app/features/clinic/patients/odontogram/odontogram-history.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OdontogramService } from '../../../../core/services/odontogram.service';
import { OdontogramSvgComponent } from './odontogram-svg.component';
import { FormsModule } from '@angular/forms';
import {DentalChartDto, DentalProcedureDto} from '../../../../core/models/odontogram.model';

@Component({
  standalone: true,
  selector: 'app-odontogram-history-page',
  imports: [CommonModule, OdontogramSvgComponent, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold">Historia — Odontograma</h1>
          <p class="text-sm text-slate-500">Paciente ID: {{ patientId }} · Clínica ID: {{ clinicId }}</p>
        </div>

        <div class="flex gap-2">
          <button (click)="onCreateChart()" class="px-3 py-2 rounded bg-emerald-600 text-white text-sm">Crear odontograma</button>
          <a [routerLink]="['/dashboard/pacientes', patientId]" class="px-3 py-2 rounded border text-sm">Volver</a>
        </div>
      </div>

      <div *ngIf="loading" class="p-6 bg-white rounded shadow text-sm">Cargando…</div>
      <div *ngIf="error" class="p-6 bg-rose-50 text-rose-700 rounded border">{{ error }}</div>

      <div *ngIf="!loading && !error">
        <div *ngFor="let chart of history">
          <h3 class="font-medium mt-4">Versión {{ chart.version }} — {{ chart.status }}</h3>

          <!-- IMPORTANTE: usamos '?? undefined' para evitar pasar null -->
          <app-odontogram-svg
            [teeth]="chart.teeth ?? undefined"
            [chartProcedures]="chart.procedures ?? undefined"
            (selectTooth)="onSelectTooth($event)"
            (edit)="openEditTooth($event)"
            (procedure)="openAddProcedure($event)"
          ></app-odontogram-svg>

          <!-- pequeño panel de procedimientos de esa versión -->
          <div class="mt-2">
            <div *ngIf="chart.procedures?.length; else noProc">
              <div *ngFor="let p of chart.procedures" class="p-2 border rounded mb-2 flex justify-between items-start">
                <div>
                  <div class="font-medium">{{ p.type }} <span class="text-xs text-slate-400">({{ p.toothNumber ? 'Diente ' + p.toothNumber : 'General' }})</span></div>
                  <div class="text-xs text-slate-600">{{ p.description }}</div>
                </div>

                <div class="text-right">
                  <div class="text-xs text-slate-400 mb-2">{{ p.createdAt ? (p.createdAt | date:'short') : '' }}</div>

                  <div *ngIf="p.status !== 'COMPLETED'">
                    <button class="px-2 py-1 border rounded text-sm" (click)="confirmComplete(chart, p)">Marcar finalizado</button>
                  </div>
                  <div *ngIf="p.status === 'COMPLETED'">
                    <span class="text-xs text-emerald-600">Finalizado</span>
                    <div class="text-xs text-slate-400">{{ p.completedAt ? (p.completedAt | date:'short') : '' }}</div>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noProc><div class="text-sm text-slate-500">No hay procedimientos en esta versión.</div></ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OdontogramHistoryPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(OdontogramService);

  clinicId!: number;
  patientId!: number;

  loading = true;
  error: string | null = null;
  history: DentalChartDto[] = [];

  selectedToothNumber?: number;

  ngOnInit(): void {
    this.clinicId = Number(this.route.snapshot.queryParamMap.get('clinicId')) || 1;
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadHistory();
  }

  async loadHistory() {
    this.loading = true;
    this.error = null;
    try {
      this.history = await this.service.getHistory(this.clinicId, this.patientId);
    } catch (err: any) {
      console.error(err);
      this.error = err?.error?.message || err?.message || 'No se pudo cargar el historial';
    } finally {
      this.loading = false;
    }
  }

  // Simple passthroughs to match other page APIs
  async onCreateChart() {
    try {
      this.loading = true;
      await this.service.createChart(this.clinicId, this.patientId);
      await this.loadHistory();
    } finally { this.loading = false; }
  }

  async onCloseChart() {
    // no-op si no se usa aquí; se deja para compatibilidad de template
    await this.loadHistory();
  }

  onSelectTooth(ev: { toothNumber: number; tooth?: any }) {
    this.selectedToothNumber = ev.toothNumber;
  }

  openEditTooth(toothNumber: number) {
    console.log('openEditTooth', toothNumber);
  }

  openAddProcedure(toothNumber: number) {
    console.log('openAddProcedure', toothNumber);
  }

  async confirmComplete(chart: DentalChartDto, p: DentalProcedureDto) {
    const ok = confirm('Marcar procedimiento como finalizado?');
    if (!ok) return;
    try {
      await this.service.completeProcedure(chart.clinicId!, chart.patientId!, chart.id!, p.id!);
      await this.loadHistory();
    } catch (err: any) {
      console.error(err);
      alert('Error finalizando procedimiento: ' + (err?.message || err?.error?.message || 'desconocido'));
    }
  }
}
