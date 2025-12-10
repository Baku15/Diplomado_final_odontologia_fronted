import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PatientService } from './patient.service';
import { PatientDetail } from './patient.model';

@Component({
  standalone: true,
  selector: 'app-patient-detail',
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="mb-4 flex items-center justify-between">
        <button
          class="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1"
          [routerLink]="['/dashboard/pacientes']">
          ⬅ Volver al listado
        </button>

        <span *ngIf="patientId"
              class="text-xs bg-slate-100 px-2 py-1 rounded border text-slate-500">
          ID {{ patientId }}
        </span>
      </div>

      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

        <!-- Header + foto -->
        <div class="px-6 py-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="relative">
              <!-- Foto o placeholder con iniciales -->
              <div
                *ngIf="!previewPhotoUrl && !photoUrl"
                class="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl">
                {{ initials }}
              </div>

              <img
                *ngIf="previewPhotoUrl || photoUrl"
                [src]="previewPhotoUrl || photoUrl"
                alt="Foto paciente"
                class="h-16 w-16 rounded-full object-cover border border-slate-300 shadow-sm"
                (error)="onPhotoLoadError()"
              />

              <span
                *ngIf="previewPhotoUrl"
                class="absolute -bottom-1 -right-1 bg-amber-500 text-[10px] text-white px-1.5 py-0.5 rounded-full shadow">
                Nuevo
              </span>
            </div>

            <div>
              <h2 class="text-xl font-semibold text-slate-900">Editar paciente</h2>
              <p class="text-sm text-slate-500">
                Modifica los datos básicos del paciente y su foto de perfil.
              </p>
            </div>
          </div>

          <!-- Botón cambiar foto -->
          <div class="flex flex-col items-start gap-2">
            <label class="text-xs font-medium text-slate-700">Foto de perfil</label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="fileInput?.click()"
                class="px-3 py-2 rounded-lg border text-sm hover:bg-slate-50">
                Cambiar foto…
              </button>
              <button
                *ngIf="photoUrl"
                type="button"
                (click)="clearPhoto()"
                class="px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50">
                Quitar foto
              </button>
            </div>
            <input
              type="file"
              #fileInputRef
              accept="image/*"
              class="hidden"
              (change)="onPhotoSelected($any($event.target).files)"
              #fileInput />
            <p class="text-[11px] text-slate-400">
              Formatos: JPG/PNG. Tamaño recomendado mínimo: 256x256.
            </p>
          </div>
        </div>

        <!-- Mensajes -->
        <div *ngIf="loading" class="px-6 py-6">Cargando datos del paciente…</div>
        <div *ngIf="error && !loading" class="px-6 py-6 text-sm text-red-600">{{ error }}</div>

        <form
          *ngIf="!loading && !error"
          [formGroup]="form"
          (ngSubmit)="openConfirmSave()"
          class="px-6 py-6 space-y-4">

          <!-- mensaje error foto -->
          <div
            *ngIf="photoError"
            class="rounded border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {{ photoError }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Nombres</label>
              <input
                type="text"
                formControlName="givenName"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Apellidos</label>
              <input
                type="text"
                formControlName="familyName"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Tipo documento</label>
              <select
                formControlName="documentType"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">-- Sin documento --</option>
                <option value="CI">CI</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Número documento</label>
              <input
                type="text"
                formControlName="documentNumber"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Fecha nacimiento</label>
              <input
                type="date"
                formControlName="birthDate"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            <!-- Teléfono móvil con +591 fijo -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Teléfono móvil (WhatsApp)
              </label>
              <div class="relative">
                <div
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none select-none">
                  <span class="text-sm">+591</span>
                </div>
                <input
                  type="tel"
                  [value]="phoneMobileDisplay"
                  (input)="onPhoneMobileInput($any($event.target).value)"
                  (blur)="onPhoneMobileBlur()"
                  placeholder="76543210"
                  class="w-full rounded-lg border px-3 py-2 pl-14 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Debe tener exactamente 8 dígitos.
              </p>
              <p *ngIf="phoneMobileInvalid && phoneMobileTouched"
                 class="text-xs text-rose-600 mt-1">
                {{ phoneMobileErrorText }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                formControlName="email"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            <!-- Departamento como select -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Departamento</label>
              <select
                formControlName="state"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">-- Selecciona departamento --</option>
                <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Zona / Distrito</label>
              <input
                type="text"
                formControlName="district"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                formControlName="addressLine"
                class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>

          <div class="mt-6 flex items-center justify-between">

            <button
              type="button"
              (click)="openDeleteConfirm()"
              class="text-sm text-rose-600 hover:text-rose-700">
              🗑 Eliminar paciente
            </button>

            <div class="flex gap-3">
              <button
                type="button"
                (click)="goBack()"
                class="px-3 py-2 rounded-lg border text-sm">
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="form.invalid || saving || !phoneMobileValid"
                class="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
                {{ saving ? 'Guardando…' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal confirm delete -->
    <div *ngIf="showConfirmDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-slate-900">Confirmar eliminación</h3>
        </div>
        <div class="px-6 py-4 text-sm text-slate-700">
          ¿Seguro que deseas eliminar este paciente? Esta acción no se puede deshacer.
        </div>
        <div class="px-6 py-4 flex justify-end gap-3 border-t">
          <button (click)="showConfirmDelete = false" class="px-3 py-2 rounded border text-sm">
            Cancelar
          </button>
          <button (click)="confirmDelete()" class="px-3 py-2 rounded bg-rose-600 text-white text-sm hover:bg-rose-700">
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal confirm update -->
    <div *ngIf="showConfirmSave" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-slate-900">Confirmar actualización</h3>
        </div>
        <div class="px-6 py-4 text-sm text-slate-700">
          ¿Seguro que deseas actualizar los datos de este paciente?
        </div>
        <div class="px-6 py-4 flex justify-end gap-3 border-t">
          <button (click)="showConfirmSave = false" class="px-3 py-2 rounded border text-sm">
            Cancelar
          </button>
          <button (click)="confirmSave()" class="px-3 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700">
            Sí, actualizar
          </button>
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
}
