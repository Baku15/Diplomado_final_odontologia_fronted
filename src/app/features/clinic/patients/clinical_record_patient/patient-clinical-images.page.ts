import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { PatientService } from '../../../../core/services/patient.service';
import { AttachmentDto } from '../../../../core/models/clinical-record.model';

type ImageFilter = 'ALL' | 'CLINICAL_RECORD' | 'ODONTOGRAM';

@Component({
  standalone: true,
  selector: 'app-patient-clinical-images',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-6">
      <div class="max-w-7xl mx-auto">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-xl font-bold text-slate-900">
            🖼 Imágenes clínicas del paciente
          </h1>

          <button
            class="text-sm px-3 py-2 rounded-lg border bg-white"
            (click)="goBack()">
            ← Volver al paciente
          </button>
        </div>

        <!-- Filtros -->
        <div class="flex gap-2 mb-6">
          <button
            *ngFor="let f of filters"
            (click)="activeFilter = f"
            class="px-3 py-1.5 rounded-full text-sm border"
            [ngClass]="{
              'bg-emerald-600 text-white border-emerald-600': activeFilter === f,
              'bg-white text-slate-700': activeFilter !== f
            }">
            {{ filterLabel(f) }}
          </button>
        </div>

        <!-- Grid -->
        <div *ngIf="filteredImages.length > 0; else empty"
             class="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div *ngFor="let img of filteredImages"
               class="bg-white rounded-lg border shadow-sm overflow-hidden">

            <!-- Imagen -->
            <img
              *ngIf="img.downloadUrl"
              [src]="img.downloadUrl"
              class="h-40 w-full object-cover cursor-pointer hover:opacity-90"
              [alt]="img.filename"
              (click)="openPreview(img)"
            />

            <div
              *ngIf="!img.downloadUrl"
              class="h-40 w-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
              Imagen no disponible
            </div>

            <!-- Info -->
            <div class="p-3 text-xs space-y-1">
              <div class="font-medium text-slate-900 truncate">
                {{ img.filename }}
              </div>

              <div class="text-slate-500">
                {{ formatDate(img.createdAt) }}
              </div>

              <div class="text-slate-600">
                {{ contextLabel(img) }}
              </div>

              <div *ngIf="img.toothReference"
                   class="text-fuchsia-600 font-medium">
                Diente {{ img.toothReference }}
              </div>
            </div>
          </div>
        </div>

        <ng-template #empty>
          <div class="text-center py-12 text-slate-500">
            No hay imágenes clínicas registradas.
          </div>
        </ng-template>

      </div>
    </div>

    <!-- ================= PREVIEW MODAL ================= -->
    <div
      *ngIf="previewing && previewImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">

      <!-- click fuera -->
      <div
        class="absolute inset-0"
        (click)="closePreview()">
      </div>

      <!-- contenido -->
      <div class="relative z-10 max-w-6xl w-full max-h-[90vh] p-4">

        <!-- cerrar -->
        <button
          class="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          (click)="closePreview()">
          ✕
        </button>

        <img
          [src]="previewImage.downloadUrl"
          [alt]="previewImage.filename"
          class="w-full h-full object-contain rounded-lg shadow-xl bg-black"
        />

        <div class="mt-3 text-center text-sm text-slate-300">
          {{ previewImage.filename }}
        </div>
      </div>
    </div>
  `
})
export class PatientClinicalImagesPage implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attachmentService = inject(AttachmentService);
  private patientService = inject(PatientService);

  patientId!: number;
  clinicId!: number;

  images: AttachmentDto[] = [];
  activeFilter: ImageFilter = 'ALL';

  filters: ImageFilter[] = ['ALL', 'CLINICAL_RECORD', 'ODONTOGRAM'];

  // preview
  previewing = false;
  previewImage: AttachmentDto | null = null;

  get filteredImages(): AttachmentDto[] {
    switch (this.activeFilter) {
      case 'CLINICAL_RECORD':
        return this.images.filter(i => i.clinicalRecordId);
      case 'ODONTOGRAM':
        return this.images.filter(i => i.toothReference || i.procedureId);
      default:
        return this.images;
    }
  }

  async ngOnInit(): Promise<void> {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.clinicId = (await this.patientService.getClinicIdForRoutes())!;
    await this.loadImages();
  }

  async loadImages() {
    const page = await this.attachmentService.listGallery(
      this.patientId,
      0,
      100
    );

    const items: AttachmentDto[] = (page as any).content || [];

    this.images = await Promise.all(
      items.map(async (img) => {
        try {
          const full = await this.attachmentService.getAttachment(
            this.patientId,
            img.id!,
            300
          );

          return {
            ...img,
            downloadUrl: full.downloadUrl
          };
        } catch {
          return img;
        }
      })
    );
  }

  openPreview(img: AttachmentDto) {
    if (!img.downloadUrl) return;
    this.previewImage = img;
    this.previewing = true;
  }

  closePreview() {
    this.previewing = false;
    this.previewImage = null;
  }

  filterLabel(f: ImageFilter): string {
    switch (f) {
      case 'CLINICAL_RECORD': return 'Historia clínica';
      case 'ODONTOGRAM': return 'Odontograma';
      default: return 'Todas';
    }
  }

  contextLabel(a: AttachmentDto): string {
    if (a.clinicalRecordId) return 'Historia clínica';
    if (a.procedureId) return 'Procedimiento odontológico';
    return 'Imagen clínica';
  }

  formatDate(value?: string | Date | null): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-BO');
  }

  goBack() {
    this.router.navigate(['/dashboard/pacientes', this.patientId]);
  }
}
