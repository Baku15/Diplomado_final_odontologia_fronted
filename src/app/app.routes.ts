// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { PublicRegistrationPage } from './features/registration/public-registration.page';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminRoleGuard } from './features/admin/solicitudes/admin-role.guard';
import {ClinicAdminGuard} from './core/guards/clinic-admin.guard';

export const routes: Routes = [
  // Página pública inicial
  { path: '', component: HomePage },

  // Callback OIDC
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/login-callback.page').then(
        (m) => m.LoginCallbackPage,
      ),
  },

  // Registro público
  { path: 'registro', component: PublicRegistrationPage },

  // ============================
  // ADMIN GLOBAL (SUPERUSER)
  // ============================
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminRoleGuard],
    loadComponent: () =>
      import('./layout/admin-shell.layout').then((m) => m.AdminShellLayout),
    children: [
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/admin/admin-requests.page').then(
            (m) => m.AdminRequestsPage,
          ),
      },
      // /admin → redirige por defecto a /admin/solicitudes
      { path: '', pathMatch: 'full', redirectTo: 'solicitudes' },
    ],
  },

  // ============================
  // MUNDO "MI CLÍNICA"
  // Layout con sidebar + topbar
  // ============================
  {
    path: 'mi-clinica',
    canActivate: [AuthGuard, ClinicAdminGuard], // admin de clínica (y opcionalmente dentista)
    loadComponent: () =>
      import('./layout/clinic-shell.layout').then(
        (m) => m.ClinicShellLayout,
      ),
    children: [
      // /mi-clinica  → dashboard general de la clínica
      {
        path: '',
        loadComponent: () =>
          import('./features/clinic/mi-clinica-dashboard.component').then(
            (m) => m.MiClinicaDashboardComponent,
          ),
      },

      // /mi-clinica/horarios → horarios del doctor administrador
      {
        path: 'horarios',
        loadComponent: () =>
          import('./features/clinic/doctor-schedule.page').then(
            (m) => m.DoctorSchedulePage,
          ),
      },

      // aquí luego vendrán:
      // /mi-clinica/doctores
      // /mi-clinica/pacientes
      // /mi-clinica/ayudantes
    ],
  },

  // ============================
  // DASHBOARD DENTISTA (ROLE_DENTIST)
  // ============================
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/dentist/dentist-dashboard.page').then(
        (m) => m.DentistDashboardPage,
      ),
  },

  // Completar perfil profesional (cuando falta wizard)
  {
    path: 'completar-perfil',
    loadComponent: () =>
      import('./features/clinic/doctor-complete-profile.page').then(
        (m) => m.DoctorCompleteProfilePage,
      ),
    canActivate: [AuthGuard],
  },

  // Activación por link de correo
  {
    path: 'activar',
    loadComponent: () =>
      import('./features/activation/activation.page').then(
        (m) => m.ActivationPage,
      ),
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
