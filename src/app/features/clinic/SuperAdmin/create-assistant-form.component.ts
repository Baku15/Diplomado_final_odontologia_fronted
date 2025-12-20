import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {ClinicStaffApi, CreateAssistantDto} from '../../../core/services/clinic-staff.api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-assistant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Crear asistente</h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Nombre</label>
            <input formControlName="nombre" class="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm mb-1">Apellido</label>
            <input formControlName="apellido" class="w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input formControlName="email" type="email" class="w-full rounded border px-3 py-2" />
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" (click)="cancel.emit()" class="px-3 py-2 border rounded">Cancelar</button>
          <button type="submit" [disabled]="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded">
            {{ isSubmitting ? 'Creando...' : 'Crear' }}
          </button>
        </div>
        <p *ngIf="error" class="text-xs text-red-600 mt-2">{{ error }}</p>
      </form>
    </div>
  `,
})
export class CreateAssistantForm {
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
    phone: ['']
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
      // Coerción segura: extraer valores con non-null assertion (están validados si form.valid)
      const nombre = String(this.form.get('nombre')!.value).trim();
      const apellido = String(this.form.get('apellido')!.value).trim();
      const email = String(this.form.get('email')!.value).trim();
      const username = this.form.get('username')!.value ? String(this.form.get('username')!.value).trim() : undefined;
      const phone = this.form.get('phone')!.value ? String(this.form.get('phone')!.value).trim() : undefined;

      const dto = {
        nombre,
        apellido,
        email,
        username,
        phone
      } as CreateAssistantDto;

      await firstValueFrom(this.api.createAssistant(this.clinicId, dto));
      this.created.emit(true);
    } catch (err: any) {
      console.error(err);
      this.error = err?.error?.message || 'No se pudo crear el asistente';
    } finally {
      this.isSubmitting = false;
    }
  }
}
