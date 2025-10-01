// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private oidc = inject(OidcSecurityService);

  init() {
    // Si quieres lógica extra al arrancar, puedes mantener este método.
    // Con provideAuth ya está configurado; aquí no es obligatorio hacer nada.
  }

  login()  { this.oidc.authorize(); }
  logout() { this.oidc.logoff(); }

  // Observables de estado/usuario (nombres pueden cambiar levemente según versión):
  get isAuthenticated$() { return this.oidc.isAuthenticated$; }
  get userData$()        { return this.oidc.userData$; }
}
