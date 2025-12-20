import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PatientService } from '../../../../core/services/patient.service';
import { ClinicalRecordService } from '../../../../core/services/clinical-record.service';
import { PatientDetail } from '../../../../core/models/patient.model';

@Component({
  standalone: true,
  selector: 'app-patient-detail',
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],

  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header simplificado -->
        <div class="mb-6">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <!-- Volver al listado + ID -->
            <div class="flex items-center gap-3">
              <button
                class="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition"
                [routerLink]="['/dashboard/pacientes']">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Volver al listado
              </button>

              <div *ngIf="patientId" class="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                <span class="text-xs text-slate-500 font-medium">ID:</span>
                <span class="ml-2 text-sm font-semibold text-slate-800">{{ patientId }}</span>
              </div>
            </div>
          </div>

          <!-- Contenido principal reorganizado -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- COLUMNA IZQUIERDA UNIFICADA (70%) -->
            <div class="lg:col-span-8 space-y-6">

              <!-- Tarjeta 1: Título + Información del Paciente -->
              <div class="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">

                <!-- Sección del título -->
                <div class="p-6 border-b border-slate-100">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-3">
                        <h1 class="text-xl font-bold text-slate-900">
                          {{ viewMode === 'summary' ? 'Resumen del Paciente' : 'Editar Paciente' }}
                        </h1>
                        <span *ngIf="viewMode === 'summary'"
                              class="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Modo Vista
                      </span>
                        <span *ngIf="viewMode === 'edit'"
                              class="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Modo Edición
                      </span>
                      </div>
                      <div class="flex items-center gap-4 mt-2">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full"
                               [ngClass]="{
                              'bg-emerald-500': hasClinicalRecord && clinicalRecordStatus === 'ACTIVE',
                              'bg-amber-500': hasClinicalRecord && clinicalRecordStatus !== 'ACTIVE',
                              'bg-slate-300': !hasClinicalRecord
                             }"></div>
                          <span class="text-sm text-slate-700">
                          Historia Clínica:
                          <span [ngClass]="{
                            'text-emerald-600': hasClinicalRecord && clinicalRecordStatus === 'ACTIVE',
                            'text-amber-600': hasClinicalRecord && clinicalRecordStatus !== 'ACTIVE',
                            'text-slate-500': !hasClinicalRecord
                          }">
                            {{ hasClinicalRecord ? (clinicalRecordStatus || 'ACTIVA') : 'NO CREADA' }}
                          </span>
                        </span>
                        </div>
                        <span class="text-sm text-slate-500">
                        Últ. actualización: {{ formatDate(clinicalRecordUpdatedAt) || 'Reciente' }}
                      </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Sección compacta de Foto + Datos Básicos -->
                <div class="p-6">
                  <div class="flex flex-col md:flex-row items-start gap-6">
                    <!-- Foto de perfil compacta -->
                    <div class="flex flex-col items-center gap-3">
                      <div class="relative">
                        <div
                          *ngIf="!previewPhotoUrl && !photoUrl"
                          class="h-28 w-28 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-2xl font-bold border-4 border-white shadow">
                          {{ initials }}
                        </div>

                        <img
                          *ngIf="previewPhotoUrl || photoUrl"
                          [src]="previewPhotoUrl || photoUrl"
                          alt="Foto paciente"
                          class="h-28 w-28 rounded-xl object-cover border-4 border-white shadow"
                          (error)="onPhotoLoadError()"
                        />

                        <span
                          *ngIf="previewPhotoUrl"
                          class="absolute -top-1 -right-1 bg-emerald-500 text-[10px] text-white px-1.5 py-0.5 rounded-full shadow font-medium">
                        Nuevo
                      </span>
                      </div>

                      <div class="text-center space-y-2">
                        <div class="flex gap-2">
                          <button
                            type="button"
                            (click)="fileInput?.click()"
                            class="px-2 py-1 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:bg-slate-50 transition text-xs font-medium flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            Cambiar
                          </button>
                          <button
                            *ngIf="photoUrl"
                            type="button"
                            (click)="clearPhoto()"
                            class="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 transition text-xs font-medium flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Eliminar
                          </button>
                        </div>
                        <p class="text-xs text-slate-400">
                          JPG/PNG, 256×256
                        </p>
                      </div>
                    </div>

                    <input
                      type="file"
                      #fileInputRef
                      accept="image/*"
                      class="hidden"
                      (change)="onPhotoSelected($any($event.target).files)"
                      #fileInput />

                    <!-- Información principal compacta -->
                    <div class="flex-1">
                      <!-- Nombre y documento en línea -->
                      <div class="mb-4">
                        <h2 class="text-xl font-semibold text-slate-900 mb-2">
                          {{ form.get('givenName')?.value || 'Nombre' }} {{ form.get('familyName')?.value || 'No especificado' }}
                        </h2>
                        <div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>{{ form.get('documentType')?.value || 'Doc' }}: {{ form.get('documentNumber')?.value || 'N/A' }}</span>
                          </div>
                          <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>{{ calculateAge(form.get('birthDate')?.value || undefined) }}</span>
                          </div>
                          <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            </svg>
                            <span>{{ form.get('state')?.value || 'N/A' }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Grid compacto de información de contacto -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <!-- Teléfono -->
                        <div class="bg-slate-50 rounded-lg p-3">
                          <div class="flex items-center gap-2 mb-1">
                            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span class="text-xs font-medium text-slate-700">Teléfono (WhatsApp)</span>
                          </div>
                          <p class="text-sm font-medium text-slate-900">
                            {{ phoneMobileDisplay ? '+591 ' + phoneMobileDisplay : 'No disponible' }}
                          </p>
                        </div>

                        <!-- Email -->
                        <div class="bg-slate-50 rounded-lg p-3">
                          <div class="flex items-center gap-2 mb-1">
                            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-xs font-medium text-slate-700">Correo Electrónico</span>
                          </div>
                          <p class="text-sm font-medium text-slate-900 truncate">
                            {{ form.get('email')?.value || 'No disponible' }}
                          </p>
                        </div>

                        <!-- Dirección completa (full width si hay datos) -->
                        <div *ngIf="form.get('addressLine')?.value"
                             class="sm:col-span-2 bg-slate-50 rounded-lg p-3">
                          <div class="flex items-center gap-2 mb-1">
                            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            </svg>
                            <span class="text-xs font-medium text-slate-700">Dirección</span>
                          </div>
                          <p class="text-sm text-slate-700">
                            {{ form.get('addressLine')?.value }}
                            <span *ngIf="form.get('district')?.value" class="text-slate-500">
                            , {{ form.get('district')?.value }}
                          </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mensajes de carga y error -->
                <div *ngIf="loading" class="p-6 border-t border-slate-100">
                  <div class="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm text-slate-600">Cargando datos del paciente…</span>
                  </div>
                </div>

                <div *ngIf="error && !loading" class="p-6 border-t border-slate-100">
                  <div class="rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-3">
                    <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-sm text-red-700">{{ error }}</span>
                  </div>
                </div>
              </div>

              <!-- Tarjeta 2: Formulario de Edición (solo visible en modo edición) -->
              <form
                *ngIf="viewMode === 'edit' && !loading && !error"
                [formGroup]="form"
                (ngSubmit)="openConfirmSave()"
                id="patientForm"
                class="bg-white rounded-2xl shadow-md border border-slate-100 p-6">

                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-semibold text-slate-900">Editar Información del Paciente</h3>
                  <button
                    type="button"
                    (click)="viewMode = 'summary'"
                    class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-medium text-sm">
                    Cancelar y volver al resumen
                  </button>
                </div>

                <!-- Mensaje error foto -->
                <div
                  *ngIf="photoError"
                  class="mb-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 flex items-start gap-2 text-sm text-rose-700">
                  ⚠️ {{ photoError }}
                </div>

                <!-- Grid de campos compacto -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Nombres y Apellidos -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      formControlName="givenName"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Ingrese nombres" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      formControlName="familyName"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Ingrese apellidos" />
                  </div>

                  <!-- Documento -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Tipo Documento</label>
                    <select
                      formControlName="documentType"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition">
                      <option value="">Seleccionar</option>
                      <option value="CI">CI</option>
                      <option value="PASSPORT">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Número Documento</label>
                    <input
                      type="text"
                      formControlName="documentNumber"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                      placeholder="Número" />
                  </div>

                  <!-- Fecha nacimiento -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Fecha Nacimiento</label>
                    <input
                      type="date"
                      formControlName="birthDate"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition" />
                  </div>

                  <!-- Teléfono -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Teléfono (WhatsApp) *</label>
                    <div class="relative">
                      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                        +591
                      </div>
                      <input
                        type="tel"
                        [value]="phoneMobileDisplay"
                        (input)="onPhoneMobileInput($any($event.target).value)"
                        (blur)="onPhoneMobileBlur()"
                        placeholder="76543210"
                        class="w-full rounded-lg border border-slate-300 px-3 py-2 pl-14 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      />
                    </div>
                    <p *ngIf="phoneMobileInvalid && phoneMobileTouched" class="text-xs text-rose-600 mt-1">
                      {{ phoneMobileErrorText }}
                    </p>
                  </div>

                  <!-- Email -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      formControlName="email"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                      placeholder="ejemplo@email.com" />
                  </div>

                  <!-- Departamento -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                    <select
                      formControlName="state"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition">
                      <option value="">Seleccionar</option>
                      <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
                    </select>
                  </div>

                  <!-- Zona/Distrito -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Zona / Distrito</label>
                    <input
                      type="text"
                      formControlName="district"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                      placeholder="Zona o distrito" />
                  </div>

                  <!-- Dirección (full width) -->
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      formControlName="addressLine"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                      placeholder="Dirección completa" />
                  </div>
                </div>

                <!-- Botón Guardar -->
                <div class="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    class="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 transition font-medium text-sm shadow-sm hover:shadow">
                    Guardar Cambios
                  </button>
                </div>
              </form>

            </div>

            <!-- COLUMNA DERECHA (30%) -->
            <div class="lg:col-span-4 space-y-4">
              <!-- Acciones rápidas compactas -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Acciones Rápidas
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  <!-- Historia Clínica -->
                  <button
                    (click)="goToClinicalRecord()"
                    class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition group text-left">
                    <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">Historia Clínica</p>
                      <p class="text-xs text-slate-500 truncate">{{ hasClinicalRecord ? 'Ver/Editar' : 'Crear nueva' }}</p>
                    </div>
                  </button>

                  <!-- Imágenes clínicas -->
                  <a
                    [routerLink]="['/dashboard/pacientes', patientId, 'imagenes-clinicas']"
                    class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200
         hover:border-fuchsia-300 hover:bg-fuchsia-50 transition group">
                    <div class="w-8 h-8 rounded-lg bg-fuchsia-100 flex items-center justify-center
              text-fuchsia-600 group-hover:bg-fuchsia-200">
                      🖼
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">
                        Imágenes clínicas
                      </p>
                      <p class="text-xs text-slate-500 truncate">
                        Evidencia visual del paciente
                      </p>
                    </div>
                  </a>


                  <!-- Editar Paciente -->
                  <button
                    *ngIf="viewMode === 'summary'"
                    (click)="goToEdit()"
                    class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition group text-left">
                    <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">Editar Paciente</p>
                      <p class="text-xs text-slate-500 truncate">Modificar datos</p>
                    </div>
                  </button>

                  <!-- Consultas -->
                  <a
                    [routerLink]="['/dashboard/pacientes', patientId, 'consultas']"
                    class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition group">
                    <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200">
                      🩺
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">Consultas</p>
                      <p class="text-xs text-slate-500 truncate">Historial médico</p>
                    </div>
                  </a>

                  <!-- Timeline clínico -->
                  <a
                    [routerLink]="['/dashboard/pacientes', patientId, 'timeline']"
                    class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200
         hover:border-violet-300 hover:bg-violet-50 transition group">
                    <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center
              text-violet-600 group-hover:bg-violet-200">
                      🕒
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">Timeline clínico</p>
                      <p class="text-xs text-slate-500 truncate">Evolución y eventos</p>
                    </div>
                  </a>


                  <!-- Citas -->
                  <a
                    [routerLink]="['/dashboard/pacientes', patientId, 'citas']"
                    class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition group">
                    <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-200">
                      📅
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">Citas</p>
                      <p class="text-xs text-slate-500 truncate">Agenda y citas</p>
                    </div>
                  </a>

                  <!-- Eliminar Paciente -->
                  <button
                    (click)="openDeleteConfirm()"
                    class="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition group text-left">
                    <div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-200">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">Eliminar Paciente</p>
                      <p class="text-xs text-slate-500 truncate">Eliminar permanentemente</p>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Información adicional compacta -->
              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Información Adicional
                </h3>
                <div class="space-y-3">
                  <!-- Fecha de nacimiento -->
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Fecha de Nacimiento:</span>
                    <span class="text-sm font-medium text-slate-900">
                    {{ formatDate(form.get('birthDate')?.value) || 'N/A' }}
                  </span>
                  </div>
                  <!-- Documento completo -->
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Documento:</span>
                    <span class="text-sm font-medium text-slate-900">
                    {{ form.get('documentType')?.value || 'N/A' }} {{ form.get('documentNumber')?.value || '' }}
                  </span>
                  </div>
                  <!-- Ubicación completa -->
                  <div *ngIf="form.get('state')?.value" class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Ubicación:</span>
                    <span class="text-sm font-medium text-slate-900 text-right">
                    {{ form.get('state')?.value }}
                      <span *ngIf="form.get('district')?.value" class="text-slate-500"> / {{ form.get('district')?.value }}</span>
                  </span>
                  </div>
                </div>
              </div>

              <!-- Información clínica compacta -->
              <div *ngIf="hasClinicalRecord" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Historia Clínica
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Estado:</span>
                    <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [ngClass]="{
                          'bg-emerald-100 text-emerald-700': clinicalRecordStatus === 'ACTIVE',
                          'bg-slate-100 text-slate-700': clinicalRecordStatus !== 'ACTIVE'
                        }">
                    {{ clinicalRecordStatus || 'ACTIVA' }}
                  </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="bg-slate-50 rounded-lg p-2">
                      <p class="text-xs text-slate-500">Creado</p>
                      <p class="text-xs font-medium text-slate-700">{{ formatDate(clinicalRecordCreatedAt) }}</p>
                    </div>
                    <div class="bg-slate-50 rounded-lg p-2">
                      <p class="text-xs text-slate-500">Última modificación</p>
                      <p class="text-xs font-medium text-slate-700">{{ formatDate(clinicalRecordUpdatedAt) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal confirm delete -->
      <div *ngIf="showConfirmDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div class="p-6 border-b border-slate-200">
            <h3 class="text-lg font-semibold text-slate-900">Confirmar eliminación</h3>
          </div>
          <div class="p-6">
            <div class="flex items-start gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.73 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-900 mb-1">¿Eliminar paciente permanentemente?</p>
                <p class="text-sm text-slate-600">
                  Esta acción no se puede deshacer. Se eliminarán todos los datos, incluyendo historial clínico y citas.
                </p>
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <button
                (click)="showConfirmDelete = false"
                class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-medium">
                Cancelar
              </button>
              <button
                (click)="confirmDelete()"
                class="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600 transition font-medium">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal confirm update -->
      <div *ngIf="showConfirmSave" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div class="p-6 border-b border-slate-200">
            <h3 class="text-lg font-semibold text-slate-900">Confirmar actualización</h3>
          </div>
          <div class="p-6">
            <div class="flex items-start gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-900 mb-1">¿Actualizar datos del paciente?</p>
                <p class="text-sm text-slate-600">
                  Se actualizarán los datos del paciente en el sistema.
                </p>
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <button
                (click)="showConfirmSave = false"
                class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-medium">
                Cancelar
              </button>
              <button
                (click)="confirmSave()"
                class="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 transition font-medium">
                Sí, actualizar
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
  `,
})
export class PatientDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private clinicalRecordService = inject(ClinicalRecordService);

  // control de vista
  viewMode: 'summary' | 'edit' = 'summary';
  clinicId!: number;
  patientId: number | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  photoUrl: string | null = null;
  previewPhotoUrl: string | null = null;
  photoError: string | null = null;

  showConfirmDelete = false;
  showConfirmSave = false;

  // departamentos de Bolivia
  departments: string[] = [
    'Beni',
    'Chuquisaca',
    'Cochabamba',
    'La Paz',
    'Oruro',
    'Pando',
    'Potosí',
    'Santa Cruz',
    'Tarija'
  ];

  // display del teléfono (solo 8 dígitos)
  phoneMobileDisplay = '';

  // Clinical record meta
  hasClinicalRecord = false;
  clinicalRecordStatus: string | null = null;
  clinicalRecordCreatedAt: string | null = null;
  clinicalRecordUpdatedAt: string | null = null;
  loadingClinicalRecord = false;

  form = this.fb.group({
    givenName: ['', [Validators.required, Validators.minLength(2)]],
    familyName: ['', [Validators.required, Validators.minLength(2)]],
    documentType: [''],
    documentNumber: [''],
    birthDate: [''],
    phoneMobile: [''], // guarda +591XXXXXXXX
    email: ['', [Validators.email]],
    state: [''],
    district: [''],
    addressLine: [''],
  });

  get initials(): string {
    const g = this.form.get('givenName')?.value || '';
    const f = this.form.get('familyName')?.value || '';
    const g1 = g ? g.trim().charAt(0).toUpperCase() : '';
    const f1 = f ? f.trim().charAt(0).toUpperCase() : '';
    return (g1 + f1) || 'P';
  }

  // --------- helpers teléfono móvil ---------
  private digitsFromInput(raw?: string | null): string {
    if (!raw) return '';
    const d = raw.replace(/\D/g, '');
    let trimmed = d;
    if (trimmed.startsWith('591')) trimmed = trimmed.substring(3);
    return trimmed.substring(0, 8);
  }

  onPhoneMobileInput(raw: string) {
    const digits = this.digitsFromInput(raw);
    this.phoneMobileDisplay = digits;
    const val = digits.length === 8 ? `+591${digits}` : '';
    this.form.get('phoneMobile')?.setValue(val);
  }

  onPhoneMobileBlur() {
    this.form.get('phoneMobile')?.markAsTouched();
  }

  get phoneMobileValid(): boolean {
    const v = this.form.get('phoneMobile')?.value as string | null | undefined;
    if (!v) return false;
    return /^\+591\d{8}$/.test(v);
  }

  get phoneMobileTouched(): boolean {
    return !!this.form.get('phoneMobile')?.touched;
  }

  get phoneMobileInvalid(): boolean {
    return this.phoneMobileTouched && !this.phoneMobileValid;
  }

  get phoneMobileErrorText(): string {
    return 'Debe tener 8 dígitos. Revisa el número nuevamente.';
  }

  // ------------------------------------------

  async ngOnInit(): Promise<void> {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.patientId) {
      this.error = 'ID de paciente inválido.';
      this.loading = false;
      return;
    }

    try {
      const detail: PatientDetail = await this.patientService.getPatient(this.patientId);
      this.patchForm(detail);

      const clinicId = await this.patientService.getClinicIdForRoutes();
      const apiBase = this.patientService.apiBaseUrl;
      this.photoUrl = clinicId
        ? `${apiBase}/api/clinic/${clinicId}/patients/${this.patientId}/photo`
        : null;

      // inicializar phoneMobileDisplay desde el valor (+591XXXXXXXX → XXXXXXXX)
      const v = this.form.get('phoneMobile')?.value as string | null | undefined;
      if (v && /^\+591\d{8}$/.test(v)) {
        this.phoneMobileDisplay = v.replace(/\D/g, '').substring(3);
      } else {
        this.phoneMobileDisplay = '';
      }

      // carga meta de historia clínica (no bloqueante)
      this.loadClinicalRecordMeta().catch(err => console.warn('CR meta load failed', err));
    } catch (err: any) {
      console.error('Error cargando paciente', err);
      this.error = err?.error?.message || err?.message || 'No se pudo cargar el paciente.';
    } finally {
      this.loading = false;
    }
  }

  patchForm(p: PatientDetail) {
    this.form.patchValue({
      givenName: p.givenName,
      familyName: p.familyName,
      documentType: p.documentType || '',
      documentNumber: p.documentNumber || '',
      birthDate: p.birthDate ? p.birthDate.substring(0, 10) : '',
      phoneMobile: p.phoneMobile || '',
      email: p.email || '',
      state: p.state || '',
      district: p.district || '',
      addressLine: p.addressLine || '',
    });
  }

  // FOTO ----------------------------------------------

  onPhotoSelected(files: FileList | null) {
    this.photoError = null;
    if (!files || files.length === 0 || !this.patientId) return;

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      this.photoError = 'El archivo seleccionado no es una imagen.';
      return;
    }

    if (this.previewPhotoUrl) {
      URL.revokeObjectURL(this.previewPhotoUrl);
    }
    this.previewPhotoUrl = URL.createObjectURL(file);

    this.uploadPhoto(file);
  }

  async uploadPhoto(file: File) {
    if (!this.patientId) return;
    try {
      await this.patientService.uploadPatientPhoto(this.patientId, file);

      const clinicId = await this.patientService.getClinicIdForRoutes();
      const apiBase = this.patientService.apiBaseUrl;
      this.photoUrl = clinicId
        ? `${apiBase}/api/clinic/${clinicId}/patients/${this.patientId}/photo?ts=${Date.now()}`
        : null;

      this.photoError = null;
    } catch (err: any) {
      console.error('Error subiendo foto', err);
      this.photoError = err?.error?.message || err?.message || 'No se pudo subir la foto.';
    }
  }

  onPhotoLoadError() {
    this.photoUrl = null;
    if (this.previewPhotoUrl) {
      URL.revokeObjectURL(this.previewPhotoUrl);
      this.previewPhotoUrl = null;
    }
  }

  clearPhoto() {
    this.previewPhotoUrl && URL.revokeObjectURL(this.previewPhotoUrl);
    this.previewPhotoUrl = null;
    this.photoUrl = null;
  }

  // GUARDAR / ELIMINAR --------------------------------

  openConfirmSave() {
    this.form.markAllAsTouched();
    this.form.get('phoneMobile')?.markAsTouched();
    if (this.form.invalid || !this.patientId || !this.phoneMobileValid) return;
    this.showConfirmSave = true;
  }

  async confirmSave() {
    this.showConfirmSave = false;
    await this.doSave();
  }

  private async doSave() {
    if (this.form.invalid || !this.patientId || !this.phoneMobileValid) return;
    this.saving = true;

    try {
      const payload = this.form.value;
      await this.patientService.updatePatient(this.patientId, payload as any);

      // Después de guardar, volver al modo resumen
      this.viewMode = 'summary';

      // Mostrar mensaje de éxito
      await this.router.navigateByUrl('/dashboard/pacientes', {
        state: { message: 'Paciente actualizado correctamente.' },
      });
    } catch (err: any) {
      console.error('Error actualizando paciente', err);
      this.error = err?.error?.message || err?.message || 'No se pudo actualizar el paciente.';
    } finally {
      this.saving = false;
    }
  }

  openDeleteConfirm() {
    this.showConfirmDelete = true;
  }

  async confirmDelete() {
    if (!this.patientId) return;
    try {
      await this.patientService.deletePatient(this.patientId);
      this.showConfirmDelete = false;
      await this.router.navigateByUrl('/dashboard/pacientes', {
        state: { message: 'Paciente eliminado correctamente.' },
      });
    } catch (err: any) {
      console.error('Error eliminando paciente', err);
      this.error = err?.error?.message || err?.message || 'No se pudo eliminar el paciente.';
      this.showConfirmDelete = false;
    }
  }

  goBack() {
    this.router.navigateByUrl('/dashboard/pacientes');
  }

  // ===== Clinical record helpers =====
  private async loadClinicalRecordMeta(): Promise<void> {
    if (!this.patientId) return;
    this.loadingClinicalRecord = true;
    this.hasClinicalRecord = false;
    this.clinicalRecordStatus = null;
    this.clinicalRecordCreatedAt = null;
    this.clinicalRecordUpdatedAt = null;

    try {
      const cr = await this.clinicalRecordService.getByPatient(
        this.patientId
      );
      if (cr) {
        this.hasClinicalRecord = true;
        this.clinicalRecordStatus = (cr as any).status || 'ACTIVE';
        this.clinicalRecordCreatedAt = (cr as any).createdAt || null;
        this.clinicalRecordUpdatedAt = (cr as any).updatedAt || null;
      } else {
        this.hasClinicalRecord = false;
      }
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || String(err);
      if (String(msg).toLowerCase().includes('no tiene historia cl') || err?.status === 404) {
        this.hasClinicalRecord = false;
      } else {
        console.warn('loadClinicalRecordMeta error', err);
      }
    } finally {
      this.loadingClinicalRecord = false;
    }
  }

  goToClinicalRecord() {
    if (!this.patientId) return;
    this.router.navigate(['/dashboard/pacientes', this.patientId, 'historia-clinica']);
  }

  // Método para ir al modo edición
  goToEdit() {
    this.viewMode = 'edit';
  }

  formatDate(value?: string | Date | null) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  calculateAge(birthDate?: string): string {
    if (!birthDate) return '—';

    try {
      const birth = new Date(birthDate);
      const today = new Date();

      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return age + ' años';
    } catch {
      return '—';
    }
  }
}
