// src/app/features/clinic/doctor-profile-wizard.component.ts

import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-doctor-profile-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-6">
      <header class="mb-4">
        <h2 class="text-xl font-semibold">Completa tu perfil profesional</h2>
        <p class="text-sm text-slate-500">Esto ayuda a pacientes a conocerte y validar tu práctica.</p>
      </header>

      <div class="mb-4">
        <div class="w-full bg-slate-100 rounded h-2 overflow-hidden">
          <div [style.width.%]="progress" class="h-2 bg-emerald-500 transition-all"></div>
        </div>
        <div class="text-xs text-slate-500 mt-2">Paso {{ step }} de 3</div>
      </div>

      <form [formGroup]="form" (ngSubmit)="next()" novalidate>
        <div *ngIf="step === 1" class="space-y-3">
          <label class="block text-sm font-medium">Matrícula (requerida)</label>
          <input formControlName="licenseNumber" class="w-full rounded border px-3 py-2" />
          <p *ngIf="submitted && form.controls['licenseNumber'].invalid" class="text-xs text-red-600">Matrícula requerida</p>

          <label class="block text-sm font-medium">Especialidad</label>
          <input formControlName="specialty" class="w-full rounded border px-3 py-2" />
        </div>

        <div *ngIf="step === 2" class="space-y-3">
          <label class="block text-sm font-medium">Teléfono</label>
          <input formControlName="phone" class="w-full rounded border px-3 py-2" />

          <label class="block text-sm font-medium">Dirección</label>
          <input formControlName="address" class="w-full rounded border px-3 py-2" />

          <label class="block text-sm font-medium">Breve descripción</label>
          <textarea formControlName="bio" rows="4" class="w-full rounded border px-3 py-2"></textarea>
        </div>

        <div *ngIf="step === 3" class="space-y-3">
          <h3 class="text-sm font-semibold">Confirma</h3>
          <dl class="grid grid-cols-1 gap-2">
            <div><dt class="text-xs text-slate-500">Matrícula</dt><dd class="text-sm">{{ form.value.licenseNumber }}</dd></div>
            <div><dt class="text-xs text-slate-500">Especialidad</dt><dd class="text-sm">{{ form.value.specialty }}</dd></div>
            <div><dt class="text-xs text-slate-500">Teléfono</dt><dd class="text-sm">{{ form.value.phone }}</dd></div>
            <div><dt class="text-xs text-slate-500">Dirección</dt><dd class="text-sm">{{ form.value.address }}</dd></div>
            <div><dt class="text-xs text-slate-500">Bio</dt><dd class="text-sm whitespace-pre-wrap">{{ form.value.bio }}</dd></div>
          </dl>
        </div>

        <div class="mt-6 flex justify-between items-center">
          <button type="button" (click)="prev()" [disabled]="step===1" class="px-3 py-2 border rounded">Anterior</button>
          <div class="flex gap-2">
            <button *ngIf="step<3" type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded">
              Continuar
            </button>
            <button *ngIf="step===3" type="button" (click)="finish()" class="px-4 py-2 bg-indigo-600 text-white rounded">
              Guardar perfil
            </button>
            <button type="button" (click)="closeWizard()" class="px-3 py-2 border rounded">Cancelar</button>
          </div>
        </div>
      </form>

      <p *ngIf="error" class="text-xs text-red-600 mt-3">{{ error }}</p>
      <p *ngIf="success" class="text-xs text-emerald-700 mt-3">{{ success }}</p>
    </div>
  `,
})
export class DoctorProfileWizard {
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  step = 1;
  progress = 33;
  submitted = false;
  error: string | null = null;
  success: string | null = null;

  form = this.fb.group({
    licenseNumber: ['', Validators.required],
    specialty: [''],
    phone: [''],
    address: [''],
    bio: ['']
  });

  // método para usar en plantilla: (click)="close()"
  closeWizard() {
    this.close.emit();
  }

  async next() {
    this.submitted = true;
    if (this.step === 1 && this.form.controls['licenseNumber'].invalid) return;
    if (this.step < 3) {
      this.step++;
      this.progress = Math.round((this.step / 3) * 100);
    }
    this.submitted = false;
  }

  prev() {
    if (this.step > 1) {
      this.step--;
      this.progress = Math.round((this.step / 3) * 100);
    }
  }

  async finish() {
    this.error = null;
    this.success = null;
    if (this.form.invalid) { this.error = 'Completa los campos requeridos'; return; }

    try {
      const url = `${environment.apiBase}/api/users/me/doctor-profile`;
      await firstValueFrom(this.http.post(url, this.form.value));
      this.success = 'Perfil guardado correctamente';
      setTimeout(() => this.close.emit(), 900);
    } catch (err: any) {
      console.error(err);
      this.error = err?.error?.message || 'Error guardando perfil';
    }
  }


}
