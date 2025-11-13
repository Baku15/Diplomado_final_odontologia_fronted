import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {AuthService} from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [RouterLink],
  template: `
    <section style="max-width:420px;margin:48px auto;padding:24px;border:1px solid #eee;border-radius:12px">
      <h1 style="margin-top:0">Iniciar sesión</h1>
      <p>Para entrar, pulsa “Ingresar”. Serás redirigido a la página segura de la clínica para introducir tu usuario y contraseña.</p>

      <div style="display:flex; gap:8px; margin-top:16px;">
        <button (click)="ingresar()" style="padding:10px 16px">Ingresar</button>
        <a routerLink="/registro" style="padding:10px 16px; border:1px solid #ccc; border-radius:6px; text-align:center">Registrarse</a>
      </div>
    </section>
  `
})
export class LoginPage {
  private platformId = inject(PLATFORM_ID);
  private auth = inject(AuthService);

  ingresar() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.auth.startLogin('/admin/solicitudes');
  }
}
