// src/app/features/clinic/doctor-complete-profile.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { DoctorProfileWizard } from './doctor-profile-wizard.component';

@Component({
  standalone: true,
  selector: 'app-doctor-complete-profile-page',
  imports: [CommonModule, NavbarComponent, DoctorProfileWizard],
  template: `
    <app-navbar></app-navbar>

    <main class="min-h-screen bg-slate-50 flex justify-center px-4 py-10">
      <section
        class="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
      >
        <header class="mb-4">
          <h1 class="text-2xl font-bold text-slate-900">
            Completa tu perfil profesional
          </h1>
          <p class="text-sm text-slate-600 mt-1">
            Como odontólogo administrador de clínica debes completar estos datos
            antes de empezar a atender pacientes en la plataforma.
          </p>
        </header>

        <app-doctor-profile-wizard
          (close)="onClose()">
        </app-doctor-profile-wizard>
      </section>
    </main>
  `,
})
export class DoctorCompleteProfilePage {
  private router = inject(Router);

  onClose() {
    // cuando el wizard emite close → lo mando al panel de su clínica
    this.router.navigateByUrl('/mi-clinica');
  }
}
