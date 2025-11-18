// src/app/features/clinic/clinic-dashboard.page.ts

import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-clinic-dashboard',
  template: `
    <main class="min-h-screen bg-slate-50">
      <header class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-semibold text-slate-900">
            Panel de tu clínica
          </h1>
          <p class="text-sm text-slate-600">
            Aquí administrarás odontólogos, asistentes y tu configuración.
          </p>
        </div>
      </header>

      <section class="max-w-6xl mx-auto px-4 py-6 grid gap-4 md:grid-cols-3">
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 class="font-semibold text-slate-900 mb-1">Odontólogos</h2>
          <p class="text-sm text-slate-600 mb-2">
            Registra a los doctores que atenderán en tu clínica.
          </p>
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            + Agregar odontólogo
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 class="font-semibold text-slate-900 mb-1">Asistentes</h2>
          <p class="text-sm text-slate-600 mb-2">
            Gestiona al personal que ayudará con la agenda y los pacientes.
          </p>
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            + Agregar asistente
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 class="font-semibold text-slate-900 mb-1">Configuración</h2>
          <p class="text-sm text-slate-600 mb-2">
            Define horarios, consultorios y preferencias de tu clínica.
          </p>
          <button
            type="button"
            class="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            Configurar clínica
          </button>
        </div>
      </section>
    </main>
  `,
})
export class ClinicDashboardPage {}
