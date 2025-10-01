// src/app/pages/login-callback.page.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  standalone: true,
  selector: 'app-login-callback',
  template: `<p>Procesando login...</p>`
})
export class LoginCallbackPage {
  private oidc = inject(OidcSecurityService);
  private router = inject(Router);

  ngOnInit() {
    this.oidc.checkAuth().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }
}
