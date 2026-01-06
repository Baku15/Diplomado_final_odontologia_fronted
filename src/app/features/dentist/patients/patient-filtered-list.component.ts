// src/app/features/dentist/patients/patient-filtered-list.component.ts
import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientDashboardService } from '../../../core/services/patient-dashboard.service';

@Component({
  standalone: true,
  selector: 'app-patient-filtered-list',
  imports: [CommonModule],
  template: `
    <section class="bg-white rounded-2xl border p-6 shadow mt-8">
      <h3 class="font-semibold mb-4">Pacientes</h3>

      <ul class="divide-y">
        <li *ngFor="let p of patients" class="py-3">
          <div class="flex justify-between">
            <div>
              <p class="font-semibold">{{ p.fullName }}</p>
              <p class="text-xs text-slate-500">Riesgo: {{ p.riskLevel }}</p>
            </div>
            <span class="text-sm text-slate-600">
              {{ p.consultations }} consultas
            </span>
          </div>
        </li>
      </ul>

      <p *ngIf="patients.length === 0"
         class="text-center text-sm text-slate-500 py-6">
        No hay pacientes para este criterio
      </p>
    </section>
  `
})
export class PatientFilteredListComponent implements OnChanges {

  @Input() category!: 'NEW' | 'RECURRENT' | 'INACTIVE';
  @Input() from?: string;
  @Input() to?: string;
  @Output() clear = new EventEmitter<void>();

  patients: any[] = [];

  constructor(private service: PatientDashboardService) {}

  ngOnChanges() {
    if (!this.category || !this.from || !this.to) return;

    this.service
      .getPatientsByCategory(this.category, this.from, this.to)
      .subscribe(res => this.patients = res);
  }
}
