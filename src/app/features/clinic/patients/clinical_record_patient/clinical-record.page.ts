// src/app/features/clinic/patients/clinical-record.page.ts
import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,

} from '@angular/forms';
import { ClinicalRecordService } from '../../../../core/services/clinical-record.service';
import { ClinicalRecordDetail, AttachmentDto } from '../../../../core/models/clinical-record.model';

// IMPORTANT: ajusta las rutas de import si tus servicios están en otra carpeta
import { PatientService } from '../../../../core/services/patient.service';
import { OdontogramService } from '../../../../core/services/odontogram.service';
import { AttachmentService } from '../../../../core/services/attachment.service';
import {ClinicalRecordAttachmentsModal} from './clinical-record-attachments.modal';

@Component({
  standalone: true,
  selector: 'app-clinical-record',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, NgFor, RouterLink, ClinicalRecordAttachmentsModal],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6">
      <div class="mb-4 flex items-center justify-between">
        <button
          class="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1"
          [routerLink]="['/dashboard/pacientes', patientId]"
        >
          ⬅ Volver al paciente
        </button>

        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span class="px-2 py-1 rounded bg-slate-100 border">Paciente ID: {{ patientId }}</span>
          <span *ngIf="recordId" class="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
            Historia clínica ID: {{ recordId }}
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">
              Historia clínica odontológica
            </h2>
            <p class="text-sm text-slate-500">
              Registra el motivo de consulta, antecedentes, examen clínico y diagnóstico inicial.
            </p>
          </div>

          <div class="flex flex-col items-end gap-2">
            <div class="flex gap-2">
              <button
                type="button"
                (click)="onExportFhir()"
                class="px-3 py-2 rounded-lg border text-xs hover:bg-slate-50"
              >
                ⬇ Exportar FHIR (JSON)
              </button>

              <!-- Botón "Cerrar historia" en el header (solo si ya existe historia) -->
              <button
                *ngIf="recordId"
                type="button"
                (click)="openCloseModal()"
                class="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs hover:bg-rose-700"
              >
                🔒 Cerrar historia
              </button>
            </div>

            <span *ngIf="createdAt" class="text-[11px] text-slate-400">
              Creada: {{ createdAt | date: 'short' }}
            </span>
            <span *ngIf="updatedAt" class="text-[11px] text-slate-400">
              Última actualización: {{ updatedAt | date: 'short' }}
            </span>
          </div>
        </div>

        <!-- Mensajes -->
        <div *ngIf="loading" class="px-6 py-6 text-sm text-slate-600">
          Cargando historia clínica…
        </div>

        <div *ngIf="error && !loading" class="px-6 py-4 text-sm text-rose-700 bg-rose-50 border-b border-rose-200">
          {{ error }}
        </div>

        <div
          *ngIf="successMessage && !loading"
          class="px-6 py-3 text-sm text-emerald-800 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center"
        >
          <span>{{ successMessage }}</span>
          <button (click)="successMessage = null" class="text-xs underline">Cerrar</button>
        </div>

        <form
          *ngIf="!loading"
          [formGroup]="form"
          (ngSubmit)="openSaveModal()"
          class="px-6 py-6 space-y-6"
        >
          <!-- Sección: Motivo y enfermedad actual -->
          <section class="border rounded-xl p-4 border-slate-200 bg-slate-50/50">
            <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span class="text-lg">📝</span> Motivo de consulta y enfermedad actual
            </h3>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  Motivo de consulta <span class="text-rose-600">*</span>
                </label>
                <textarea
                  formControlName="chiefComplaint"
                  rows="3"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej. Dolor intenso en molar superior derecha desde hace 3 días..."
                ></textarea>
                <p *ngIf="form.get('chiefComplaint')?.invalid && form.get('chiefComplaint')?.touched"
                   class="text-[11px] text-rose-600 mt-1">
                  El motivo de consulta es obligatorio (mínimo 4 caracteres).
                </p>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of chiefComplaintSuggestions"
                    (click)="appendToTextarea('chiefComplaint', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  Enfermedad actual
                </label>
                <textarea
                  formControlName="currentIllness"
                  rows="3"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe evolución, intensidad del dolor, factores que alivian/agravan, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of currentIllnessSuggestions"
                    (click)="appendToTextarea('currentIllness', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Sección: Antecedentes -->
          <section class="border rounded-xl p-4 border-slate-200">
            <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span class="text-lg">📚</span> Antecedentes
            </h3>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Antecedentes médicos</label>
                <textarea
                  formControlName="medicalHistory"
                  rows="3"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Diabetes, hipertensión, cardiopatías, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of medicalHistorySuggestions"
                    (click)="appendToTextarea('medicalHistory', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Historia odontológica</label>
                <textarea
                  formControlName="dentalHistory"
                  rows="3"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Frecuencia de consultas, tratamientos previos, traumatismos, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of dentalHistorySuggestions"
                    (click)="appendToTextarea('dentalHistory', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Alergias</label>
                <textarea
                  formControlName="allergies"
                  rows="2"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Fármacos, anestésicos, látex, alimentos, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of allergiesSuggestions"
                    (click)="appendToTextarea('allergies', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Medicación actual</label>
                <textarea
                  formControlName="medications"
                  rows="2"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of medicationSuggestions"
                    (click)="appendToTextarea('medications', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Enfermedades sistémicas</label>
                <textarea
                  formControlName="systemicConditions"
                  rows="2"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of systemicConditionsSuggestions"
                    (click)="appendToTextarea('systemicConditions', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Conductas de riesgo</label>
                <textarea
                  formControlName="riskBehaviors"
                  rows="2"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Tabaco, alcohol, drogas, bruxismo, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of riskBehaviorSuggestions"
                    (click)="appendToTextarea('riskBehaviors', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Embarazo (si aplica)</label>
                <textarea
                  formControlName="pregnancyStatus"
                  rows="2"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of pregnancyStatusSuggestions"
                    (click)="setControlValue('pregnancyStatus', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Examen clínico -->
          <section class="border rounded-xl p-4 border-slate-200">
            <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span class="text-lg">🔍</span> Examen clínico
            </h3>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Examen extraoral</label>
                <textarea
                  formControlName="extraoralExam"
                  rows="3"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Asimetrías, ganglios, limitación de apertura, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of extraoralExamSuggestions"
                    (click)="appendToTextarea('extraoralExam', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Examen intraoral</label>
                <textarea
                  formControlName="intraoralExam"
                  rows="3"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Tejidos blandos, mucosa, lengua, paladar, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of intraoralExamSuggestions"
                    (click)="appendToTextarea('intraoralExam', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Estado periodontal</label>
                <select
                  formControlName="periodontalStatus"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">— Seleccionar —</option>
                  <option *ngFor="let o of periodontalOptions" [value]="o">{{ o }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Riesgo de caries</label>
                <select
                  formControlName="cariesRisk"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">— Seleccionar —</option>
                  <option *ngFor="let o of cariesRiskOptions" [value]="o">{{ o }}</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-slate-700 mb-1">Oclusión / observaciones adicionales</label>
                <textarea
                  formControlName="occlusionNotes"
                  rows="2"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of occlusionSuggestions"
                    (click)="appendToTextarea('occlusionNotes', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Diagnóstico y plan -->
          <section class="border rounded-xl p-4 border-slate-200 bg-slate-50/60">
            <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span class="text-lg">🧠</span> Diagnóstico inicial y plan de tratamiento
            </h3>

            <div class="grid md:grid-cols-3 gap-4">
              <div class="md:col-span-1">
                <label class="block text-xs font-medium text-slate-700 mb-1">Diagnóstico inicial</label>
                <textarea
                  formControlName="initialDiagnosticSummary"
                  rows="4"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of diagnosticSuggestions"
                    (click)="appendToTextarea('initialDiagnosticSummary', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div class="md:col-span-1">
                <label class="block text-xs font-medium text-slate-700 mb-1">Plan de tratamiento inicial</label>
                <textarea
                  formControlName="initialTreatmentPlanSummary"
                  rows="4"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of treatmentPlanSuggestions"
                    (click)="appendToTextarea('initialTreatmentPlanSummary', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <div class="md:col-span-1">
                <label class="block text-xs font-medium text-slate-700 mb-1">Pronóstico</label>
                <textarea
                  formControlName="initialPrognosis"
                  rows="4"
                  class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Favorable, reservado, desfavorable, etc."
                ></textarea>
                <div class="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-600">
                  <span class="mr-1">Sugerencias:</span>
                  <button
                    type="button"
                    *ngFor="let s of prognosisSuggestions"
                    (click)="setControlValue('initialPrognosis', s)"
                    class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Signos vitales -->
          <section class="border rounded-xl p-4 border-slate-200">
            <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span class="text-lg">❤️</span> Signos vitales
            </h3>

            <div class="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">PA sistólica (mmHg)</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  formControlName="bloodPressureSystolic"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p
                  *ngIf="form.get('bloodPressureSystolic')?.invalid && form.get('bloodPressureSystolic')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 0 y 300 mmHg.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">PA diastólica (mmHg)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  formControlName="bloodPressureDiastolic"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p
                  *ngIf="form.get('bloodPressureDiastolic')?.invalid && form.get('bloodPressureDiastolic')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 0 y 200 mmHg.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">FC (lpm)</label>
                <input
                  type="number"
                  min="0"
                  max="250"
                  formControlName="heartRate"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p
                  *ngIf="form.get('heartRate')?.invalid && form.get('heartRate')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 0 y 250 lpm.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">FR (rpm)</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  formControlName="respiratoryRate"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p
                  *ngIf="form.get('respiratoryRate')?.invalid && form.get('respiratoryRate')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 0 y 80 rpm.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Temperatura (°C)</label>
                <input
                  type="number"
                  min="30"
                  max="45"
                  step="0.1"
                  formControlName="temperatureCelsius"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p
                  *ngIf="form.get('temperatureCelsius')?.invalid && form.get('temperatureCelsius')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 30 y 45 °C.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">SpO₂ (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  formControlName="oxygenSaturation"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p
                  *ngIf="form.get('oxygenSaturation')?.invalid && form.get('oxygenSaturation')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 0 y 100%.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.1"
                  formControlName="weightKg"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  (input)="recalculateBmi()"
                />
                <p
                  *ngIf="form.get('weightKg')?.invalid && form.get('weightKg')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 0 y 500 kg.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Talla (cm)</label>
                <input
                  type="number"
                  min="0"
                  max="250"
                  step="0.5"
                  formControlName="heightCm"
                  class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  (input)="recalculateBmi()"
                />
                <p
                  *ngIf="form.get('heightCm')?.invalid && form.get('heightCm')?.touched"
                  class="text-[11px] text-rose-600 mt-1"
                >
                  Valor entre 0 y 250 cm.
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">IMC (kg/m²)</label>
                <input
                  type="number"
                  formControlName="bmi"
                  class="w-full rounded-lg border px-3 py-2 bg-slate-50"
                  readonly
                />
              </div>
            </div>
          </section>


          <!-- Acciones -->
          <div class="pt-4 flex items-center justify-between">
            <p class="text-xs text-slate-500">
              Esta historia clínica se guardará asociada al paciente y a la clínica actual.
            </p>

            <div class="flex gap-3">


              <button
                type="submit"
                [disabled]="form.invalid || saving"
                class="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {{ saving ? 'Guardando…' : (recordId ? 'Guardar cambios' : 'Crear historia clínica') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Preview modal: mostrar solo si estamos previewing y existe attachment -->
    <div *ngIf="previewing && previewAttachment" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" (click)="closePreview()"></div>
      <div class="bg-white rounded-lg shadow-lg max-w-4xl w-full overflow-hidden z-10">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="text-sm font-semibold">{{ previewAttachment.filename }}</div>
          <div class="flex items-center gap-2">
            <a *ngIf="previewAttachment?.downloadUrl" [href]="previewAttachment.downloadUrl" target="_blank" class="text-xs px-3 py-1 rounded border">Abrir en nueva pestaña</a>
            <button (click)="closePreview()" class="text-xs px-3 py-1 rounded border">Cerrar</button>
          </div>
        </div>

        <!-- body (ejemplo imagen) -->
        <div class="p-4">
          <img *ngIf="previewAttachment?.downloadUrl" [src]="previewAttachment.downloadUrl" class="w-full h-auto object-contain" />
          <p *ngIf="previewAttachment.notes" class="mt-3 text-sm text-slate-600">{{ previewAttachment.notes }}</p>
        </div>
      </div>
    </div>


    <!-- Modal guardar (confirmación previa a guardar) -->
    <div *ngIf="showSaveModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="closeSaveModal()"></div>
      <div class="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 z-10">
        <h3 class="text-lg font-semibold mb-2">Confirmar cambios</h3>
        <p class="text-sm text-slate-600 mb-4">¿Deseas guardar los cambios en la historia clínica?</p>
        <div class="flex justify-end gap-3">
          <button class="px-4 py-2 rounded-lg border" (click)="closeSaveModal()">Cancelar</button>
          <button class="px-4 py-2 rounded-lg bg-emerald-600 text-white" (click)="performSave()">Sí, guardar</button>
        </div>
      </div>
    </div>

    <!-- Modal cerrar historia -->
    <div *ngIf="showCloseModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="closeCloseModal()"></div>
      <div class="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 z-10">
        <h3 class="text-lg font-semibold mb-2">Cerrar historia clínica</h3>
        <p class="text-sm text-slate-600 mb-4">
          Esta acción marcará la historia clínica como <strong>CERRADA</strong>. Ya no podrá editarse.
          ¿Deseas continuar?
        </p>
        <div class="flex justify-end gap-3">
          <button class="px-4 py-2 rounded-lg border" (click)="closeCloseModal()">Cancelar</button>
          <button class="px-4 py-2 rounded-lg bg-rose-600 text-white" (click)="performClose()">Sí, cerrar historia</button>
        </div>
      </div>
    </div>
    <!-- Modal adjuntar imágenes a historia clínica -->
    <app-clinical-record-attachments-modal
      *ngIf="showAttachImagesModal"
      [patientId]="patientId!"
      [clinicalRecordId]="recordId!"
      (close)="onSkipAttachments()"
      (saved)="onAttachmentsSaved()">
    </app-clinical-record-attachments-modal>

  `,
})
export class ClinicalRecordPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  showAttachImagesModal = false;

  private clinicalRecordService = inject(ClinicalRecordService);

  // servicios nuevos inyectados (ajusta rutas si es necesario)
  private patientService = inject(PatientService);
  private odontogramService = inject(OdontogramService);
  private attachmentService = inject(AttachmentService);

  @ViewChild('fileInputRef', { static: false }) fileInputRef?: ElementRef<HTMLInputElement>;

  clinicId!: number;
  patientId: number | null = null;
  recordId: number | null = null;

  loading = true;
  saving = false;
  error: string | null = null;
  successMessage: string | null = null;

  createdAt: string | null = null;
  updatedAt: string | null = null;

  // modal flags
  showSaveModal = false;
  showCloseModal = false;

  // attachments state
  attachments: AttachmentDto[] = [];
  attachmentsPage = 0;
  attachmentsSize = 50;

  // preview
  previewing = false;
  previewAttachment: AttachmentDto | null = null;

  // upload state
  uploading = false;
  uploadFile: File | null = null;
  uploadNotes: string | null = '';
  uploadToothRef: string | null = '';
  uploadType: string | null = '';
  uploadProgressVisible = false;
  uploadProgressText = '';

  // permissions (client-side hint; backend enforces)
  canDelete = true; // o derivar desde CurrentUserService si lo deseas

  // ===== SUGERENCIAS (completas) =====
  chiefComplaintSuggestions: string[] = [
    'Dolor dental agudo en pieza específica',
    'Molestia al masticar',
    'Sensibilidad al frío y calor',
    'Consulta de control de rutina',
    'Consulta por estética dental',
  ];

  currentIllnessSuggestions: string[] = [
    'Dolor de inicio súbito hace 2-3 días.',
    'Episodios intermitentes de dolor en las últimas semanas.',
    'Aumenta con alimentos fríos y calientes.',
    'No responde adecuadamente a analgésicos de venta libre.',
  ];

  medicalHistorySuggestions: string[] = [
    'Sin antecedentes médicos de importancia.',
    'Antecedente de hipertensión arterial controlada.',
    'Antecedente de diabetes mellitus tipo 2.',
    'Antecedente de cardiopatía en tratamiento.',
    'Alergia conocida a algún medicamento.',
  ];

  dentalHistorySuggestions: string[] = [
    'Controles odontológicos periódicos previos.',
    'Múltiples tratamientos de caries previos.',
    'Endodoncia previa en piezas posteriores.',
    'Tratamiento de ortodoncia previo.',
    'Antecedente de traumatismo dental.',
  ];

  allergiesSuggestions: string[] = [
    'Niega alergias conocidas.',
    'Alergia a anestésicos locales.',
    'Alergia a antibióticos (penicilinas).',
    'Alergia a analgésicos/antiinflamatorios.',
    'Alergia a látex.',
  ];

  medicationSuggestions: string[] = [
    'Niega medicación actual.',
    'En tratamiento con antihipertensivos.',
    'En tratamiento con hipoglucemiantes orales.',
    'En tratamiento con anticoagulantes.',
  ];

  systemicConditionsSuggestions: string[] = [
    'Sin enfermedades sistémicas conocidas.',
    'Hipertensión arterial controlada.',
    'Diabetes mellitus tipo 2.',
    'Asma bronquial.',
    'Enfermedad cardíaca en seguimiento.',
  ];

  riskBehaviorSuggestions: string[] = [
    'No fuma.',
    'Fumador ocasional.',
    'Fumador crónico.',
    'Consumo de alcohol social.',
    'Bruxismo nocturno.',
  ];

  pregnancyStatusSuggestions: string[] = [
    'No aplica.',
    'No embarazada.',
    'Embarazo primer trimestre.',
    'Embarazo segundo trimestre.',
    'Embarazo tercer trimestre.',
  ];

  extraoralExamSuggestions: string[] = [
    'Simetría facial conservada.',
    'No se observan masas ni aumento de volumen.',
    'Apertura bucal dentro de rangos normales.',
    'Palpación de ganglios sin hallazgos patológicos.',
  ];

  intraoralExamSuggestions: string[] = [
    'Mucosa oral de aspecto normal.',
    'Encía con ligera inflamación marginal.',
    'Presencia de placa bacteriana generalizada.',
    'Lengua de aspecto normal, sin lesiones aparentes.',
  ];

  occlusionSuggestions: string[] = [
    'Oclusión dentro de parámetros normales.',
    'Mordida cruzada posterior.',
    'Sobremordida aumentada.',
    'Desgaste incisal compatible con bruxismo.',
  ];

  diagnosticSuggestions: string[] = [
    'Caries dental en pieza específica.',
    'Pulpitis reversible.',
    'Pulpitis irreversible.',
    'Periodontitis crónica.',
    'Gingivitis inducida por placa.',
  ];

  treatmentPlanSuggestions: string[] = [
    'Control del dolor y tratamiento de urgencia.',
    'Restauración con resina compuesta.',
    'Tratamiento de conductos en pieza afectada.',
    'Remisión a especialista en periodoncia.',
    'Control y seguimiento en consultas posteriores.',
  ];

  prognosisSuggestions: string[] = ['Favorable.', 'Reservado.', 'Desfavorable.'];

  periodontalOptions: string[] = [
    'Sin enfermedad periodontal',
    'Gingivitis',
    'Periodontitis leve',
    'Periodontitis moderada',
    'Periodontitis avanzada',
  ];

  cariesRiskOptions: string[] = ['Bajo', 'Moderado', 'Alto'];

  form = this.fb.group({
    chiefComplaint: ['', [Validators.required, Validators.minLength(4)]],
    currentIllness: [''],
    medicalHistory: [''],
    dentalHistory: [''],
    allergies: [''],
    medications: [''],
    systemicConditions: [''],
    pregnancyStatus: [''],
    riskBehaviors: [''],
    extraoralExam: [''],
    intraoralExam: [''],
    periodontalStatus: [''],
    cariesRisk: [''],
    occlusionNotes: [''],
    initialDiagnosticSummary: [''],
    initialTreatmentPlanSummary: [''],
    initialPrognosis: [''],
    bloodPressureSystolic: [null as number | null, [Validators.min(0), Validators.max(300)]],
    bloodPressureDiastolic: [null as number | null, [Validators.min(0), Validators.max(200)]],
    heartRate: [null as number | null, [Validators.min(0), Validators.max(250)]],
    respiratoryRate: [null as number | null, [Validators.min(0), Validators.max(80)]],
    temperatureCelsius: [null as number | null, [Validators.min(30), Validators.max(45)]],
    oxygenSaturation: [null as number | null, [Validators.min(0), Validators.max(100)]],
    weightKg: [null as number | null, [Validators.min(0), Validators.max(500)]],
    heightCm: [null as number | null, [Validators.min(0), Validators.max(250)]],
    bmi: [null as number | null],
  });

  async ngOnInit(): Promise<void> {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.patientId) {
      this.error = 'ID de paciente inválido.';
      this.loading = false;
      return;
    }

    // 🔑 CLAVE: resolver clinicId desde el contexto del usuario
    const clinicId = await this.patientService.getClinicIdForRoutes();

    if (!clinicId) {
      this.error = 'No se pudo determinar la clínica activa.';
      this.loading = false;
      return;
    }

    this.clinicId = clinicId;

    if (!this.clinicId) {
      this.error = 'No se pudo determinar la clínica activa.';
      this.loading = false;
      return;
    }

    try {
      const existing = await this.clinicalRecordService.getByPatient(
        this.patientId
      );

      if (existing) {
        this.recordId = existing.id ?? null;
        this.patchForm(existing);
        this.createdAt = existing.createdAt || null;
        this.updatedAt = existing.updatedAt || null;
      } else {
        this.recordId = null;
      }

      await this.loadAttachments();

    } catch (err: any) {
      console.error('Error cargando historia clínica', err);
      this.error =
        err?.error?.message ||
        err?.message ||
        'No se pudo cargar la historia clínica.';
    } finally {
      this.loading = false;
    }
  }


  patchForm(cr: ClinicalRecordDetail) {
    const vs = cr.vitalSigns || {};

    const safeBpSystolic =
      vs.bloodPressureSystolic != null && (vs.bloodPressureSystolic < 0 || vs.bloodPressureSystolic > 300)
        ? null
        : vs.bloodPressureSystolic;

    const safeBpDiastolic =
      vs.bloodPressureDiastolic != null && (vs.bloodPressureDiastolic < 0 || vs.bloodPressureDiastolic > 200)
        ? null
        : vs.bloodPressureDiastolic;

    const safeHeartRate =
      vs.heartRate != null && (vs.heartRate < 0 || vs.heartRate > 250)
        ? null
        : vs.heartRate;

    const safeRespiratoryRate =
      vs.respiratoryRate != null && (vs.respiratoryRate < 0 || vs.respiratoryRate > 80)
        ? null
        : vs.respiratoryRate;

    const safeTemperature =
      vs.temperatureCelsius != null && (vs.temperatureCelsius < 30 || vs.temperatureCelsius > 45)
        ? null
        : vs.temperatureCelsius;

    const safeOxygen =
      vs.oxygenSaturation != null && (vs.oxygenSaturation < 0 || vs.oxygenSaturation > 100)
        ? null
        : vs.oxygenSaturation;

    const safeWeight =
      vs.weightKg != null && (vs.weightKg < 0 || vs.weightKg > 500)
        ? null
        : vs.weightKg;

    const safeHeight =
      vs.heightCm != null && (vs.heightCm < 0 || vs.heightCm > 250)
        ? null
        : vs.heightCm;

    this.form.patchValue({
      chiefComplaint: cr.chiefComplaint || '',
      currentIllness: cr.currentIllness || '',
      medicalHistory: (cr as any).medicalHistory?.summary || (cr as any).medicalHistory || '',
      dentalHistory: (cr as any).dentalHistory?.summary || (cr as any).dentalHistory || '',
      allergies: cr.allergies || '',
      medications: cr.medications || '',
      systemicConditions: cr.systemicConditions || '',
      pregnancyStatus: cr.pregnancyStatus || '',
      riskBehaviors: cr.riskBehaviors || '',
      extraoralExam: (cr as any).extraoralExam?.summary || (cr as any).extraoralExam || '',
      intraoralExam: (cr as any).intraoralExam?.summary || (cr as any).intraoralExam || '',
      periodontalStatus: cr.periodontalStatus || '',
      cariesRisk: cr.cariesRisk || '',
      occlusionNotes: cr.intraoralExam?.occlusionNotes || '',
      initialDiagnosticSummary: cr.initialDiagnosticSummary || '',
      initialTreatmentPlanSummary: cr.initialTreatmentPlanSummary || '',
      initialPrognosis: cr.initialPrognosis || '',
      bloodPressureSystolic: safeBpSystolic,
      bloodPressureDiastolic: safeBpDiastolic,
      heartRate: safeHeartRate,
      respiratoryRate: safeRespiratoryRate,
      temperatureCelsius: safeTemperature,
      oxygenSaturation: safeOxygen,
      weightKg: safeWeight,
      heightCm: safeHeight,
      bmi: vs.bmi ?? null,
    });
  }

  recalculateBmi() {
    const weight = this.form.get('weightKg')?.value;
    const heightCm = this.form.get('heightCm')?.value;

    if (weight && heightCm && weight > 0 && heightCm > 0) {
      const hMeters = Number(heightCm) / 100;
      if (hMeters > 0) {
        const bmi = Number(weight) / (hMeters * hMeters);
        this.form.get('bmi')?.setValue(Number(bmi.toFixed(1)));
        return;
      }
    }
    this.form.get('bmi')?.setValue(null);
  }

  appendToTextarea(controlName: string, text: string) {
    const control = this.form.get(controlName);
    if (!control) return;

    const current = (control.value || '').toString();
    if (current.includes(text)) {
      return;
    }

    const trimmed = current.trim();
    const separator = trimmed ? (trimmed.endsWith('.') ? ' ' : '. ') : '';
    const newValue = (trimmed + separator + text).trim();
    control.setValue(newValue);
    control.markAsDirty();
  }

  setControlValue(controlName: string, value: string) {
    const control = this.form.get(controlName);
    if (!control) return;
    control.setValue(value);
    control.markAsDirty();
  }

  // ===== Modales =====
  openSaveModal() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.showSaveModal = true;
  }
  closeSaveModal() {
    this.showSaveModal = false;
  }

  openCloseModal() {
    this.showCloseModal = true;
  }
  closeCloseModal() {
    this.showCloseModal = false;
  }

  // ===== Attachments methods =====
  async loadAttachments() {
    if (!this.patientId) return;
    try {
      const page = await this.attachmentService.listGallery(this.patientId, this.attachmentsPage, this.attachmentsSize);
      // page may be a Page<T> with content
      if (Array.isArray(page)) {
        this.attachments = page as AttachmentDto[];
      } else if (page && Array.isArray((page as any).content)) {
        this.attachments = (page as any).content;
      } else if ((page as any).content) {
        this.attachments = (page as any).content || [];
      } else {
        this.attachments = [];
      }
    } catch (err: any) {
      console.error('Error loading attachments', err);
      this.attachments = [];
    }
  }

  refreshAttachments() {
    this.loadAttachments();
  }

  /**
   * Abre el file picker (botón en UI).
   */
  triggerFileInput() {
    const el = this.fileInputRef?.nativeElement as HTMLInputElement | undefined;
    if (el) {
      try { el.click(); } catch (e) { console.warn('No se pudo abrir el selector de archivos', e); }
    } else {
      console.warn('fileInputRef no está inicializado aún');
    }
  }


  /**
   * Maneja el change del input file.
   * Recibe el evento y extrae FileList de forma segura.
   */
  onFileSelected(event: Event) {
    const input = event?.target as HTMLInputElement | null;
    const files = input?.files ?? null;
    if (!files || files.length === 0) {
      this.uploadFile = null;
      return;
    }
    this.uploadFile = files[0];
    this.uploading = true;
    this.uploadProgressVisible = false;
    this.uploadProgressText = '';
    console.debug('Archivo seleccionado para upload:', this.uploadFile.name, this.uploadFile.type, this.uploadFile.size);
  }

  cancelUpload() {
    this.uploading = false;
    this.uploadFile = null;
    this.uploadNotes = '';
    this.uploadToothRef = '';
    this.uploadType = '';
    this.uploadProgressVisible = false;
    this.uploadProgressText = '';
    // reset file input value so choosing same file again triggers change
    try {
      if (this.fileInputRef?.nativeElement) {
        this.fileInputRef.nativeElement.value = '';
      }
    } catch (e) {}
  }

  async performUpload() {
    if (!this.patientId) {
      alert('ID de paciente inválido.');
      return;
    }
    if (!this.uploadFile) {
      alert('Selecciona un archivo antes de subir.');
      return;
    }



    try {
      this.uploadProgressVisible = true;
      this.uploadProgressText = 'Solicitando URL de subida…';
      console.debug('Requesting presign for file', this.uploadFile.name);

      let presign: any = null;
      try {
        presign = await this.attachmentService.generatePresign(
          this.patientId,
          this.uploadFile.name,
          this.uploadFile.type,
          this.uploadFile.size,
          this.recordId, null,
          this.uploadToothRef || undefined,
          this.uploadType || undefined,
          this.uploadNotes || undefined
        );
        console.debug('Presign response:', presign);
      } catch (errPresign) {
        console.warn('Presign request failed, will try multipart fallback', errPresign);
        presign = null;
      }

      if (presign && presign.presignedPutUrl && presign.objectKey) {
        this.uploadProgressText = 'Subiendo archivo al storage…';
        console.debug('Uploading to:', presign.presignedPutUrl);

        try {
          await this.attachmentService.uploadFileToPresignedUrl(
            presign.presignedPutUrl,
            this.uploadFile,
            this.uploadFile.type
          );
          console.debug('Upload to presigned URL OK');
        } catch (errUpload) {
          console.warn('Upload to presigned URL failed -> fallback', errUpload);
          presign = null;
        }
      }

      let saved: any = null;

      if (!presign) {
        // Fallback: subir vía multipart directamente al backend
        try {
          this.uploadProgressText = 'Subiendo archivo vía multipart al backend…';
          console.debug('Attempting multipart upload fallback');
          saved = await this.attachmentService.uploadMultipart(
            this.patientId,
            this.uploadFile,
            this.recordId,
            this.uploadToothRef || undefined,
            this.uploadType || undefined,
            this.uploadNotes || undefined,
            null
          );
          console.debug('Multipart upload saved:', saved);
        } catch (errMultipart) {
          console.error('Multipart upload also failed', errMultipart);
          throw errMultipart;
        }
      } else {
        // Confirmar link en DB cuando usamos presign
        this.uploadProgressText = 'Confirmando en base de datos…';
        const linkPayload = {
          storageKey: presign.objectKey,
          filename: this.uploadFile.name,
          contentType: this.uploadFile.type,
          sizeBytes: this.uploadFile.size,
          clinicalRecordId: this.recordId,
          toothReference: this.uploadToothRef || undefined,
          notes: this.uploadNotes || undefined,
          type: this.uploadType || undefined,
        };
        console.debug('Linking attachment with payload:', linkPayload);
        saved = await this.attachmentService.linkAttachment(this.patientId, linkPayload);
        console.debug('Attachment linked:', saved);
      }

      if (saved) {
        this.attachments.unshift(saved);
      }

      this.cancelUpload();
      await this.loadAttachments();
      this.uploadProgressText = 'Subida completada.';

    } catch (err: any) {
      console.error('Upload error', err);
      alert(err?.error?.message || err?.message || 'Error subiendo archivo.');
      this.uploadProgressText = 'Error subiendo archivo.';
    } finally {
      this.uploadProgressVisible = false;
    }
  }



  async openPreview(a: AttachmentDto) {
    if (!this.patientId || !a || !a.id) return;
    try {
      const fresh = await this.attachmentService.getAttachment(this.patientId, a.id, 300);
      this.previewAttachment = fresh;
    } catch (err) {
      this.previewAttachment = a;
    }
    this.previewing = true;
  }

  closePreview() {
    this.previewing = false;
    this.previewAttachment = null;
  }

  confirmDeleteAttachment(a: AttachmentDto) {
    const ok = confirm(`¿Eliminar la imagen "${a.filename}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    this.deleteAttachment(a);
  }

  async deleteAttachment(a: AttachmentDto) {
    if (!this.patientId) return;
    try {
      await this.attachmentService.deleteAttachment(this.patientId, a.id);
      this.attachments = this.attachments.filter(x => x.id !== a.id);
    } catch (err: any) {
      console.error('Delete attachment error', err);
      alert(err?.error?.message || err?.message || 'No se pudo borrar la imagen.');
    }
  }

  async performSave() {
    this.closeSaveModal();
    if (!this.patientId) return;

    this.saving = true;
    this.error = null;

    try {
      const formValue = this.form.value;

      const payload: ClinicalRecordDetail = {
        id: this.recordId,

        // ===== Motivo =====
        chiefComplaint: formValue.chiefComplaint || null,
        currentIllness: formValue.currentIllness || null,

        // ===== Antecedentes =====
        medicalHistory: formValue.medicalHistory
          ? { summary: formValue.medicalHistory }
          : null,

        dentalHistory: formValue.dentalHistory
          ? { summary: formValue.dentalHistory }
          : null,

        allergies: formValue.allergies || null,
        medications: formValue.medications || null,
        systemicConditions: formValue.systemicConditions || null,
        pregnancyStatus: formValue.pregnancyStatus || null,
        riskBehaviors: formValue.riskBehaviors || null,

        // ===== Examen clínico =====
        extraoralExam: formValue.extraoralExam
          ? { summary: formValue.extraoralExam }
          : null,

        intraoralExam: {
          occlusionNotes: formValue.occlusionNotes || null
        },

        // ===== SELECTS (nivel raíz) =====
        periodontalStatus: formValue.periodontalStatus || null,
        cariesRisk: formValue.cariesRisk || null,

        // ===== Diagnóstico =====
        initialDiagnosticSummary: formValue.initialDiagnosticSummary || null,
        initialTreatmentPlanSummary: formValue.initialTreatmentPlanSummary || null,
        initialPrognosis: formValue.initialPrognosis || null,

        // ===== Signos vitales =====
        vitalSigns: {
          bloodPressureSystolic: formValue.bloodPressureSystolic ?? null,
          bloodPressureDiastolic: formValue.bloodPressureDiastolic ?? null,
          heartRate: formValue.heartRate ?? null,
          respiratoryRate: formValue.respiratoryRate ?? null,
          temperatureCelsius: formValue.temperatureCelsius ?? null,
          oxygenSaturation: formValue.oxygenSaturation ?? null,
          weightKg: formValue.weightKg ?? null,
          heightCm: formValue.heightCm ?? null,
          bmi: formValue.bmi ?? null,
        }
      };

      const saved = await this.clinicalRecordService.upsertForPatient(
        this.patientId,
        payload
      );

      this.recordId = saved.id ?? this.recordId;
      this.createdAt = saved.createdAt || this.createdAt;
      this.updatedAt = saved.updatedAt || new Date().toISOString();

      this.successMessage = 'Historia clínica guardada correctamente.';
      this.showAttachImagesModal = true;



    } catch (err: any) {
      console.error('Error guardando historia clínica', err);
      this.error =
        err?.error?.message ||
        err?.message ||
        'No se pudo guardar la historia clínica.';
    } finally {
      this.saving = false;
    }
  }


  async performClose() {
    this.closeCloseModal();
    if (!this.patientId) return;

    this.saving = true;
    this.error = null;
    try {
      await this.clinicalRecordService.closeClinicalRecord(
        this.patientId
      );      this.successMessage = 'Historia clínica cerrada. Redirigiendo a la lista...';

      setTimeout(() => {
        this.router.navigateByUrl('/dashboard/pacientes');
      }, 700);
    } catch (err: any) {
      console.error('Error cerrando historia clínica', err);
      this.error = err?.error?.message || err?.message || 'No se pudo cerrar la historia clínica.';
    } finally {
      this.saving = false;
    }
  }

  onCancel() {
    this.router.navigateByUrl('/dashboard/pacientes');
  }

  async goToOdontogram() {
    if (!this.patientId) {
      this.error = 'ID de paciente inválido para abrir odontograma.';
      return;
    }

    try {
      let clinicId: number | null = null;
      try {
        const maybe = (this.patientService as any).getClinicIdForRoutes?.();
        clinicId = maybe instanceof Promise ? await maybe : maybe;
      } catch {
        clinicId = null;
      }

      // 🔹 Si no podemos resolver clinicId, navegamos igual
      if (!clinicId) {
        this.router.navigate(
          ['/dashboard/pacientes', this.patientId, 'odontograma'],
          { queryParams: this.recordId ? { clinicalRecordId: this.recordId } : {} }
        );
        return;
      }

      let chart: any = null;

      // 🔹 Intentar crear odontograma si no existe
      try {
        chart = await (this.odontogramService as any).createChart?.(
          clinicId,
          this.patientId,
          this.recordId
        );
        if (chart?.data) chart = chart.data;
      } catch (err) {
        console.warn('No se pudo crear odontograma, buscando activo…', err);
        try {
          chart = await (this.odontogramService as any).getActiveChart?.(
            clinicId,
            this.patientId
          );
          if (chart?.data) chart = chart.data;
        } catch {
          chart = null;
        }
      }

      const query: any = {};
      if (this.recordId) query.clinicalRecordId = this.recordId;
      if (chart?.id) query.chartId = chart.id;

      this.router.navigate(
        ['/dashboard/pacientes', this.patientId, 'odontograma'],
        { queryParams: query }
      );

    } catch (err: any) {
      console.error('Error al abrir odontograma', err);
      this.error =
        err?.error?.message ||
        err?.message ||
        'No se pudo abrir el odontograma.';
    }
  }
  async onExportFhir() {
    if (!this.patientId) return;
    try {
      const json = await this.clinicalRecordService.exportFhir(
        this.patientId
      );
      const blob = new Blob([json], { type: 'application/fhir+json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `clinical-record-patient-${this.patientId}.json`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exportando FHIR', err);
      this.error = err?.error?.message || err?.message || 'No se pudo exportar la historia clínica en FHIR.';
    }
  }

  formatDate(value?: string | Date | null) {
    if (!value) return '—';
    const d = new Date(value as any);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  onSkipAttachments() {
    this.showAttachImagesModal = false;
    this.goToOdontogram();
  }

  onAttachmentsSaved() {
    this.showAttachImagesModal = false;
    this.goToOdontogram();
  }

}
