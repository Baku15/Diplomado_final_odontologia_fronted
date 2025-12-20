import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttachmentService } from '../../../../core/services/attachment.service';

@Component({
  standalone: true,
  selector: 'app-clinical-record-attachments-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50"></div>

      <div class="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 z-10">
        <h3 class="text-lg font-semibold mb-2">
          Adjuntar imágenes al historial clínico
        </h3>

        <p class="text-sm text-slate-600 mb-4">
          Puedes adjuntar una o más imágenes (radiografías, fotos, documentos).
          Las imágenes se guardarán cuando confirmes.
        </p>

        <!-- Selector -->
        <div class="flex items-center gap-3 mb-4">
          <button
            class="px-4 py-2 rounded bg-sky-600 text-white text-sm"
            (click)="fileInput.click()">
            Agregar imagen
          </button>

          <span class="text-xs text-slate-500">
            {{ files.length }} imagen(es) seleccionada(s)
          </span>

          <input
            #fileInput
            type="file"
            accept="image/*"
            multiple
            hidden
            (change)="onFilesSelected($event)">
        </div>

        <!-- Lista -->
        <div *ngIf="files.length > 0" class="grid grid-cols-3 gap-3 mb-4">
          <div *ngFor="let f of files; let i = index"
               class="border rounded p-2 text-xs">
            <img
              [src]="previews[i]"
              class="h-28 w-full object-cover rounded mb-1">
            <div class="truncate">{{ f.name }}</div>
            <button
              class="mt-1 text-rose-600 text-xs underline"
              (click)="remove(i)">
              Eliminar
            </button>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            class="px-4 py-2 rounded border"
            (click)="close.emit()">
            No adjuntar imágenes
          </button>


          <button
            type="button"
            class="px-4 py-2 rounded bg-emerald-600 text-white"
            [disabled]="files.length === 0 || saving"
            (click)="save()">
            {{ saving ? 'Guardando…' : 'Guardar imágenes' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ClinicalRecordAttachmentsModal {

  @Input() patientId!: number;
  @Input() clinicalRecordId!: number;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  files: File[] = [];
  previews: string[] = [];
  saving = false;

  constructor(private attachmentService: AttachmentService) {
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (const file of Array.from(input.files)) {
      this.files.push(file);
      this.previews.push(URL.createObjectURL(file));
    }

    input.value = '';
  }

  remove(index: number) {
    this.files.splice(index, 1);
    this.previews.splice(index, 1);
  }

  async save() {
    this.saving = true;

    try {
      for (const file of this.files) {

        const presign = await this.attachmentService.generatePresign(
          this.patientId,
          file.name,
          file.type,
          file.size,
          this.clinicalRecordId,
          null,
          null,
          'PHOTO',
          'Imagen clínica'
        );

        await this.attachmentService.uploadFileToPresignedUrl(
          presign.uploadUrl,
          file,
          file.type
        );



        await this.attachmentService.linkAttachment(this.patientId, {
          storageKey: presign.storageKey,
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          clinicalRecordId: this.clinicalRecordId,
          type: 'PHOTO',
          notes: 'Imagen clínica'
        });
      }

      this.saved.emit();

    } catch (err) {
      console.error(err);
      alert('Error subiendo imágenes.');
    } finally {
      this.saving = false;
    }
  }
}

