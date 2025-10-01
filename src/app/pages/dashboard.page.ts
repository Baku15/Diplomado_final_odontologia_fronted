// src/app/pages/dashboard.page.ts
import { Component, inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [AsyncPipe, NgIf],
  template: `
    <h1>OdontoWeb</h1>
    <button (click)="login()">Login</button>
    <button (click)="logout()">Logout</button>

    <div *ngIf="auth.isAuthenticated$ | async as s">
      <p>Autenticado: {{ s.isAuthenticated }}</p>
    </div>
  `
})
export class DashboardPage {
  auth = inject(AuthService);
  ngOnInit(){ this.auth.init(); }
  login(){ this.auth.login(); }
  logout(){ this.auth.logout(); }
}
