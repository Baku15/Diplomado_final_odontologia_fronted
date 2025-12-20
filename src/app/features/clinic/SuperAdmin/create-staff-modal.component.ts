// src/app/features/clinic/create-staff-modal.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClinicStaffApi } from './clinic-staff.api';
import { AuthService } from '../../../core/services/auth.service'; // ajustar path si necesario
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-create-staff-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-slate-900">
            {{ mode === 'doctor' ? 'Agregar odontólogo' : 'Agregar asistente' }}
          </h3>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
              <input type="text" formControlName="nombre" class="w-full rounded border px-3 py-2" />
              <p *ngIf="form.controls['nombre'].invalid && submitted" class="text-xs text-red-600">Nombre es obligatorio</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Apellido</label>
              <input type="text" formControlName="apellido" class="w-full rounded border px-3 py-2" />
              <p *ngIf="form.controls['apellido'].invalid && submitted" class="text-xs text-red-600">Apellido es obligatorio</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" formControlName="email" class="w-full rounded border px-3 py-2" />
            <p *ngIf="form.controls['email'].invalid && submitted" class="text-xs text-red-600">Email válido requerido</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Username (opcional)</label>
              <input type="text" formControlName="username" class="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Teléfono (opcional)</label>
              <input type="text" formControlName="phone" class="w-full rounded border px-3 py-2" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t pt-4">
            <button type="button" (click)="close()" class="px-3 py-2 rounded border text-sm">Cancelar</button>
            <button type="submit" [disabled]="saving" class="px-4 py-2 rounded bg-emerald-600 text-white text-sm">
              {{ saving ? 'Guardando...' : (mode === 'doctor' ? 'Crear odontólogo' : 'Crear asistente') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CreateStaffModalComponent {
  @Input() visible = false;
  @Input() clinicId: number | null = null;
  @Input() mode: 'doctor' | 'assistant' = 'doctor'; // decide endpoint
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private api = inject(ClinicStaffApi);
  private auth = inject(AuthService);

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: [''],
    phone: [''],
  });

  submitted = false;
  saving = false;

  close() {
    this.visible = false;
    this.closed.emit();
  }

  async submit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const value = this.form.value;
    this.saving = true;

    try {
      if (!this.clinicId) throw new Error('clinicId no definido');

      const payload = {
        nombre: value.nombre!,
        apellido: value.apellido!,
        email: value.email!,
        username: value.username || null,
        phone: value.phone || null,
      };

      if (this.mode === 'doctor') {
        await firstValueFrom(this.api.createDoctor(this.clinicId, payload));
      } else {
        await firstValueFrom(this.api.createAssistant(this.clinicId, payload));
      }

      alert('Usuario creado correctamente.');
      this.created.emit();
      this.close();
    } catch (err: any) {
      console.error('create staff error', err);
      alert(err?.error?.message || 'No se pudo crear el usuario. Revisa la consola.');
    } finally {
      this.saving = false;
    }
  }
}
