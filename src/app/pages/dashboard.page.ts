import { Component, inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [AsyncPipe],
  template: `
    <h1>OdontoWeb</h1>
    @if (isBrowser) {
      <button (click)="login()">Login</button>
      <button (click)="logout()">Logout</button>
      @if (auth.isAuthenticated$ | async; as s) { <p>Autenticado: {{ s.isAuthenticated }}</p> }
    } @else {
      <p>Cargando...</p>
    }
  `
})
export class DashboardPage {
  auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(){ if (this.isBrowser) this.auth.init?.(); }
  login(){ if (this.isBrowser) this.auth.login(); }
  logout(){ if (this.isBrowser) this.auth.logout(); }
}
