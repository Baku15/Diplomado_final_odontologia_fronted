import {
  Component,
  inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser,
} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppointmentsService } from '../../core/services/appointments.service';
import { AppointmentDashboardMetrics } from '../../core/models/appointment-dashboard-metrics.model';
import { ConsultationDashboardMetrics } from '../../core/models/consultation-dashboard-metrics.model';
import { DoctorDashboardMetrics } from '../../core/models/doctor-dashboard-metrics.model';
import { PatientDashboardMetrics } from '../../core/models/patient-dashboard-metrics.model';

import { DoctorCitasMetricsComponent } from './doctor-citas-metrics.component';
import { DoctorCitasFilteredListComponent } from './doctor-citas-filtered-list.component';

import { ConsultationMetricsComponent } from './consultation-metrics.component';
import { ConsultationFilteredListComponent } from './consultation-filtered-list.component';
import { DoctorDashboardService } from '../../core/services/doctor-dashboard.service';
import { PatientDashboardService } from '../../core/services/patient-dashboard.service';
import {
  OdontogramDashboardMetricsComponent
} from '../clinic/patients/odontogram/doctor-dashbord/odontogram-dashboard-metrics.component';
import { PatientDashboardMetricsComponent } from './patients/patient-dashboard-metrics.component';
import { PatientFilteredListComponent } from './patients/patient-filtered-list.component';

/* ================================
   TIPOS
================================ */
export type DashboardTab =
  | 'appointments'
  | 'consultations'
  | 'odontogram'
  | 'patients';

export type MetricPeriod =
  | 'TODAY'
  | 'WEEK'
  | 'MONTH'
  | 'CUSTOM';

@Component({
  standalone: true,
  selector: 'app-dentist-dashboard-page',
  imports: [
    CommonModule,
    FormsModule,
    DoctorCitasMetricsComponent,
    DoctorCitasFilteredListComponent,
    ConsultationMetricsComponent,
    ConsultationFilteredListComponent,
    OdontogramDashboardMetricsComponent,
    PatientDashboardMetricsComponent,
    PatientFilteredListComponent
  ],
  template: `
    <main class="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div class="max-w-7xl mx-auto">

        <h1 class="text-2xl font-semibold mb-1">Dashboard del Doctor</h1>
        <p class="text-sm text-slate-500 mb-6">
          Métricas clínicas y operativas
        </p>

        <!-- ================= TABS ================= -->
        <div class="flex gap-2 mb-6">
          <button
            *ngFor="let tab of tabs"
            (click)="selectTab(tab)"
            [ngClass]="tabClass(tab)"
            class="px-4 py-2 rounded-xl text-sm font-semibold">
            {{ tabLabels[tab] }}
          </button>
        </div>

        <!-- ================= PERÍODO DE ANÁLISIS ================= -->
        <section class="bg-white rounded-2xl border p-6 mb-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- COLUMNA IZQUIERDA -->
            <div>
              <h3 class="text-sm font-semibold text-slate-800 mb-1">
                Período de análisis
              </h3>
              <p class="text-xs text-slate-500 mb-4">
                Las métricas muestran el resumen clínico según el período seleccionado
              </p>

              <div class="flex flex-wrap gap-2">
                <button
                  *ngFor="let p of periods"
                  (click)="selectPeriod(p)"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                  [ngClass]="{
                    'bg-blue-600 text-white border-blue-600': activePeriod === p,
                    'bg-white text-slate-600 border-slate-300 hover:bg-slate-50': activePeriod !== p
                  }">
                  {{ periodLabels[p] }}
                </button>
              </div>
            </div>

            <!-- COLUMNA DERECHA -->
            <div class="bg-slate-50 rounded-xl p-4 border">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <p class="text-sm font-medium text-slate-700">
                    Rango personalizado
                  </p>
                  <p class="text-xs text-slate-500">
                    Analiza un período específico de fechas
                  </p>
                </div>

                <span *ngIf="activePeriod === 'CUSTOM'"
                      class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Activo
                </span>
              </div>

              <div class="flex flex-wrap gap-2 items-center">
                <input
                  type="date"
                  class="border rounded-lg px-2 py-1 text-sm"
                  [(ngModel)]="customStart"
                  (change)="onCustomRangeChange()"
                />

                <span class="text-sm text-slate-500">a</span>

                <input
                  type="date"
                  class="border rounded-lg px-2 py-1 text-sm"
                  [(ngModel)]="customEnd"
                  (change)="onCustomRangeChange()"
                />
              </div>

              <p class="text-xs text-slate-400 mt-2">
                Afecta gráficas y listados del dashboard
              </p>
            </div>

          </div>
        </section>

        <!-- ================= CITAS ================= -->
        <section *ngIf="activeTab === 'appointments'"
                 class="bg-white rounded-2xl border p-6 shadow">

          <app-doctor-citas-metrics
            *ngIf="appointmentMetrics"
            [metrics]="appointmentMetrics"
            [period]="safeMetricPeriod"
            (statusSelected)="onAppointmentStatusSelected($event)"
            (dateSelected)="onAppointmentDateSelected($event)">
          </app-doctor-citas-metrics>
        </section>

        <app-doctor-citas-filtered-list
          *ngIf="activeTab === 'appointments' && (appointmentStatus || appointmentDate)"
          class="mt-8"
          [status]="appointmentStatus"
          [date]="appointmentDate"
          [period]="safeListPeriod"
          (clear)="clearAppointmentFilters()">
        </app-doctor-citas-filtered-list>

        <!-- ================= CONSULTAS ================= -->
        <section *ngIf="activeTab === 'consultations'"
                 class="bg-white rounded-2xl border p-6 shadow">

          <app-consultation-metrics
            *ngIf="consultationMetrics"
            [metrics]="consultationMetrics"
            [period]="safeMetricPeriod"
            (statusSelected)="onConsultationStatusSelected($event)"
            (dateSelected)="onConsultationDateSelected($event)">
          </app-consultation-metrics>
        </section>

        <app-consultation-filtered-list
          *ngIf="activeTab === 'consultations'"
          class="mt-8"
          [status]="consultationStatus"
          [date]="consultationDate"
          [from]="consultationFrom"
          [to]="consultationTo"
          [period]="safeListPeriod"
          (clear)="clearConsultationFilters()">
        </app-consultation-filtered-list>

        <!-- ================= ODONTOGRAMA ================= -->
        <section *ngIf="activeTab === 'odontogram'"
                 class="bg-white rounded-2xl border p-6 shadow">

          <app-doctor-dashboard-metrics
            *ngIf="odontogramMetrics"
            [metrics]="odontogramMetrics"
            [from]="odontogramFrom"
            [to]="odontogramTo">
          </app-doctor-dashboard-metrics>

        </section>

        <!-- ================= PACIENTES ================= -->
        <section *ngIf="activeTab === 'patients'"
                 class="bg-white rounded-2xl border p-6 shadow">

          <app-patient-dashboard-metrics
            *ngIf="patientMetrics"
            [metrics]="patientMetrics"
            (segmentSelected)="onPatientSegmentSelected($event)">
          </app-patient-dashboard-metrics>

          <app-patient-filtered-list
            *ngIf="selectedPatientCategory"
            class="mt-8"
            [category]="selectedPatientCategory"
            [from]="patientFrom"
            [to]="patientTo"
            (clear)="clearPatientFilters()">
          </app-patient-filtered-list>

        </section>

      </div>
    </main>
  `
})



export class DentistDashboardPage implements OnInit {

  private appointmentsService = inject(AppointmentsService);
  private platformId = inject(PLATFORM_ID);
  private doctorDashboardService = inject(DoctorDashboardService);
  private patientDashboardService = inject(PatientDashboardService);

  activeTab: DashboardTab = 'appointments';
  activePeriod: MetricPeriod = 'TODAY';

  customStart?: string;
  customEnd?: string;

  odontogramFrom?: string;
  odontogramTo?: string;
  patientFrom?: string;
  patientTo?: string;

  appointmentMetrics?: AppointmentDashboardMetrics;
  consultationMetrics?: ConsultationDashboardMetrics;
  odontogramMetrics?: DoctorDashboardMetrics;
  patientMetrics?: PatientDashboardMetrics;

  appointmentStatus?: string;
  appointmentDate?: string;

  consultationStatus?: string;
  consultationDate?: string;
  consultationFrom?: string;
  consultationTo?: string;
  private consultationPeriodStart?: Date;

  selectedPatientCategory?: 'NEW' | 'RECURRENT' | 'INACTIVE';

  tabs: DashboardTab[] = [
    'appointments',
    'consultations',
    'odontogram',
    'patients'
  ];

  periods: MetricPeriod[] = ['TODAY', 'WEEK', 'MONTH'];

  tabLabels: Record<DashboardTab, string> = {
    appointments: 'Citas',
    consultations: 'Consultas',
    odontogram: 'Odontograma',
    patients: 'Pacientes'
  };

  periodLabels: Record<MetricPeriod, string> = {
    TODAY: 'Hoy',
    WEEK: 'Semana',
    MONTH: 'Mes',
    CUSTOM: 'Rango'
  };

  get safeMetricPeriod(): 'TODAY' | 'WEEK' | 'MONTH' {
    return this.activePeriod === 'CUSTOM'
      ? 'WEEK'
      : this.activePeriod;
  }

  get safeListPeriod(): 'TODAY' | 'WEEK' | 'MONTH' {
    return this.activePeriod === 'CUSTOM'
      ? 'WEEK'
      : this.activePeriod;
  }

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.loadMetrics();
  }

  async loadMetrics(): Promise<void> {
    if (this.activeTab === 'appointments') {
      this.appointmentMetrics =
        this.activePeriod === 'CUSTOM'
          ? await this.appointmentsService
            .getDoctorAppointmentDashboardMetrics(
              'CUSTOM',
              this.customStart!,
              this.customEnd!
            ).toPromise()
          : await this.appointmentsService
            .getDoctorAppointmentDashboardMetrics(this.activePeriod)
            .toPromise();
    }

    if (this.activeTab === 'odontogram') {
      const now = new Date();
      let from: string;
      let to: string = now.toISOString().substring(0, 10);

      if (this.activePeriod === 'TODAY') {
        from = to;
      }
      else if (this.activePeriod === 'WEEK') {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        from = d.toISOString().substring(0, 10);
      }
      else if (this.activePeriod === 'MONTH') {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        from = d.toISOString().substring(0, 10);
      }
      else {
        // CUSTOM
        from = this.customStart!;
        to   = this.customEnd!;
      }

      // 🔑 Guardamos el rango REAL
      this.odontogramFrom = from;
      this.odontogramTo   = to;

      this.odontogramMetrics =
        await this.doctorDashboardService.getMetrics(from, to);
    }

    if (this.activeTab === 'patients') {
      const now = new Date();
      let from: string;
      let to: string = now.toISOString().substring(0, 10);

      if (this.activePeriod === 'TODAY') {
        from = to;
      } else if (this.activePeriod === 'WEEK') {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        from = d.toISOString().substring(0, 10);
      } else if (this.activePeriod === 'MONTH') {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        from = d.toISOString().substring(0, 10);
      } else {
        from = this.customStart!;
        to = this.customEnd!;
      }

      // Guardamos el rango REAL para pacientes
      this.patientFrom = from;
      this.patientTo = to;
      this.selectedPatientCategory = undefined;

      this.patientMetrics =
        await this.patientDashboardService
          .getMetrics(from, to)
          .toPromise();
    }

    if (this.activeTab === 'consultations') {
      const now = new Date();

      if (this.safeMetricPeriod === 'MONTH') {
        this.consultationPeriodStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 29
        );
      }

      if (this.safeMetricPeriod === 'WEEK') {
        this.consultationPeriodStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 6
        );
      }

      this.consultationMetrics =
        await this.appointmentsService
          .getDoctorConsultationDashboardMetrics(this.safeMetricPeriod)
          .toPromise();
    }
  }

  async selectTab(tab: DashboardTab): Promise<void> {
    this.activeTab = tab;
    this.clearAllFilters();
    await this.loadMetrics();
  }

  async selectPeriod(period: MetricPeriod): Promise<void> {
    this.activePeriod = period;
    this.customStart = undefined;
    this.customEnd = undefined;
    this.clearAllFilters();
    await this.loadMetrics();
  }

  onCustomRangeChange(): void {
    if (this.customStart && this.customEnd) {
      this.activePeriod = 'CUSTOM';
      this.clearAllFilters();
      this.loadMetrics();
    }
  }

  onAppointmentStatusSelected(status: string): void {
    this.appointmentStatus = status;
    this.appointmentDate = undefined;
  }

  onAppointmentDateSelected(date: string): void {
    this.appointmentDate = date;
    this.appointmentStatus = undefined;
  }

  clearAppointmentFilters(): void {
    this.appointmentStatus = undefined;
    this.appointmentDate = undefined;
  }

  onConsultationStatusSelected(status: string): void {
    this.consultationStatus = status;
    this.consultationDate = undefined;
  }

  onConsultationDateSelected(item: { label: string }): void {
    console.log('[DASHBOARD] dateSelected recibido', item);
    console.log('[DASHBOARD] activePeriod', this.activePeriod);
    const label = item.label;

    // Limpia filtros previos
    this.consultationStatus = undefined;
    this.consultationDate = undefined;
    this.consultationFrom = undefined;
    this.consultationTo = undefined;

    // 👉 CASO MES + SEMANA X
    if (this.activePeriod === 'MONTH' && label.startsWith('Semana')) {
      const weekNumber = Number(label.replace('Semana', '').trim());

      if (
        this.activePeriod === 'MONTH' &&
        label.startsWith('Semana') &&
        this.consultationPeriodStart
      ) {
        const weekNumber = Number(label.replace('Semana', '').trim());

        const from = new Date(this.consultationPeriodStart);
        from.setDate(from.getDate() + (weekNumber - 1) * 7);

        const to = new Date(from);
        to.setDate(from.getDate() + 6);

        this.consultationFrom = from.toISOString().substring(0, 10);
        this.consultationTo = to.toISOString().substring(0, 10);

        console.log('[DASHBOARD] rango REAL usado', {
          from: this.consultationFrom,
          to: this.consultationTo
        });

        return;
      }
    }

    // 👉 CASO NORMAL
    this.consultationDate = label;
  }

  clearConsultationFilters(): void {
    this.consultationStatus = undefined;
    this.consultationDate = undefined;
    this.consultationFrom = undefined;
    this.consultationTo = undefined;
  }

  onPatientSegmentSelected(category: 'NEW' | 'RECURRENT' | 'INACTIVE'): void {
    this.selectedPatientCategory = category;
  }

  clearPatientFilters(): void {
    this.selectedPatientCategory = undefined;
  }

  clearAllFilters(): void {
    this.clearAppointmentFilters();
    this.clearConsultationFilters();
    this.clearPatientFilters();
  }

  tabClass(tab: DashboardTab): string {
    return tab === this.activeTab
      ? 'bg-blue-600 text-white'
      : 'bg-white border text-slate-600';
  }
}
