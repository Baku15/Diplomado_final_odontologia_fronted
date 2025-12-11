import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { PublicRegistrationPage } from './features/registration/public-registration.page';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminRoleGuard } from './features/admin/solicitudes/admin-role.guard';
import { ClinicAdminGuard } from './core/guards/clinic-admin.guard';

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

      // /mi-clinica/perfil-profesional → edición de perfil pero desde modo admin
      {
        path: 'perfil-profesional',
        loadComponent: () =>
          import('./features/dentist/doctor-profile-edit.page').then(
            (m) => m.DoctorProfileEditPage,
          ),
      },

      // /mi-clinica/consultorios → gestión de consultorios de la clínica
      {
        path: 'consultorios',
        loadComponent: () =>
          import('./features/clinic/clinic-rooms.page').then(
            (m) => m.ClinicRoomsPage,
          ),
      },

      // Gestión de doctores + invitaciones
      {
        path: 'doctores',
        loadComponent: () =>
          import('./features/clinic/clinic-doctors.page').then(
            (m) => m.ClinicDoctorsPage,
          ),
      },
      // aquí después puedes agregar /mi-clinica/pacientes, /mi-clinica/ayudantes si los necesitas en modo admin
    ],
  },

  // ============================
  // MODO ODONTÓLOGO (ROLE_DENTIST)
  // ============================
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./layout/dentist-shell.layout').then(
        (m) => m.DentistShellLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dentist/dentist-dashboard.page').then(
            (m) => m.DentistDashboardPage,
          ),
      },
      {
        path: 'horarios',
        loadComponent: () =>
          import('./features/clinic/doctor-schedule.page').then(
            (m) => m.DoctorSchedulePage,
          ),
      },
      {
        path: 'perfil-profesional',
        loadComponent: () =>
          import('./features/dentist/doctor-profile-edit.page').then(
            (m) => m.DoctorProfileEditPage,
          ),
      },

      // ---------- RUTAS DE PACIENTES (odontólogo) ----------
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./features/clinic/patients/patient-list.page').then(
            (m) => m.PatientListPage,
          ),
      },
      {
        path: 'pacientes/nuevo',
        loadComponent: () =>
          import('./features/clinic/patients/patient-create-wizard.page').then(
            (m) => m.PatientCreateWizardPage,
          ),
      },
      {
        path: 'pacientes/:id',
        loadComponent: () =>
          import('./features/clinic/patients/patient-detail.page').then(
            (m) => m.PatientDetailPage,
          ),
      },

      // 🆕 Historia clínica del paciente
      {
        path: 'pacientes/:id/historia-clinica',
        loadComponent: () =>
          import('./features/clinic/patients/clinical-record.page').then(
            (m) => m.ClinicalRecordPage,
          ),
      },

      // ----------------------------------------------------
    ],
  },

  // Completar perfil profesional (cuando falta wizard)
  {
    path: 'completar-perfil',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/clinic/doctor-complete-profile.page').then(
        (m) => m.DoctorCompleteProfilePage,
      ),
  },

  // Activación por link de correo
  {
    path: 'activar',
    loadComponent: () =>
      import('./features/activation/activation.page').then(
        (m) => m.ActivationPage,
      ),
  },

  // Invitación pública para doctores
  {
    path: 'invitacion-doctor/:token',
    loadComponent: () =>
      import('./features/activation/doctor-invitation-landing.page').then(
        (m) => m.DoctorInvitationLandingPage,
      ),
  },

  // Registro de doctor invitado (flujo desde invitación)
  {
    path: 'registro-doctor/:token',
    loadComponent: () =>
      import('./features/activation/doctor-invitation-register.page').then(
        (m) => m.DoctorInvitationRegisterPage,
      ),
  },

  // Seguridad de la cuenta (cambiar contraseña)
  {
    path: 'mi-cuenta/seguridad',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/account/change-password.page').then(
        (m) => m.ChangePasswordPage,
      ),
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
