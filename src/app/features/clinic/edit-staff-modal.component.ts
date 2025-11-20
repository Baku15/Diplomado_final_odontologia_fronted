import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClinicStaffApi } from './clinic-staff.api';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-edit-staff-modal',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-slate-900">Editar usuario</h3>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
              <input type="text" formControlName="nombre" class="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Apellido</label>
              <input type="text" formControlName="apellido" class="w-full rounded border px-3 py-2" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" formControlName="email" class="w-full rounded border px-3 py-2" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Username</label>
              <input type="text" formControlName="username" class="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
              <input type="text" formControlName="phone" class="w-full rounded border px-3 py-2" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Roles (coma-separados)</label>
            <input type="text" formControlName="rolesString" placeholder="ROLE_DENTIST,ROLE_ASSISTANT" class="w-full rounded border px-3 py-2" />
            <p class="text-xs text-slate-400 mt-1">Si no deseas cambiar roles, deja vacío.</p>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex gap-2">
              <button type="button" (click)="toggleActivate()" class="px-3 py-2 rounded border text-sm">
                {{ (form.value.status === 'ACTIVE') ? 'Bloquear' : 'Activar' }}
              </button>
            </div>

            <div class="flex gap-2">
              <button type="button" (click)="close()" class="px-3 py-2 rounded border text-sm">Cancelar</button>
              <button type="submit" [disabled]="saving" class="px-4 py-2 rounded bg-emerald-600 text-white text-sm">
                {{ saving ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class EditStaffModalComponent {
  @Input() visible = false;
  @Input() clinicId: number | null = null;
  @Input() staff!: any | null; // objeto StaffView
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private api = inject(ClinicStaffApi);

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: [''],
    phone: [''],
    rolesString: [''],
    status: ['ACTIVE'],
  });

  saving = false;

  ngOnChanges() {
    if (this.staff) {
      this.form.patchValue({
        nombre: this.staff.nombre,
        apellido: this.staff.apellido,
        email: this.staff.email,
        username: this.staff.username,
        phone: this.staff.phone || '',
        rolesString: (this.staff.roles || []).join(','),
        status: this.staff.status || 'ACTIVE',
      });
    }
  }

  close() {
    this.visible = false;
    this.closed.emit();
  }

  async submit() {
    if (!this.clinicId || !this.staff) return;
    this.saving = true;

    const payload: any = {
      nombre: this.form.value.nombre,
      apellido: this.form.value.apellido,
      email: this.form.value.email,
      username: this.form.value.username || null,
      phone: this.form.value.phone || null,
      roleNames: this.form.value.rolesString ? this.form.value.rolesString.split(',').map((s: string)=>s.trim()).filter(Boolean) : null,
      status: this.form.value.status || null
    };

    try {
      await firstValueFrom(this.api.updateStaff(this.clinicId, this.staff.id, payload));
      alert('Usuario actualizado correctamente.');
      this.updated.emit();
      this.close();
    } catch (err: any) {
      console.error('update staff error', err);
      alert(err?.error?.message || 'No se pudo actualizar el usuario.');
    } finally {
      this.saving = false;
    }
  }

  async toggleActivate() {
    if (!this.clinicId || !this.staff) return;
    try {
      if (this.form.value.status === 'ACTIVE') {
        await firstValueFrom(this.api.deactivateStaff(this.clinicId, this.staff.id));
        this.form.patchValue({ status: 'BLOCKED' });
        alert('Usuario bloqueado.');
      } else {
        await firstValueFrom(this.api.activateStaff(this.clinicId, this.staff.id));
        this.form.patchValue({ status: 'ACTIVE' });
        alert('Usuario activado.');
      }
      this.updated.emit();
    } catch (err: any) {
      console.error('toggle activate error', err);
      alert(err?.error?.message || 'No se pudo cambiar el estado.');
    }
  }
}
