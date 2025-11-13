import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivationDataAccess } from './activation.data-access';

@Component({
  selector: 'app-activation-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container" style="max-width:420px;margin:2rem auto;">
      <h2>Activar cuenta</h2>

      <div *ngIf="!token()">
        <p>Falta el token en la URL. Revisa el enlace del correo.</p>
        <button (click)="goHome()">Ir al inicio</button>
      </div>

      <form *ngIf="token()" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>Nueva contraseña</label>
        <input type="password" formControlName="password" />

        <label>Confirmar contraseña</label>
        <input type="password" formControlName="confirm" />

        <div *ngIf="error()" style="color:#b00020;margin:.5rem 0;">{{error()}}</div>
        <div *ngIf="ok()" style="color:#0a7d16;margin:.5rem 0;">{{ok()}}</div>

        <button type="submit" [disabled]="form.invalid || loading()">Activar</button>
      </form>
    </div>
  `
})
export class ActivationPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private api = inject(ActivationDataAccess);

  token = signal<string | null>(new URLSearchParams(globalThis.location?.search ?? '').get('token'));
  loading = signal(false);
  error = signal<string | null>(null);
  ok = signal<string | null>(null);

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]]
  });

  submit() {
    this.error.set(null);
    this.ok.set(null);
    if (!this.token()) return;
    const { password, confirm } = this.form.value;
    if (password !== confirm) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    this.loading.set(true);
    this.api.activate(this.token()!, password!)
      .subscribe({
        next: (res) => {
          this.ok.set(res.message || 'Cuenta activada. Ahora puedes iniciar sesión.');
          // UX: en 1.5s te llevo al login
          setTimeout(() => this.router.navigateByUrl('/login'), 1500);
        },
        error: (e) => {
          this.error.set(e?.error?.message || 'No se pudo activar la cuenta.');
          this.loading.set(false);
        }
      });
  }

  goHome() { this.router.navigateByUrl('/'); }
}
