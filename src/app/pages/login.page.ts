// src/app/pages/login.page.ts
import {
  Component,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule],
  styles: [`
    :host {
      display: flex;
      min-height: 100vh;
      background: linear-gradient(135deg, #eff6ff, #fef9c3);
      align-items: center;
      justify-content: center;
    }

    .card {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 1.25rem;
      padding: 2rem 1.75rem;
      box-shadow: 0 25px 60px rgba(15,23,42,.15);
      border: 1px solid #e5e7eb;
    }

    h1 {
      margin: 0 0 .25rem;
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
    }

    p {
      margin: 0 0 1.5rem;
      color: #6b7280;
      font-size: .95rem;
    }

    .btn {
      width: 100%;
      padding: .8rem 1rem;
      border-radius: .9rem;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .5rem;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
      box-shadow: 0 15px 35px rgba(37,99,235,.35);
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .link {
      margin-top: 1rem;
      text-align: center;
      font-size: .9rem;
      color: #6b7280;
    }

    .link a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }

    .link a:hover {
      text-decoration: underline;
    }
  `],
  template: `
    <div class="card">
      <h1>Iniciar sesión</h1>
      <p>Accede a tu cuenta profesional de OdontoWeb</p>

      <button class="btn btn-primary" (click)="login()">
        <span>Ingresar</span>
        <span>→</span>
      </button>

      <div class="link">
        ¿No tienes cuenta?
        <a (click)="goRegistro()">Registrarse</a>
      </div>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  login(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // 👇 reutiliza EXACTAMENTE tu flujo actual
    this.auth.startLogin('/');
  }

  goRegistro(): void {
    this.router.navigateByUrl('/registro');
  }
}
