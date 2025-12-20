  import { Component, EventEmitter, Output, Input } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';

  @Component({
    standalone: true,
    selector: 'app-close-consultation-modal',
    imports: [CommonModule, FormsModule],
    template: `
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-[120] p-4">
        <div class="bg-white rounded-lg shadow-lg max-w-lg w-full p-5">

          <h3 class="text-lg font-semibold mb-4">
            Finalizar consulta clínica
          </h3>

          <div class="space-y-4">
            <!-- Resumen clínico -->
            <div>
              <label class="block text-xs text-slate-600 mb-1">
                Resumen clínico
              </label>
              <textarea
                [(ngModel)]="summary"
                rows="2"
                class="w-full rounded border px-3 py-2 text-sm"
                placeholder="Resumen breve del estado clínico del paciente"
              ></textarea>
            </div>

            <!-- Notas clínicas -->
            <div>
              <label class="block text-xs text-slate-600 mb-1">
                Notas clínicas del día
              </label>
              <textarea
                [(ngModel)]="clinicalNotes"
                rows="4"
                class="w-full rounded border px-3 py-2 text-sm"
                placeholder="Procedimientos realizados, observaciones, evolución, etc."
              ></textarea>
            </div>

            <!-- Requiere próxima cita -->
            <div class="flex items-start gap-2 p-3 rounded border bg-slate-50">
              <input
                type="checkbox"
                [(ngModel)]="requireNextAppointment"
                id="requireNextAppointment"
                class="mt-1"
              />
              <label for="requireNextAppointment" class="text-sm leading-snug">
                <span class="font-medium">Requiere próxima cita</span>
                <br />
                <span class="text-xs text-slate-500">
  Se cerrará la sesión actual y se deberá <strong>agendar una cita</strong> para continuar.
</span>

              </label>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 rounded border"
              [disabled]="loading"
              (click)="cancel.emit()"
            >
              Cancelar
            </button>

            <button
              class="px-4 py-2 rounded text-white"
              [class.bg-emerald-600]="!requireNextAppointment"
              [class.bg-sky-600]="requireNextAppointment"
              [disabled]="loading"
              (click)="confirm()"
            >
              {{ requireNextAppointment ? 'Continuar tratamiento' : 'Cerrar consulta' }}
            </button>
          </div>
        </div>
      </div>
    `
  })
  export class CloseConsultationModal {
    @Input() loading = false;

    @Output() cancel = new EventEmitter<void>();
    @Output() submit = new EventEmitter<{
      summary?: string;
      clinicalNotes?: string;
      requireNextAppointment: boolean;
    }>();

    summary = '';
    clinicalNotes = '';
    requireNextAppointment = false;

    confirm() {
      this.submit.emit({
        summary: this.summary || undefined,
        clinicalNotes: this.clinicalNotes || undefined,
        requireNextAppointment: this.requireNextAppointment
      });
    }
  }
