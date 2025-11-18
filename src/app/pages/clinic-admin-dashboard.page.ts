import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-clinic-admin-dashboard',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="border-b bg-white">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-slate-900">
              Panel de tu clínica
            </h1>
            <p class="text-sm text-slate-500">
              Administra tu clínica: doctores, asistentes, pacientes y agenda.
            </p>
          </div>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-4 py-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
            <h2 class="text-sm font-semibold text-slate-900 mb-1">
              Equipo
            </h2>
            <p class="text-xs text-slate-500 mb-3">
              Gestiona odontólogos y asistentes de tu clínica.
            </p>
            <button
              class="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Ver equipo
            </button>
          </div>

          <div class="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
            <h2 class="text-sm font-semibold text-slate-900 mb-1">
              Pacientes
            </h2>
            <p class="text-xs text-slate-500 mb-3">
              Registra nuevos pacientes y revisa sus historias clínicas.
            </p>
            <button
              class="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
            >
              Ver pacientes
            </button>
          </div>

          <div class="rounded-xl bg-white shadow-sm border border-slate-200 p-4">
            <h2 class="text-sm font-semibold text-slate-900 mb-1">
              Agenda
            </h2>
            <p class="text-xs text-slate-500 mb-3">
              Organiza horarios y consultorios de tu equipo.
            </p>
            <button
              class="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Ver agenda
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class ClinicAdminDashboardPage {}
