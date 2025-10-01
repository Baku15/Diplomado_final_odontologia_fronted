// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginCallbackPage } from './pages/login-callback.page';
import { DashboardPage } from './pages/dashboard.page';
import { AuthGuard } from './core/guards/auth.guard';
import { PublicRegistrationPage } from './features/registration/public-registration.page';
import { AdminRequestsPage } from './features/admin/admin-requests.page';

export const appRoutes: Routes = [
  { path: '', component: DashboardPage, canActivate: [AuthGuard] },
  { path: 'callback', component: LoginCallbackPage },        // retorno OIDC
  { path: 'registro', component: PublicRegistrationPage },   // público
  { path: 'admin/solicitudes', component: AdminRequestsPage, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];
