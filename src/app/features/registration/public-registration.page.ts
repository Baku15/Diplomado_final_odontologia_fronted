// src/app/features/registration/public-registration.page.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RegistrationDataAccess } from './registration.data-access';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-public-registration',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h1>Registro de usuario</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field><input matInput placeholder="Nombre" formControlName="nombre"></mat-form-field>
      <mat-form-field><input matInput placeholder="Apellido" formControlName="apellido"></mat-form-field>
      <mat-form-field><input matInput type="email" placeholder="Correo" formControlName="email"></mat-form-field>
      <mat-form-field><input matInput placeholder="Ocupación" formControlName="ocupacion"></mat-form-field>
      <mat-form-field><input matInput placeholder="Zona" formControlName="zona"></mat-form-field>
      <mat-form-field><input matInput placeholder="Dirección" formControlName="direccion"></mat-form-field>
      <button mat-raised-button color="primary" [disabled]="form.invalid">Enviar</button>
    </form>
    <p *ngIf="msg">{{ msg }}</p>
  `
})
export class PublicRegistrationPage {
  private fb = inject(FormBuilder);
  private api = inject(RegistrationDataAccess);
  msg = '';

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    ocupacion: [''],
    zona: [''],
    direccion: [''],
  });

  submit() {
    if (this.form.invalid) return;
    this.api.create(this.form.value as any).subscribe({
      next: (r) => this.msg = r.message,
      error: () => this.msg = 'No se pudo enviar la solicitud.'
    });
  }
}
