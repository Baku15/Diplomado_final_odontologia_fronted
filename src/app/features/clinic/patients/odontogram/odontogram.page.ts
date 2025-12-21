import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OdontogramService } from '../../../../core/services/odontogram.service';
import { OdontogramSvgComponent } from './odontogram-svg.component';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { ToothAttachmentDto } from '../../../../core/models/odontogram.model';
import {
  DentalChartDto,
  ToothDto,
  UpsertToothRequest,
  AddProcedureRequest,
  DentalProcedureDto
} from '../../../../core/models/odontogram.model';
import { FormsModule } from '@angular/forms';
import { ConsultationService } from '../../../../core/services/consultation.service';
import { ClinicalConsultationDto } from '../../../../core/models/consultation.model';
import { CloseConsultationModal } from '../../consultations/close-consultation.modal';
import { DatePipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-odontogram-page',
  imports: [
    CommonModule,
    OdontogramSvgComponent,
    RouterLink,
    FormsModule,
    CloseConsultationModal,
    DatePipe
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">

      <!-- HEADER SIMPLE -->
      <div class="mb-4">
        <h1 class="text-2xl font-semibold">Odontograma</h1>
      </div>

      <!-- Botones principales con mejor diseño -->
      <div class="flex flex-col gap-1 mb-1">

        <!-- Grupo de acciones primarias -->
        <div class="flex gap-1">
          <!-- Crear odontograma -->
          <button
            (click)="onCreateChart()"
            *ngIf="!chart && !loading"
            class="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Crear Odontograma
          </button>

        <!-- Acción secundaria con mejor estilo -->
        <div class="flex justify-end">
          <button
            [routerLink]="['/dashboard/pacientes', patientId, 'historia-clinica']"
            class="px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 transition-all duration-200 flex items-center gap-2 group">
            <svg class="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Ver Historia Clínica Completa
          </button>
        </div>

      </div>

      <!-- LOADING / ERROR -->
      <div *ngIf="loading" class="p-6 bg-white rounded shadow text-sm">Cargando odontograma…</div>
      <div *ngIf="error" class="p-6 bg-rose-50 text-rose-700 rounded border">{{ error }}</div>

      <!-- NOTIFICACIÓN DE ÉXITO (aparece automáticamente y desaparece) -->
      <div *ngIf="showSuccessMessage"
           class="fixed top-4 right-4 z-[130] animate-fade-in">
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-emerald-800">{{ uploadMessage }}</p>
            </div>
            <div class="ml-auto pl-3">
              <button
                class="inline-flex text-emerald-500 hover:text-emerald-700"
                (click)="showSuccessMessage = false">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN LAYOUT -->
      <div *ngIf="!loading && !error && chart" class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">

        <!-- LEFT: odontograma SVG (only the drawing) -->
        <div>

          <app-odontogram-svg
            [teeth]="chart.teeth ?? []"
            [chartProcedures]="chart.procedures ?? []"
            (selectTooth)="onSelectTooth($event)"
            (edit)="openEditTooth($event)"
            (procedure)="openAddProcedure($event)">
          </app-odontogram-svg>
        </div>

        <!-- RIGHT: single panel with 'Diente seleccionado' + inline procedures -->
        <aside class="w-full">
          <!-- 🆕 BOTÓN CERRAR HISTORIA (ahora en panel derecho) -->
          <button
            (click)="showConfirmCloseChartModal = true"
            *ngIf="chart && chart.status === 'ACTIVE'"
            class="mb-4 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-medium hover:from-amber-700 hover:to-amber-600 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Cerrar Historia Odontológica
          </button>

          <!-- 🔴 BOTÓN FINALIZAR CONSULTA - MOVIDO AQUÍ -->
          <button
            *ngIf="activeConsultation?.status === 'ACTIVE'"
            (click)="showCloseConsultationModal = true"
            class="mb-4 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 text-white text-sm font-medium hover:from-rose-700 hover:to-rose-600 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 animate-pulse-subtle">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Finalizar Consulta
          </button>

          <!-- Selected tooth card -->
          <div class="bg-slate-50 rounded p-4 border sticky top-44 selected-tooth">
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium">Diente seleccionado</div>
              <div *ngIf="selectedToothNumber" class="text-xs text-slate-400">#{{ selectedToothNumber }}</div>
            </div>

            <ng-container *ngIf="selectedToothNumber; else noneSelected">
              <div class="text-xs text-slate-500 mb-1">Estado</div>
              <div class="mb-2 font-semibold text-sm">{{ selectedTooth?.toothStatus || '—' }}</div>

              <div class="text-xs text-slate-500 mb-1">Notas</div>
              <div class="mb-3 text-sm text-slate-700 p-2 bg-white rounded border">
                {{ selectedTooth?.notes || 'Sin notas' }}
              </div>

              <!-- Oculta la lista pequeña si el drawer de procedimientos está abierto -->
              <div *ngIf="proceduresForSelected().length && !showProceduresDrawer" class="mb-3">
                <div class="text-xs text-slate-500 mb-1">Procedimientos</div>
                <ul class="space-y-2 text-sm">
                  <li *ngFor="let pr of proceduresForSelected()" class="p-2 bg-white rounded border">
                    <div class="flex justify-between items-start">
                      <div>
                        <div class="font-medium">
                          {{ pr.type }} <span class="text-xs text-slate-400">({{ pr.surface || 'G' }})</span>
                        </div>
                        <div class="text-xs text-slate-600">{{ pr.description }}</div>
                      </div>

                      <div class="flex flex-col items-end gap-2">
                        <div class="text-xs text-slate-400">{{ pr.createdAt ? (pr.createdAt | date:'short') : '' }}</div>

                        <!-- Mostrar botones Finalizar + Editar juntos cuando NO finalizado -->
                        <ng-container *ngIf="!isProcedureCompleted(pr); else completedTplSmall">
                          <div class="flex gap-2">
                            <button
                              class="px-2 py-1 rounded text-sm bg-amber-600 text-white border-amber-600 hover:opacity-95"
                              (click)="promptCompleteProcedure(pr)">
                              Finalizar
                            </button>

                            <button
                              class="px-2 py-1 rounded text-sm bg-indigo-600 text-white border-indigo-600 hover:opacity-95"
                              (click)="openAddProcedure(selectedToothNumber!, pr)">
                              Editar
                            </button>
                          </div>
                        </ng-container>

                        <ng-template #completedTplSmall>
                          <!-- Botón verde estilizado y disabled para indicar finalizado -->
                          <button class="px-3 py-1 rounded text-sm bg-emerald-600 text-white cursor-default" disabled>
                            Finalizado
                          </button>
                        </ng-template>

                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <div class="flex gap-2">
                <button class="flex-1 px-3 py-2 rounded bg-indigo-600 text-white text-sm" (click)="openEditTooth(selectedToothNumber!)">Editar</button>
                <button class="flex-1 px-3 py-2 rounded border text-sm" (click)="openAddProcedure(selectedToothNumber!)">Añadir procedimiento</button>
              </div>

              <!-- IMÁGENES DEL DIENTE -->
              <div class="mt-4">
                <div class="text-xs text-slate-500 mb-1">Imágenes del diente</div>

                <div class="flex gap-2 mb-2">
                  <button
                    class="px-3 py-1 rounded bg-sky-600 text-white text-sm"
                    (click)="fileInput.click()"
                    [disabled]="uploadingImage">
                    Subir imagen / archivo
                  </button>
                  <div *ngIf="uploadingImage" class="text-xs text-sky-600 mt-1 flex items-center">
                    <svg class="animate-spin h-3 w-3 mr-1 text-sky-600" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subiendo imagen…
                  </div>

                  <div *ngIf="uploadError" class="text-xs text-rose-600 mt-1">
                    {{ uploadError }}
                  </div>

                  <input
                    #fileInput
                    type="file"
                    accept="image/*"
                    hidden
                    (change)="onFileSelected($event)" />
                </div>

                <div *ngIf="toothAttachments.length === 0"
                     class="text-xs text-slate-400">
                  No hay imágenes para este diente.
                </div>

                <ul *ngIf="toothAttachments.length"
                    class="grid grid-cols-2 gap-2">
                  <li *ngFor="let img of toothAttachments"
                      class="border rounded p-2 text-xs flex flex-col gap-1">

                    <img
                      *ngIf="img.thumbnailUrl || img.downloadUrl"
                      [src]="img.thumbnailUrl || img.downloadUrl"
                      class="w-full h-24 object-cover rounded cursor-pointer"
                      title="Ver imagen"
                      (click)="openImage(img.downloadUrl)" />

                    <div class="truncate font-medium">{{ img.filename }}</div>

                    <div class="text-slate-400 text-[11px]">
                      {{ img.createdAt | date:'short' }}
                    </div>
                  </li>
                </ul>

                <button
                  *ngIf="selectedToothImages.length > toothAttachments.length"
                  class="mt-2 text-xs text-sky-600 underline"
                  (click)="openImagesModal()">
                  Ver imágenes ({{ selectedToothImages.length }})
                </button>
              </div>

            </ng-container>

            <ng-template #noneSelected>
              <div class="text-sm text-slate-500">Ningún diente seleccionado. Haz clic en un diente.</div>
            </ng-template>
          </div>

          <!-- chips -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button *ngFor="let c of chips" (click)="onChip(c.key)"
                    class="px-3 py-1 rounded-full border text-xs"
                    [class.bg-sky-50]="activeChip===c.key">{{ c.label }}</button>
          </div>

          <!-- Inline procedures panel (ONLY HERE) -->
          <div class="mt-4" *ngIf="showProceduresDrawer">
            <div class="bg-white rounded border p-4 shadow-sm procedures-inline">

              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="text-lg font-semibold">Procedimientos — {{ filteredProcedures().length }}</h3>
                  <div class="text-xs text-slate-500">
                    <ng-container *ngIf="procFilterTooth !== ''; else allHint">
                      Mostrando procedimientos de <strong>Diente {{ procFilterTooth }}</strong>.
                    </ng-container>
                    <ng-template #allHint>Filtra y navega. Cierra con el botón.</ng-template>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button class="px-3 py-1 border rounded text-sm" (click)="closeProceduresDrawer()">Cerrar</button>
                  <button class="px-3 py-1 border rounded text-sm" (click)="openAllProcedures()">Ver todos</button>
                </div>
              </div>

              <!-- filtros + orden -->
              <div class="mb-3 flex flex-wrap gap-2 items-center">
                <label class="text-xs text-slate-600">Filtrar por diente:</label>
                <select [(ngModel)]="procFilterTooth" class="rounded border px-2 py-1 text-sm">
                  <option value="">Todos</option>
                  <option *ngFor="let t of uniqueTeeth()" [value]="t">Diente {{ t }}</option>
                </select>

                <label class="text-xs text-slate-600 ml-3">Buscar:</label>
                <input [(ngModel)]="procFilterText" placeholder="tipo o descripción..." class="rounded border px-2 py-1 text-sm flex-1 min-w-[120px]" />

                <!-- Orden control -->
                <label class="text-xs text-slate-600 ml-3">Ordenar:</label>
                <select [(ngModel)]="procSort" class="rounded border px-2 py-1 text-sm">
                  <option value="desc">Últimos primero</option>
                  <option value="asc">Más antiguos primero</option>
                </select>
              </div>

              <!-- listado -->
              <div class="max-h-proc overflow-auto pr-2">
                <div *ngIf="filteredProcedures().length === 0" class="p-3 text-sm text-slate-500 border rounded">
                  No hay procedimientos que mostrar.
                </div>

                <div *ngFor="let p of filteredProcedures()" class="p-3 border rounded mb-2">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="font-medium">
                        {{ p.type }} <span class="text-xs text-slate-400">({{ p.toothNumber ? 'Diente ' + p.toothNumber : 'General' }})</span>
                      </div>
                      <div class="text-xs text-slate-600 mt-1">{{ p.description }}</div>
                    </div>
                    <div class="text-xs text-slate-400 whitespace-nowrap">
                      <div>{{ p.createdAt ? (p.createdAt | date:'short') : '' }}</div>
                      <div class="mt-2">
                        <!-- Cuando NO está finalizado: mostrar Finalizar + Editar -->
                        <ng-container *ngIf="!isProcedureCompleted(p); else drawerCompletedTpl">
                          <div class="flex gap-2">
                            <button
                              class="px-3 py-1 rounded text-sm bg-amber-600 text-white border-amber-600 hover:opacity-95"
                              (click)="promptCompleteProcedure(p)">
                              Finalizar
                            </button>

                            <button
                              class="px-3 py-1 rounded text-sm bg-indigo-600 text-white border-indigo-600 hover:opacity-95"
                              (click)="openAddProcedure(p.toothNumber ?? undefined, p)">
                              Editar
                            </button>
                          </div>
                        </ng-container>

                        <ng-template #drawerCompletedTpl>
                          <!-- Botón verde y disabled que indica finalizado (más visible) -->
                          <button class="px-3 py-1 rounded text-sm bg-emerald-600 text-white cursor-default" disabled>
                            Finalizado
                          </button>
                        </ng-template>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </aside>
      </div>

      <!-- MODAL EDITAR DIENTE -->
      <div *ngIf="showEditModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow max-w-lg w-full p-4">
          <h3 class="font-semibold mb-2">Editar diente {{ editingToothNumber }}</h3>

          <form (ngSubmit)="saveTooth()" class="space-y-3">
            <div>
              <label class="block text-xs text-slate-600 mb-1">Estado</label>
              <select [(ngModel)]="editingTooth.toothStatus" name="toothStatus" class="w-full rounded border px-3 py-2 text-sm">
                <option value="">— Sin cambiar —</option>
                <option value="SANO">Sano</option>
                <option value="AUSENTE">Ausente</option>
                <option value="IMPLANTE">Implante</option>
                <option value="PROTESIS">Prótesis</option>
                <option value="TRATAMIENTO">En tratamiento</option>
                <option value="EXTRACCION">Extraído</option>
              </select>
            </div>

            <div>
              <label class="block text-xs text-slate-600 mb-1">Notas</label>
              <textarea [(ngModel)]="editingTooth.notes" name="notes" rows="3" class="w-full rounded border px-3 py-2 text-sm"></textarea>
            </div>

            <div>
              <label class="block text-xs text-slate-600 mb-1">Superficies (clave → valor)</label>
              <div *ngFor="let s of surfaceEntries; let i = index" class="flex gap-2 mb-2">
                <input [(ngModel)]="surfaceEntries[i].key" name="k{{i}}" class="w-20 rounded border px-2 py-1 text-sm">
                <input [(ngModel)]="surfaceEntries[i].value" name="v{{i}}" class="flex-1 rounded border px-2 py-1 text-sm">
                <button type="button" (click)="removeSurface(i)" class="px-2 py-1 border rounded text-sm">Eliminar</button>
              </div>

              <div class="flex gap-2 mt-2">
                <input [(ngModel)]="newSurfaceKey" name="newSurfaceKey" placeholder="O, V, M, D, L" class="w-20 rounded border px-2 py-1 text-sm">
                <input [(ngModel)]="newSurfaceValue" name="newSurfaceValue" placeholder="estado" class="flex-1 rounded border px-2 py-1 text-sm">
                <button type="button" (click)="addSurface()" class="px-3 py-1 border rounded text-sm">Agregar</button>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="closeEdit()" class="px-3 py-2 rounded border">Cancelar</button>
              <button type="submit" class="px-3 py-2 rounded bg-emerald-600 text-white">Guardar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL AÑADIR / EDITAR PROCEDIMIENTO -->
      <div *ngIf="showProcedureModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow max-w-lg w-full p-4">
          <h3 class="font-semibold mb-2">
            {{ procEditingId ? 'Editar procedimiento' : 'Añadir procedimiento' }}
            <span *ngIf="procToothNumber">— diente {{ procToothNumber }}</span>
          </h3>

          <form (ngSubmit)="saveProcedure()" class="space-y-3">
            <div>
              <label class="block text-xs text-slate-600 mb-1">Tipo</label>
              <input [(ngModel)]="proc.type" name="type" required class="w-full rounded border px-3 py-2 text-sm" />
            </div>

            <div>
              <label class="block text-xs text-slate-600 mb-1">Superficie (opcional)</label>
              <input [(ngModel)]="proc.surface" name="surface" class="w-full rounded border px-3 py-2 text-sm" />
            </div>

            <div>
              <label class="block text-xs text-slate-600 mb-1">Descripción</label>
              <textarea [(ngModel)]="proc.description" name="description" rows="3" class="w-full rounded border px-3 py-2 text-sm"></textarea>
            </div>

            <div class="flex justify-between gap-3 pt-2 items-center">
              <div>
                <button type="button" (click)="closeProcedure()" class="px-3 py-2 rounded border">Cancelar</button>
              </div>
              <div class="flex gap-2">
                <button *ngIf="procEditingId" type="button" class="px-3 py-2 border rounded text-sm" (click)="cancelEditProcedure()">Cancelar edición</button>
                <button type="submit" class="px-3 py-2 rounded bg-emerald-600 text-white">{{ procEditingId ? 'Guardar cambios' : 'Guardar procedimiento' }}</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- CONFIRM CUSTOM MODAL (stylish) - evita superposición y se ve profesional -->
      <div *ngIf="showConfirmModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[110]">
        <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-5">
          <h3 class="font-semibold text-lg mb-2">Confirmar finalización</h3>
          <p class="text-sm text-slate-600 mb-4">
            ¿Marcar el procedimiento
            <strong>{{ confirmProcedure?.type }}</strong>
            {{ confirmProcedure?.toothNumber ? ' (Diente ' + confirmProcedure?.toothNumber + ')' : '' }}
            como finalizado?
          </p>

          <div class="flex justify-end gap-3">
            <button class="px-4 py-2 rounded border" (click)="cancelConfirm()">Cancelar</button>
            <button class="px-4 py-2 rounded bg-amber-600 text-white" (click)="confirmCompleteProcedure()">Finalizar</button>
          </div>
        </div>
      </div>

      <!-- MODAL DE CONFIRMACIÓN PARA SUBIR IMAGEN -->
      <div *ngIf="showUploadConfirmModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-semibold text-slate-800">Confirmar subida de imagen</h3>
            </div>
          </div>

          <div class="mb-5">
            <p class="text-sm text-slate-600 mb-3">
              ¿Desea subir la siguiente imagen al diente {{ selectedToothNumber }}?
            </p>

            <div class="bg-slate-50 rounded-lg p-3 border">
              <div class="flex items-center">
                <svg class="h-5 w-5 text-slate-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900 truncate">{{ selectedFile?.name }}</p>
                  <p class="text-xs text-slate-500">
                    {{ formatFileSize(selectedFile?.size || 0) }} • {{ selectedFile?.type }}
                  </p>
                </div>
              </div>
            </div>

            <div *ngIf="selectedFile" class="mt-3">
              <img [src]="filePreviewUrl"
                   class="w-full h-48 object-cover rounded-lg border"
                   alt="Vista previa"
                   *ngIf="filePreviewUrl">
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 rounded border text-sm font-medium text-slate-700 hover:bg-slate-50"
              (click)="cancelUpload()">
              Cancelar
            </button>
            <button
              class="px-4 py-2 rounded bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
              (click)="confirmUpload()"
              [disabled]="uploadingImage">
              <span *ngIf="!uploadingImage">Subir imagen</span>
              <span *ngIf="uploadingImage" class="flex items-center">
                <svg class="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL VER IMÁGENES DEL DIENTE -->
      <div *ngIf="showImagesModal"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]">

        <div class="bg-white rounded-lg shadow-lg max-w-4xl w-full p-4">

          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold text-lg">
              Imágenes del diente {{ selectedToothNumber }}
            </h3>
            <button
              class="text-sm text-slate-500 hover:text-slate-800"
              (click)="closeImagesModal()">
              ✕ Cerrar
            </button>
          </div>

          <div *ngIf="selectedToothImages.length === 0"
               class="text-sm text-slate-500">
            No hay imágenes para este diente.
          </div>

          <div *ngIf="selectedToothImages.length"
               class="grid grid-cols-2 md:grid-cols-3 gap-4">

            <div *ngFor="let img of selectedToothImages"
                 class="border rounded p-2 cursor-pointer hover:shadow"
                 (click)="openImage(img.downloadUrl)">

              <img
                [src]="img.thumbnailUrl || img.downloadUrl"
                class="w-full h-40 object-cover rounded mb-2" />

              <div class="text-xs truncate">{{ img.filename }}</div>
              <div class="text-[11px] text-slate-400">
                {{ img.createdAt | date:'short' }}
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 🆕 MODAL CERRAR CONSULTA CLÍNICA -->
      <app-close-consultation-modal
        *ngIf="showCloseConsultationModal"
        (cancel)="showCloseConsultationModal = false"
        (submit)="onCloseConsultation($event)">
      </app-close-consultation-modal>

        <!-- 🧠 MODAL CONFIRMAR CIERRE DE HISTORIA ODONTOLÓGICA -->
        <div
          *ngIf="showConfirmCloseChartModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4"
        >
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">

            <div class="flex items-center gap-3 mb-4">
              <svg class="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
              <h3 class="text-lg font-semibold text-slate-800">
                Cerrar historia odontológica
              </h3>
            </div>

            <p class="text-sm text-slate-600 mb-6">
              Estás a punto de cerrar la historia odontológica del paciente.
              <br /><br />
              <strong>No podrás editar el odontograma después.</strong>
            </p>

            <div class="flex justify-end gap-3">
              <button
                class="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50"
                (click)="showConfirmCloseChartModal = false"
              >
                Cancelar
              </button>

              <button
                class="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                (click)="onCloseChart()"
              >
                Sí, cerrar historia
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>

  `,
  styles: [`
    .max-h-proc { max-height: 52vh; overflow-y: auto; }
    .procedures-inline .border { border-color: #e6edf3; }
    .procedures-inline .shadow-sm { box-shadow: 0 6px 12px rgba(15,23,42,0.03); }

    /* Prevent the blue text-selection highlight only inside the selected tooth card */
    .selected-tooth,
    .selected-tooth * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    /* small helpers so los botones no se vean pegados */
    .procedures-inline button { min-width: 84px; }

    /* Ensure modal is clearly above (avoid overlap artifact with svg) */
    :host ::ng-deep .odontogram-wrapper { z-index: 0; position: relative; }

    /* Animación para la notificación */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    /* 🔥 ESTILO ANIMATION-PULSE-SUBTLE FALTANTE */
    .animate-pulse-subtle {
      animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-subtle {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.85;
      }
    }
  `]
})
export class OdontogramPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(OdontogramService);
  private attachmentService = inject(AttachmentService);
  private consultationService = inject(ConsultationService);
  private consultationExplicitlyClosed = false;


  uploadMessage: string | null = null;
  uploadError: string | null = null;

  clinicId!: number;
  patientId!: number;


  // 🆕 Consulta clínica activa
  activeConsultation: ClinicalConsultationDto | null = null;
  showCloseConsultationModal = false;
  showConfirmCloseChartModal = false;


  hasClinicalChanges = false;

  chart: DentalChartDto | null = null;
  loading = true;
  error: string | null = null;

  /* Selected tooth */
  selectedToothNumber?: number;
  selectedTooth?: ToothDto | undefined;
  // 🆕 Imágenes del diente
  toothAttachments: ToothAttachmentDto[] = [];
  showImagesModal = false;
  selectedToothImages: ToothAttachmentDto[] = [];

  uploadingImage = false;
  showSuccessMessage = false;
  private successMessageTimeout: any = null;

  /* Upload confirm modal */
  showUploadConfirmModal = false;
  selectedFile: File | null = null;
  filePreviewUrl: string | null = null;

  /* Modals / forms */
  showEditModal = false;
  editingToothNumber?: number;
  editingTooth: ToothDto = {toothNumber: 0, surfaceStates: {}};
  surfaceEntries: { key?: string; value?: string }[] = [];
  newSurfaceKey = '';
  newSurfaceValue = '';

  showProcedureModal = false;
  procToothNumber?: number | null;
  proc: Partial<AddProcedureRequest & { type?: string }> = {};
  procEditingId?: number | null; // if set -> editing existing procedure

  /* Procedures panel */
  showProceduresDrawer = false;
  procFilterTooth: number | '' = ''; // when non-empty show only that tooth's procedures
  procFilterText = '';
  procSort: 'desc' | 'asc' = 'desc'; // <-- new: sort order for procedures

  /* Confirm modal */
  showConfirmModal = false;
  confirmProcedure: DentalProcedureDto | null = null;

  chips = [
    {key: 'maxila', label: 'Maxila'},
    {key: 'mandibula', label: 'Mandíbula'},
    {key: 'face', label: 'Face'},
    {key: 'arcada_sup', label: 'Arcada superior'},
    {key: 'arcada_inf', label: 'Arcada inferior'},
    {key: 'all', label: 'Arcadas'},
  ];

  activeChip?: string;

  constructor() {
  }

  @HostListener('window:beforeunload')
  async onLeavePage() {

    // 🔥 Si la consulta ya fue cerrada explícitamente, NO tocar backend
    if (this.consultationExplicitlyClosed) {
      return;
    }

    if (this.activeConsultation) {
      await this.consultationService.leaveOdontogram(
        this.activeConsultation.id,
        this.hasClinicalChanges
      );
    }
  }


  async ngOnInit(): Promise<void> {
    this.clinicId = Number(this.route.snapshot.queryParamMap.get('clinicId'))
      || Number(this.route.snapshot.paramMap.get('clinicId'))
      || 1;

    this.patientId = Number(this.route.snapshot.paramMap.get('id'));

    // 0️⃣ Cargar consulta activa o en progreso
    this.activeConsultation =
      await this.consultationService.getActiveOrInProgress(
        this.clinicId,
        this.patientId
      );

// 1️⃣ Cargar odontograma
    await this.loadChart();


    // 🔄 Si existe consulta IN_PROGRESS, el backend la reactiva al entrar
    if (this.activeConsultation?.status === 'IN_PROGRESS') {
      this.activeConsultation =
        await this.consultationService.enterOdontogram(
          this.clinicId,
          this.patientId
        );
    }


// La consulta se crea SOLO con la primera acción clínica



    console.log('[ODONTOGRAM] after startConsultation:', this.activeConsultation);

  }


  private async loadChart() {
    this.loading = true;
    this.error = null;
    try {
      const c = await this.service.getActiveChart(this.clinicId, this.patientId);
      this.chart = c;
    } catch (err: any) {
      console.error(err);
      this.error = err?.error?.message || err?.message || 'No se pudo cargar el odontograma';
    } finally {
      this.loading = false;
    }
  }

  openImage(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  /* Create / open chart */
  async onCreateChart() {
    this.loading = true;
    try {
      const existing = await this.service.getActiveChart(this.clinicId, this.patientId);
      if (existing) {
        this.chart = existing;
        return;
      }
      this.chart = await this.service.createChart(this.clinicId, this.patientId);
    } catch (err: any) {
      this.error = err?.error?.message || err?.message;
    } finally {
      this.loading = false;
    }
  }

  async onCloseChart() {
    if (!this.chart) return;



    this.loading = true;
    this.error = null;

    try {
      // 1️⃣ Cerrar odontograma
      this.chart = await this.service.closeChart(
        this.clinicId,
        this.patientId,
        this.chart.id!
      );

      // 2️⃣ Mostrar mensaje de éxito
      this.uploadMessage = 'Historia odontológica cerrada correctamente';
      this.showSuccessMessage = true;

      // Auto-ocultar mensaje
      if (this.successMessageTimeout) {
        clearTimeout(this.successMessageTimeout);
      }
      this.successMessageTimeout = setTimeout(() => {
        this.showSuccessMessage = false;
        this.uploadMessage = null;
      }, 3000);

      // 3️⃣ Redirigir a la lista de consultas
      setTimeout(() => {
        this.router.navigate(
          ['/dashboard/pacientes', this.patientId, 'consultas'],
          {
            state: {
              flashMessage: {
                type: 'success',
                title: 'Historia odontológica cerrada',
                message: 'El tratamiento fue finalizado correctamente y quedó registrado en el historial clínico.'
              }
            }
          }
        );

      }, 800);

    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'No se pudo cerrar la historia odontológica';
    } finally {
      this.loading = false;
    }
  }


  async onSelectTooth(ev: { toothNumber: number; tooth?: ToothDto }) {
    this.selectedToothNumber = ev.toothNumber;
    this.selectedTooth = ev.tooth;

    // 🆕 CARGAR IMÁGENES DEL DIENTE (cambio clave)
    if (this.chart?.id) {
      const attachments = await this.service.listToothAttachments(
        this.clinicId,
        this.patientId,
        this.chart.id,
        ev.toothNumber
      );

      // 👉 lista completa (para modal)
      this.selectedToothImages = attachments;

      // 👉 preview (máx 3)
      this.toothAttachments = attachments.slice(0, 3);
    }

    const edited = this.isToothEdited(ev.toothNumber);

    if (edited) {
      this.procFilterTooth = ev.toothNumber;
      this.showProceduresDrawer = true;
    } else {
      this.procFilterTooth = '';
      this.showProceduresDrawer = false;
    }
  }


  isToothEdited(toothNumber: number): boolean {
    const t = this.chart?.teeth?.find(x => x.toothNumber === toothNumber);
    if (t) {
      if (t.toothStatus && t.toothStatus !== '') return true;
      if (t.notes && t.notes.trim().length > 0) return true;
      if (t.surfaceStates && Object.keys((t.surfaceStates as any) || {}).length > 0) return true;
    }
    if (this.chart?.procedures && this.chart.procedures.some(p => p.toothNumber === toothNumber)) return true;
    return false;
  }

  openAllProcedures() {
    this.procFilterTooth = '';
    this.showProceduresDrawer = true;
  }

  closeProceduresDrawer() {
    this.showProceduresDrawer = false;
  }

  openEditTooth(toothNumber: number) {
    this.editingToothNumber = toothNumber;
    const t = this.chart?.teeth?.find(x => x.toothNumber === toothNumber);
    this.editingTooth = t ? {...t, surfaceStates: {...(t.surfaceStates || {})}} : {toothNumber, surfaceStates: {}};
    this.surfaceEntries = Object.entries(this.editingTooth.surfaceStates || {}).map(([k, v]) => ({
      key: k,
      value: v || ''
    }));
    this.newSurfaceKey = '';
    this.newSurfaceValue = '';
    this.showEditModal = true;
  }

  closeEdit() {
    this.showEditModal = false;
  }

  async saveTooth() {
    await this.ensureActiveConsultation();

    if (!this.chart || !this.editingToothNumber) return;
    const surfaceStates: Record<string, string> = {};
    for (const e of this.surfaceEntries) if (e.key) surfaceStates[e.key] = e.value || '';
    const req: UpsertToothRequest = {
      toothNumber: this.editingToothNumber,
      toothStatus: this.editingTooth.toothStatus || undefined,
      notes: this.editingTooth.notes || undefined,

      surfaceStates
    };
    try {
      this.loading = true;
      const updated = await this.service.upsertTooth(this.clinicId, this.patientId, this.chart!.id!, req);
      this.chart = updated;
      this.showEditModal = false;
      this.procFilterTooth = this.editingToothNumber;
      this.showProceduresDrawer = true;
      this.hasClinicalChanges = true;

    } catch (err: any) {
      this.error = err?.error?.message || err?.message;
    } finally {
      this.loading = false;
    }


  }

  addSurface() {
    if (!this.newSurfaceKey) return;
    this.surfaceEntries.push({key: this.newSurfaceKey.trim(), value: this.newSurfaceValue.trim()});
    this.newSurfaceKey = '';
    this.newSurfaceValue = '';
  }

  removeSurface(i: number) {
    this.surfaceEntries.splice(i, 1);
  }

  /**
   * Open add/edit procedure modal.
   * If `existing` is provided, we fill the form to edit it.
   */
  openAddProcedure(toothNumber?: number, existing?: DentalProcedureDto) {
    this.procToothNumber = toothNumber ?? null;
    if (existing) {
      this.proc = {
        type: existing.type ?? '',
        description: existing.description ?? '',
        surface: existing.surface ?? undefined
      };
      this.procEditingId = existing.id ?? null;
    } else {
      this.proc = {type: '', description: '', surface: undefined};
      this.procEditingId = undefined;
    }
    this.showProcedureModal = true;
  }

  closeProcedure() {
    this.showProcedureModal = false;
    this.procEditingId = undefined;
    this.procToothNumber = null;
    this.proc = {};
  }

  cancelEditProcedure() {
    this.procEditingId = undefined;
    this.showProcedureModal = false;
    this.proc = {};
    this.procToothNumber = null;
  }

  async saveProcedure() {
    await this.ensureActiveConsultation();

    if (!this.chart) return;
    const payload: AddProcedureRequest = {
      toothNumber: this.procToothNumber ?? null,
      surface: this.proc.surface ?? undefined,
      type: this.proc.type ?? 'Procedimiento',
      description: this.proc.description ?? undefined
    };

    try {
      this.loading = true;
      if (this.procEditingId) {
        // editar procedimiento existente
        await this.service.updateProcedure(this.clinicId, this.patientId, this.chart.id!, this.procEditingId, payload);
      } else {
        // crear nuevo procedimiento
        await this.service.addProcedure(this.clinicId, this.patientId, this.chart.id!, payload);
      }
      await this.loadChart();
      this.hasClinicalChanges = true;
      this.showProcedureModal = false;

      if (this.procToothNumber != null) {
        this.procFilterTooth = this.procToothNumber;
        this.showProceduresDrawer = true;
      }
      this.procEditingId = undefined;
    } catch (err: any) {
      this.error = err?.error?.message || err?.message;
    } finally {
      this.loading = false;
    }
  }

  uniqueTeeth(): number[] {
    if (!this.chart?.procedures) return [];
    return Array.from(new Set(this.chart.procedures.map(p => p.toothNumber).filter(n => n != null))) as number[];
  }

  /**
   * filteredProcedures:
   * - aplica filtro por diente
   * - aplica búsqueda por texto
   * - ordena según procSort ('desc' = últimos primero, 'asc' = más antiguos primero)
   */
  filteredProcedures(): DentalProcedureDto[] {
    if (!this.chart?.procedures) return [];
    let list = [...this.chart.procedures];

    if (this.procFilterTooth !== '') {
      list = list.filter(p => p.toothNumber === this.procFilterTooth);
    }

    if (this.procFilterText && this.procFilterText.trim().length > 0) {
      const q = this.procFilterText.toLowerCase();
      list = list.filter(p => (p.type || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }

    // Sort by createdAt (or performedAt), using procSort
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.performedAt ? new Date(a.performedAt).getTime() : 0);
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.performedAt ? new Date(b.performedAt).getTime() : 0);

      if (this.procSort === 'asc') {
        return ta - tb; // older first
      } else {
        return tb - ta; // newest first (default)
      }
    });

    return list;
  }

  proceduresForSelected(): DentalProcedureDto[] {
    if (!this.chart?.procedures || this.selectedToothNumber == null) return [];
    return this.chart.procedures.filter(p => p.toothNumber === this.selectedToothNumber);
  }

  isProcedureCompleted(p: DentalProcedureDto): boolean {
    const asAny = p as any;
    if (asAny.status && asAny.status === 'COMPLETED') return true;
    if (asAny.completedAt) return true;
    return false;
  }

  /**
   * Replace native confirm() with a styled modal to avoid awkward overlap.
   */
  promptCompleteProcedure(p: DentalProcedureDto) {
    this.confirmProcedure = p;
    this.showConfirmModal = true;
  }

  cancelConfirm() {
    this.showConfirmModal = false;
    this.confirmProcedure = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.selectedFile = file;

    // Crear URL de vista previa
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.filePreviewUrl = e.target.result;
    };
    reader.readAsDataURL(file);

    // Mostrar modal de confirmación
    this.showUploadConfirmModal = true;
  }

  cancelUpload() {
    this.showUploadConfirmModal = false;
    this.selectedFile = null;
    this.filePreviewUrl = null;

    // Limpiar input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  async confirmUpload() {
    // 🔥 Primera acción clínica → crear consulta si no existe
    await this.ensureActiveConsultation();

    if (!this.selectedFile || !this.chart?.id || !this.selectedToothNumber) {
      this.cancelUpload();
      return;
    }

    this.uploadingImage = true;
    this.uploadMessage = null;
    this.uploadError = null;

    try {
      const presign = await this.attachmentService.generatePresign(
        this.patientId,
        this.selectedFile.name,
        this.selectedFile.type,
        this.selectedFile.size,
        null,
        null,
        `TOOTH_${this.selectedToothNumber}`,
        'PHOTO',
        `Imagen diente ${this.selectedToothNumber}`
      );

      await this.attachmentService.uploadFileToPresignedUrl(
        presign.uploadUrl,
        this.selectedFile,
        this.selectedFile.type
      );

      await this.attachmentService.linkAttachment(this.patientId, {
        storageKey: presign.storageKey,
        filename: this.selectedFile.name,
        contentType: this.selectedFile.type,
        sizeBytes: this.selectedFile.size,
        toothReference: `TOOTH_${this.selectedToothNumber}`,
        type: 'PHOTO',
        notes: `Imagen diente ${this.selectedToothNumber}`
      });

      // 🆕 Actualizar ambas listas después de subir
      const attachments = await this.service.listToothAttachments(
        this.clinicId,
        this.patientId,
        this.chart.id,
        this.selectedToothNumber
      );
      this.selectedToothImages = attachments;
      this.toothAttachments = attachments.slice(0, 3);

      // ✅ MOSTRAR NOTIFICACIÓN DE ÉXITO PROFESIONAL
      this.uploadMessage = 'Imagen subida correctamente';
      this.showSuccessMessage = true;
      this.hasClinicalChanges = true;


      // Auto-ocultar después de 5 segundos
      if (this.successMessageTimeout) {
        clearTimeout(this.successMessageTimeout);
      }
      this.successMessageTimeout = setTimeout(() => {
        this.showSuccessMessage = false;
        this.uploadMessage = null;
      }, 5000);

    } catch (err) {
      console.error(err);
      this.uploadError = 'Error al subir la imagen';
      // También podemos mostrar una notificación de error si quieres
    } finally {
      this.uploadingImage = false;
      this.showUploadConfirmModal = false;
      this.selectedFile = null;
      this.filePreviewUrl = null;

      // Limpiar input file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  async confirmCompleteProcedure() {
    if (!this.confirmProcedure) return;
    if (!this.chart?.id || !this.confirmProcedure.id) {
      // keep the old alert fallback if something is wrong
      alert('No se pudo identificar el procedimiento a finalizar.');
      this.cancelConfirm();
      return;
    }

    try {
      this.loading = true;
      await this.service.completeProcedure(this.clinicId, this.patientId, this.chart.id, this.confirmProcedure.id);
      await this.loadChart();
    } catch (err: any) {
      console.error('Error finalizando procedimiento', err);
      alert('Error finalizando procedimiento: ' + (err?.error?.message || err?.message || 'desconocido'));
    } finally {
      this.loading = false;
      this.showConfirmModal = false;
      this.confirmProcedure = null;
    }
  }

  /**
   * Backwards-compat shim (kept in case other code calls completeProcedure)
   * Now opens the custom modal instead of native confirm().
   */
  async completeProcedure(p: DentalProcedureDto) {
    this.promptCompleteProcedure(p);
  }

  openImagesModal() {
    this.showImagesModal = true;
  }

  closeImagesModal() {
    this.showImagesModal = false;
  }

  onChip(key: string) {
    this.activeChip = this.activeChip === key ? undefined : key;
  }

  // Pipe para formatear tamaño de archivo (necesitas agregarlo al CommonModule)
  // O puedes hacerlo directamente en el template con una función

  // Método para formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async onCloseConsultation(ev: {
    summary?: string;
    clinicalNotes?: string;
    requireNextAppointment: boolean;
  }) {
    if (!this.activeConsultation) return;

    await this.consultationService.closeConsultation(
      this.clinicId,
      this.patientId,
      this.activeConsultation.id,
      ev
    );

    // 🔥 MARCAR CIERRE EXPLÍCITO
    this.consultationExplicitlyClosed = true;

    this.showCloseConsultationModal = false;
    this.showConfirmCloseChartModal = false;

    this.hasClinicalChanges = false;


    if (!ev.requireNextAppointment) {
      this.activeConsultation = null;
      this.router.navigate(
        ['/dashboard/pacientes', this.patientId],
        {
          state: {
            flashMessage: {
              type: 'success',
              message: 'Consulta cerrada correctamente'
            }
          }
        }
      );
      return;
    }

    this.router.navigate(
      ['/dashboard/citas'],
      {
        queryParams: {
          patientId: this.patientId,
          consultationId: this.activeConsultation.id,
          doctorId: this.activeConsultation.dentistId
        }
      }
    );
  }

  /**
   * 🔥 Crea la consulta clínica si aún no existe.
   * Se llama SOLO en la primera acción clínica real.
   */
  private async ensureActiveConsultation() {
    if (this.activeConsultation) {
      return;
    }

    this.activeConsultation =
      await this.consultationService.enterOdontogram(
        this.clinicId,
        this.patientId
      );

    console.log('[ODONTOGRAM] consulta creada por primera acción clínica', this.activeConsultation);
  }


}
