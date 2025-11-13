// src/app/pages/home.page.ts  (ajusta la ruta si tu archivo se llama diferente)

import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';

import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { OidcSecurityService } from 'angular-auth-oidc-client';
import {AuthService} from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [NgIf], // no usamos pipes/directivas extra
  styles: [`
    .hero { display: grid; gap: 1.5rem; align-items: center; padding: 3rem 1.25rem; max-width: 1100px; margin: 0 auto; }
    @media (min-width: 900px){ .hero { grid-template-columns: 1.1fr 0.9fr; } }
    .title { font-size: clamp(1.8rem, 2.5vw, 2.6rem); font-weight: 700; margin: 0; }
    .subtitle { font-size: clamp(1rem, 1.6vw, 1.15rem); color: #4b5563; margin: .5rem 0 1rem; }
    .cta-row { display: flex; gap: .75rem; flex-wrap: wrap; }
    .btn { padding: .7rem 1rem; border-radius: .75rem; border: 1px solid transparent; cursor: pointer; font-weight: 600; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-secondary { background: white; color: #1f2937; border-color: #d1d5db; }
    .cards { display: grid; gap: 1rem; grid-template-columns: repeat(1, minmax(0,1fr)); max-width: 1100px; margin: 2rem auto; padding: 0 1.25rem; }
    @media (min-width: 900px){ .cards { grid-template-columns: repeat(3, minmax(0,1fr)); } }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1rem; }
    .card h3 { margin:.25rem 0 .25rem; font-size: 1.05rem; }
    .muted { color:#6b7280; font-size:.95rem; }
    .help { max-width: 1100px; margin: 2rem auto; padding: 0 1.25rem; display:grid; gap:1rem; }
    .help .box { background: #f9fafb; border:1px solid #e5e7eb; border-radius: 1rem; padding: 1rem; }
    header { border-bottom: 1px solid #e5e7eb; }
    .nav { max-width:1100px; margin:0 auto; padding:.85rem 1.25rem; display:flex; align-items:center; justify-content:space-between; }
    .brand { font-weight:800; letter-spacing:.2px; }
    footer { border-top: 1px solid #e5e7eb; margin-top: 2rem; }
    .foot { max-width:1100px; margin:0 auto; padding:1rem 1.25rem; font-size:.9rem; color:#6b7280; display:flex; gap:.75rem; justify-content:space-between; flex-wrap:wrap; }
    .links { display:flex; gap:.75rem; flex-wrap:wrap; }
    .illus { display:none; }
    @media (min-width: 900px){ .illus { display:block; background: radial-gradient(120px 120px at 70% 20%, #dbeafe 10%, transparent 60%), linear-gradient(180deg, #eff6ff, #ffffff); border:1px solid #e5e7eb; height: 320px; border-radius: 1rem; } }
  `],
  template: `
    <header>
      <nav class="nav">
        <div class="brand">OdontoWeb</div>
        <div class="cta-row" *ngIf="isBrowser">
          <button class="btn btn-secondary" (click)="goRegistro()">Registrarme</button>
          <button class="btn btn-primary" (click)="login()">Iniciar sesión</button>
        </div>
      </nav>
    </header>

    <section class="hero">
      <div>
        <h1 class="title">Gestiona tu atención odontológica con facilidad</h1>
        <p class="subtitle">Regístrate, activa tu cuenta desde tu correo y accede con seguridad usando OAuth2 + PKCE.</p>
        <div class="cta-row" *ngIf="isBrowser">
          <button class="btn btn-primary" (click)="goRegistro()">Registrarme</button>
          <button class="btn btn-secondary" (click)="login()">Iniciar sesión</button>
        </div>
        <p class="muted" style="margin-top:.75rem;">¿Ya te registraste y no te llegó el correo?
          <a href="" (click)="resend($event)" style="text-decoration:underline;">Reenviar activación</a>
        </p>
      </div>
      <div class="illus" aria-hidden="true"></div>
    </section>

    <section class="cards">
      <div class="card">
        <h3>1) Completa tu registro</h3>
        <p class="muted">Datos básicos para que el equipo valide tu solicitud.</p>
      </div>
      <div class="card">
        <h3>2) Activa desde tu correo</h3>
        <p class="muted">Recibirás un enlace seguro con vencimiento para definir tu contraseña.</p>
      </div>
      <div class="card">
        <h3>3) Ingresa a tu panel</h3>
        <p class="muted">Accede con tus credenciales y gestiona tu información.</p>
      </div>
    </section>

    <section class="help">
      <div class="box">
        <strong>¿Tu enlace venció?</strong>
        <p class="muted">Pide un nuevo enlace de activación. Si necesitas ayuda, contáctanos.</p>
      </div>
      <div class="box">
        <strong>Soporte</strong>
        <p class="muted">Escríbenos a soporte&#64;odontoweb.local</p>
      </div>
    </section>

    <footer>
      <div class="foot">
        <div>© {{ year }} OdontoWeb</div>
        <div class="links">
          <a href="#" (click)="$event.preventDefault()">Privacidad</a>
          <a href="#" (click)="$event.preventDefault()">Términos</a>
          <a href="#" (click)="$event.preventDefault()">Contacto</a>
        </div>
      </div>
    </footer>
  `
})
export class HomePage implements OnInit {

  private router = inject(Router);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private oidc = inject(OidcSecurityService);
  private platformId = inject(PLATFORM_ID);

  isBrowser = isPlatformBrowser(this.platformId);
  year = new Date().getFullYear();

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const result = await firstValueFrom(this.oidc.checkAuth());
      if (!result.isAuthenticated) {
        return;
      }

      // 1) leer redirect deseado de sessionStorage (lo pone AuthService.startLogin)
      let redirect = '/';
      try {
        const stored = sessionStorage.getItem('post_login_redirect');
        if (stored && stored.startsWith('/') && !stored.startsWith('//') && !stored.includes('http')) {
          redirect = stored;
        }
        sessionStorage.removeItem('post_login_redirect');
      } catch (e) {
        console.warn('No se pudo leer post_login_redirect', e);
      }

      // 2) refinar por roles desde /api/me
      try {
        const me: any = await firstValueFrom(this.http.get('/api/me'));
        const roles: string[] = me?.roles ?? [];
        if (roles.includes('ROLE_SUPERUSER')) {
          redirect = '/admin/solicitudes';
        } else if (roles.includes('ROLE_DENTIST')) {
          redirect = '/dashboard';
        }
      } catch (e) {
        console.warn('No se pudo leer /api/me', e);
      }

      this.router.navigateByUrl(redirect);
    } catch (err) {
      console.warn('checkAuth (home) error:', err);
    }
  }

  goRegistro(): void {
    this.router.navigateByUrl('/registro');
  }

  login(): void {
    if (!this.isBrowser) return;
    // queremos que después de login vaya a /admin/solicitudes
    this.auth.startLogin('/admin/solicitudes');
  }

  resend(e: Event): void {
    e.preventDefault();
    // aquí luego podrás implementar reenvío de correo de activación
    console.log('TODO: implementar reenvío de activación');
  }
}
