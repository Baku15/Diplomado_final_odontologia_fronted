import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {ClinicStaffApi, CreateDoctorDto} from '../../../core/services/clinic-staff.api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-doctor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Crear odontólogo</h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Nombre</label>
            <input formControlName="nombre" class="w-full rounded border px-3 py-2" />
            <p *ngIf="submitted && form.controls['nombre'].invalid" class="text-xs text-red-600">Nombre requerido</p>
          </div>
          <div>
            <label class="block text-sm mb-1">Apellido</label>
            <input formControlName="apellido" class="w-full rounded border px-3 py-2" />
            <p *ngIf="submitted && form.controls['apellido'].invalid" class="text-xs text-red-600">Apellido requerido</p>
          </div>
        </div>

        <div>
          <label class="block text-sm mb-1">Correo</label>
          <input formControlName="email" type="email" class="w-full rounded border px-3 py-2" />
          <p *ngIf="submitted && form.controls['email'].invalid" class="text-xs text-red-600">Email válido requerido</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Usuario sugerido (opcional)</label>
            <input formControlName="username" class="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm mb-1">Teléfono</label>
            <input formControlName="phone" class="w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Matrícula</label>
            <input formControlName="licenseNumber" class="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm mb-1">Especialidad</label>
            <input formControlName="specialty" class="w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" (click)="cancel.emit()" class="px-3 py-2 border rounded">Cancelar</button>
          <button type="submit" [disabled]="isSubmitting" class="px-4 py-2 bg-emerald-600 text-white rounded">
            {{ isSubmitting ? 'Creando...' : 'Crear' }}
          </button>
        </div>

        <p *ngIf="error" class="text-xs text-red-600 mt-2">{{ error }}</p>
      </form>
    </div>
  `,
})
export class CreateDoctorForm {
  @Input() clinicId!: number | null;
  @Output() created = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private api = inject(ClinicStaffApi);

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: [''],
    phone: [''],
    licenseNumber: [''],
    specialty: ['']
  });

  submitted = false;
  isSubmitting = false;
  error: string | null = null;

  async submit() {
    this.submitted = true;
    if (!this.clinicId) {
      this.error = 'Clinic no definida';
      return;
    }
    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.error = null;

    try {
      const nombre = String(this.form.get('nombre')!.value).trim();
      const apellido = String(this.form.get('apellido')!.value).trim();
      const email = String(this.form.get('email')!.value).trim();
      const username = this.form.get('username')!.value ? String(this.form.get('username')!.value).trim() : undefined;
      const phone = this.form.get('phone')!.value ? String(this.form.get('phone')!.value).trim() : undefined;
      const licenseNumber = this.form.get('licenseNumber')!.value ? String(this.form.get('licenseNumber')!.value).trim() : undefined;
      const specialty = this.form.get('specialty')!.value ? String(this.form.get('specialty')!.value).trim() : undefined;

      const dto = {
        nombre,
        apellido,
        email,
        username,
        phone,
        licenseNumber,
        specialty
      } as CreateDoctorDto;

      await firstValueFrom(this.api.createDoctor(this.clinicId, dto));
      this.created.emit(true);
    } catch (err: any) {
      console.error(err);
      this.error = err?.error?.message || 'No se pudo crear el odontólogo';
    } finally {
      this.isSubmitting = false;
    }
  }
}
