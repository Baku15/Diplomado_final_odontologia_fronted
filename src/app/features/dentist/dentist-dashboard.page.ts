// src/app/features/dentist/dentist-dashboard.page.ts

import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dentist-dashboard',
  template: `
    <main class="min-h-screen bg-slate-50">
      <header class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 py-4">
          <h1 class="text-xl font-semibold text-slate-900">
            Panel del odontólogo
          </h1>
          <p class="text-sm text-slate-600">
            Aquí verás tus citas del día, pacientes recientes y accesos rápidos.
          </p>
        </div>
      </header>

      <section class="max-w-6xl mx-auto px-4 py-6 grid gap-4 md:grid-cols-3">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 class="font-semibold text-slate-900 mb-1">Citas de hoy</h2>
          <p class="text-sm text-slate-600">
            Próximamente verás tus citas programadas.
          </p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 class="font-semibold text-slate-900 mb-1">Pacientes recientes</h2>
          <p class="text-sm text-slate-600">
            Atajos rápidos a las historias clínicas que consultaste hace poco.
          </p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 class="font-semibold text-slate-900 mb-1">Accesos rápidos</h2>
          <ul class="text-sm text-slate-700 list-disc list-inside space-y-1">
            <li>Registrar nueva cita</li>
            <li>Buscar paciente</li>
            <li>Ver agenda semanal</li>
          </ul>
        </div>
      </section>
    </main>
  `,
})
export class DentistDashboardPage {}
