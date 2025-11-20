// src/app/profile/complete-profile.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-complete-profile',
  imports: [
    FormsModule
  ],
  template: `
    <div class="container">
      <h2>Completa tu perfil clínico</h2>
      <form (ngSubmit)="submit()" #f="ngForm">
        <div>
          <label>Especialidad</label>
          <input name="especialidad" [(ngModel)]="model.especialidad" required/>
        </div>
        <div>
          <label>Matrícula</label>
          <input name="matricula" [(ngModel)]="model.matricula" required/>
        </div>
        <div>
          <label>Teléfono (opcional)</label>
          <input name="telefono" [(ngModel)]="model.telefono"/>
        </div>
        <button type="submit">Guardar</button>
      </form>
    </div>
  `
})
export class CompleteProfileComponent {
  model = { especialidad: '', matricula: '', telefono: '' };

  constructor(private http: HttpClient, private router: Router) {}

  submit() {
    this.http.post('/api/users/me/complete-profile', this.model, { withCredentials: true }).subscribe({
      next: () => this.router.navigate(['/mi-clinica/dashboard']),
      error: err => {
        console.error('Error completando perfil', err);
        alert('Error al guardar. Revisa la consola.');
      }
    });
  }
}
