import { Component, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import {AsyncPipe, isPlatformBrowser, NgIf} from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [AsyncPipe, NgIf],

  template: `
    <main style="padding: 1.5rem">
      <h1>OdontoWeb – Debug de sesión</h1>

      <ng-container *ngIf="isBrowser; else ssr">
        <div style="margin-top: 1rem; display:flex; gap:.5rem;">
          <button (click)="login()">Login</button>
          <button (click)="logout()">Logout</button>
        </div>

        <div style="margin-top: 1rem;">
          <ng-container *ngIf="(auth.isAuthenticated$ | async); else notAuth">
            <p>Autenticado: TRUE</p>
          </ng-container>
          <ng-template #notAuth>
            <p>Autenticado: FALSE</p>
          </ng-template>
        </div>
      </ng-container>

      <ng-template #ssr>
        <p>Cargando...</p>
      </ng-template>
    </main>
  `
})
export class DashboardPage {
  isBrowser: boolean;

  constructor(
    public auth: AuthService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.auth.init();   // inicializa estado OIDC / checkAuth
    }
  }

  login() {
    if (this.isBrowser) {
      this.auth.startLogin();
    }
  }

  logout() {
    if (this.isBrowser) {
      this.auth.logout();
    }
  }
}
