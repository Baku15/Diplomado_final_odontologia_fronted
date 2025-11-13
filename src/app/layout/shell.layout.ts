import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';           // ⬅️ deja este
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],                         // ⬅️ quita AsyncPipe
  template: `
    <header style="display:flex;gap:12px;align-items:center;padding:10px;border-bottom:1px solid #eee;">
      <a routerLink="/">OdontoWeb</a>
      <nav style="display:flex;gap:8px;">
        <a routerLink="/login">Login</a>
        <a routerLink="/registro">Registro</a>
        <a routerLink="/admin/solicitudes">Admin</a>
      </nav>
      <span style="flex:1"></span>
      @if (isBrowser) {
        <button (click)="login()">Login</button>
        <button (click)="logout()">Logout</button>
      }
    </header>
    <main style="padding:16px;"><router-outlet /></main>
  `
})
export class ShellLayout {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  auth = inject(AuthService);
  ngOnInit(){ if (this.isBrowser) this.auth.init?.(); }
  login(){ if (this.isBrowser) this.auth.login(); }
  logout(){ if (this.isBrowser) this.auth.logout(); }
}
