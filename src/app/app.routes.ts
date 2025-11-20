// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { PublicRegistrationPage } from './features/registration/public-registration.page';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminRoleGuard } from './features/admin/solicitudes/admin-role.guard';

export const routes: Routes = [
  { path: '', component: HomePage },

  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/login-callback.page').then((m) => m.LoginCallbackPage),
  },

  { path: 'registro', component: PublicRegistrationPage },

  {
    path: 'admin/solicitudes',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/admin/admin-requests.page').then(
        (m) => m.AdminRequestsPage,
      ),
  },

  // Dashboard dueño de clínica (ROLE_CLINIC_ADMIN) - panel de staff
  {
    path: 'mi-clinica/dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/clinic/clinic-dashboard.page').then(
        (m) => m.ClinicDashboardPage,
      ),
  },

  // Dashboard general "Mi clínica"
  {
    path: 'mi-clinica',
    loadComponent: () =>
      import('./features/clinic/mi-clinica-dashboard.component').then(
        (m) => m.MiClinicaDashboardComponent,
      ),
    canActivate: [AdminRoleGuard],
  },

  // 🚑 Página para completar perfil de odontólogo
  {
    path: 'completar-perfil',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/clinic/doctor-complete-profile.page').then(
        (m) => m.DoctorCompleteProfilePage,
      ),
  },

  // Dashboard dentista (ROLE_DENTIST)
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/dentist/dentist-dashboard.page').then(
        (m) => m.DentistDashboardPage,
      ),
  },

  {
    path: 'activar',
    loadComponent: () =>
      import('./features/activation/activation.page').then(
        (m) => m.ActivationPage,
      ),
  },

  { path: '**', redirectTo: '' },
];
