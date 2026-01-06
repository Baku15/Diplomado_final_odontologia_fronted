// src/app/pages/home.page.ts
import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';

import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AuthService } from '../core/services/auth.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [NgIf, NavbarComponent],
  styles: [/* 👇 tus estilos tal cual, no los toco */ `
    :host {
      display: block;
      min-height: 100vh;
      background: radial-gradient(circle at top left, #e0f2fe 0, transparent 55%),
      radial-gradient(circle at bottom right, #fef9c3 0, transparent 55%),
      #f3f4f6;
    }

    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.5rem 1.25rem 2.5rem;
    }

    .hero {
      display: grid;
      gap: 2rem;
      align-items: stretch;
      margin-top: 1.5rem;
    }

    @media (min-width: 900px){
      .hero { grid-template-columns: 1.15fr 0.85fr; }
    }

    .hero-card {
      background: linear-gradient(135deg, #ffffff, #eff6ff);
      border-radius: 1.25rem;
      padding: 1.75rem 1.5rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      border: 1px solid #dbeafe;
      position: relative;
      overflow: hidden;
    }

    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .25rem .7rem;
      border-radius: 999px;
      background: rgba(37, 99, 235, 0.06);
      border: 1px solid rgba(37, 99, 235, 0.18);
      font-size: .78rem;
      font-weight: 600;
      color: #1d4ed8;
      margin-bottom: .6rem;
    }

    .hero-pill span.emoji {
      font-size: 1rem;
    }

    .title {
      font-size: clamp(2rem, 2.7vw, 2.7rem);
      font-weight: 800;
      margin: 0;
      letter-spacing: -.03em;
      color: #0f172a;
    }

    .subtitle {
      font-size: clamp(1rem, 1.6vw, 1.1rem);
      color: #4b5563;
      margin: .7rem 0 1.2rem;
      max-width: 34rem;
    }

    .cta-row {
      display: flex;
      gap: .75rem;
      flex-wrap: wrap;
      margin-bottom: .75rem;
    }

    .btn {
      padding: .7rem 1.05rem;
      border-radius: .85rem;
      border: 1px solid transparent;
      cursor: pointer;
      font-weight: 600;
      font-size: .95rem;
      display: inline-flex;
      align-items: center;
      gap: .4rem;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.35);
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: white;
      color: #1f2937;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .muted {
      color:#6b7280;
      font-size:.9rem;
    }

    .muted a {
      color: #1d4ed8;
    }

    .muted a:hover {
      text-decoration: underline;
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem 1rem;
      margin-top: 1rem;
      font-size: .8rem;
      color: #6b7280;
    }

    .hero-meta-item {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      padding: .3rem .7rem;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.02);
    }

    .hero-meta-item span.icon {
      font-size: .95rem;
    }

    .illus {
      position: relative;
      background: linear-gradient(180deg, #eff6ff, #ffffff);
      border-radius: 1.25rem;
      border: 1px solid #dbeafe;
      overflow: hidden;
      padding: 1.25rem 1.25rem 1.5rem;
      display: grid;
      gap: 1rem;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
    }

    .illus-header {
      display: flex;
      flex-direction: column;
      gap: .25rem;
    }

    .illus-chip {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      align-self: flex-start;
      padding: .18rem .65rem;
      border-radius: 999px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      font-size: .78rem;
      font-weight: 600;
      color: #4338ca;
    }

    .illus-title {
      font-weight: 700;
      color: #1f2937;
      font-size: .98rem;
    }

    .illus-sub {
      font-size: .8rem;
      color: #6b7280;
    }

    .illus-steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: .75rem;
      font-size: .82rem;
    }

    .illus-step {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: .5rem .75rem;
      align-items: flex-start;
    }

    .illus-step-icon {
      width: 1.95rem;
      height: 1.95rem;
      border-radius: 999px;
      background: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: .9rem;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
    }

    .illus-step-body {
      display: flex;
      flex-direction: column;
      gap: .2rem;
    }

    .illus-step-title {
      font-weight: 600;
      color: #111827;
    }

    .illus-step-text {
      color: #6b7280;
    }

    .illus-note {
      margin-top: .25rem;
      font-size: .78rem;
      color: #6b7280;
      border-top: 1px dashed #e5e7eb;
      padding-top: .5rem;
    }

    .cards-section {
      margin-top: 2.5rem;
      display: grid;
      gap: 1.25rem;
    }

    .cards-title {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
    }

    .cards {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(1, minmax(0,1fr));
    }

    @media (min-width: 900px){
      .cards { grid-template-columns: repeat(3, minmax(0,1fr)); }
    }

    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    }

    .card-icon {
      width: 2.1rem;
      height: 2.1rem;
      border-radius: .85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      margin-bottom: .5rem;
      background: #eff6ff;
      color: #1d4ed8;
    }

    .card h3 {
      margin:.15rem 0 .25rem;
      font-size: 1.02rem;
      color: #111827;
    }

    .help {
      margin-top: 2.25rem;
      display:grid;
      gap:1rem;
    }

    @media (min-width: 800px){
      .help { grid-template-columns: 1.2fr 0.8fr; }
    }

    .help .box {
      background: #f9fafb;
      border:1px solid #e5e7eb;
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.03);
    }

    .box strong {
      display:block;
      margin-bottom:.25rem;
      color:#111827;
    }

    footer {
      border-top: 1px solid #e5e7eb;
      margin-top: 2.5rem;
    }

    .foot {
      max-width:1100px;
      margin:0 auto;
      padding:1rem 0;
      font-size:.9rem;
      color:#6b7280;
      display:flex;
      gap:.75rem;
      justify-content:space-between;
      flex-wrap:wrap;
    }

    .links {
      display:flex;
      gap:.75rem;
      flex-wrap:wrap;
    }

    .links a {
      color:#6b7280;
      text-decoration:none;
      font-size:.88rem;
    }

    .links a:hover {
      text-decoration:underline;
    }
  `],
  template: `
    <!-- NAVBAR COMÚN -->
    <app-navbar></app-navbar>

    <main class="page">
      <section class="hero">
        <!-- Columna izquierda: texto principal -->
        <div class="hero-card">
          <div class="hero-pill">
            <span class="emoji">🦷</span>
            <span>Gestión clínica segura y ordenada</span>
          </div>

          <h1 class="title">
            Gestiona tu atención odontológica con facilidad
          </h1>

          <p class="subtitle">
            Registra tu clínica, activa tu cuenta desde tu correo y accede a un
            panel moderno para organizar tus pacientes, citas e indicadores clave.
          </p>

          <div class="cta-row" *ngIf="isBrowser">
            <button class="btn btn-secondary" (click)="login()">
              Ya tengo cuenta
            </button>
          </div>


          <div class="hero-meta">
            <div class="hero-meta-item">
              <span class="icon">🔐</span>
              <span>Login con OAuth2 + PKCE</span>
            </div>
            <div class="hero-meta-item">
              <span class="icon">📩</span>
              <span>Activación por correo con vencimiento</span>
            </div>
            <div class="hero-meta-item">
              <span class="icon">📊</span>
              <span>Diseñada para métricas clínicas</span>
            </div>
          </div>
        </div>

        <!-- Columna derecha: flujo de acceso en 3 pasos -->
        <aside class="illus" aria-hidden="true">
          <div class="illus-header">
            <span class="illus-chip">Flujo de acceso</span>
            <div class="illus-title">De registro a panel en tres pasos</div>
            <div class="illus-sub">
              Un vistazo rápido a lo que harás cuando utilices la plataforma.
            </div>
          </div>

          <ol class="illus-steps">
            <li class="illus-step">
              <div class="illus-step-icon">1</div>
              <div class="illus-step-body">
                <div class="illus-step-title">Te registras en línea</div>
                <div class="illus-step-text">
                  Completas un formulario simple con tus datos y los de tu consultorio.
                  Nuestro equipo revisa la información.
                </div>
              </div>
            </li>

            <li class="illus-step">
              <div class="illus-step-icon">2</div>
              <div class="illus-step-body">
                <div class="illus-step-title">Activas tu cuenta</div>
                <div class="illus-step-text">
                  Recibes un correo con un enlace seguro. Definís tu contraseña
                  y tu usuario queda listo para iniciar sesión.
                </div>
              </div>
            </li>

            <li class="illus-step">
              <div class="illus-step-icon">3</div>
              <div class="illus-step-body">
                <div class="illus-step-title">Accedes a tu panel</div>
                <div class="illus-step-text">
                  Según tu rol (superadmin o odontólogo), ingresarás al panel
                  correspondiente para gestionar tu día a día.
                </div>
              </div>
            </li>
          </ol>

          <div class="illus-note">
            Más adelante podrás ver estadísticas, alertas y métricas clínicas,
            pero siempre comenzando por este flujo simple de acceso.
          </div>
        </aside>
      </section>

      <section class="cards-section">
        <div class="cards-title">¿Cómo funciona?</div>
        <div class="cards">
          <div class="card">
            <div class="card-icon">1</div>
            <h3>Completa tu registro</h3>
            <p class="muted">
              Indícanos tus datos básicos y la información de tu consultorio para
              validar tu solicitud de acceso.
            </p>
          </div>

          <div class="card">
            <div class="card-icon">2</div>
            <h3>Activa desde tu correo</h3>
            <p class="muted">
              Recibirás un enlace seguro con fecha de vencimiento para definir tu
              contraseña de acceso.
            </p>
          </div>

          <div class="card">
            <div class="card-icon">3</div>
            <h3>Ingresa a tu panel</h3>
            <p class="muted">
              Una vez activada tu cuenta, podrás gestionar tus citas, pacientes y
              métricas en un entorno confiable.
            </p>
          </div>
        </div>
      </section>

      <section class="help">
        <div class="box">
          <strong>¿Tu enlace venció?</strong>
          <p class="muted">
            No te preocupes, puedes solicitar un nuevo enlace de activación usando el
            correo con el que te registraste. Si tienes dudas, nuestro equipo puede
            ayudarte a verificar tus datos.
          </p>
        </div>
        <div class="box">
          <strong>Soporte</strong>
          <p class="muted">
            Escríbenos a <strong>soporte&#64;odontoweb.local</strong> si necesitas
            asistencia durante el registro o la activación de tu cuenta.
          </p>
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
    </main>
  `,
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
        return; // usuario anónimo, se queda en el landing
      }

      // 1) leer redirect deseado de sessionStorage (lo pone AuthGuard / startLogin)
      let redirectFromStorage: string | null = null;
      try {
        const stored = sessionStorage.getItem('post_login_redirect');
        if (
          stored &&
          stored.startsWith('/') &&
          !stored.startsWith('//') &&
          !stored.includes('http')
        ) {
          redirectFromStorage = stored;
        }
        sessionStorage.removeItem('post_login_redirect');
      } catch (e) {
        console.warn('HomePage: no se pudo leer post_login_redirect', e);
      }

      // 2) /api/me → roles + mustCompleteProfile
      let redirectByRole: string | null = null;
      let mustComplete = false;
      let isDentist = false;

      try {
        const me: any = await firstValueFrom(this.http.get('/api/me'));
        console.debug('HomePage: /api/me =', me);

        const roles: string[] = Array.isArray(me?.roles) ? me.roles : [];
        const rolesNoPrefix = roles.map((r) =>
          String(r).replace(/^ROLE_/, '')
        );

        mustComplete = !!me?.mustCompleteProfile;
        isDentist =
          roles.includes('ROLE_DENTIST') || rolesNoPrefix.includes('DENTIST');

        if (
          roles.includes('ROLE_SUPERUSER') ||
          rolesNoPrefix.includes('SUPERUSER')
        ) {
          redirectByRole = '/admin/solicitudes';
        } else if (
          roles.includes('ROLE_CLINIC_ADMIN') ||
          rolesNoPrefix.includes('CLINIC_ADMIN')
        ) {
          // 👈 RUTA CORRECTA, NO /mi-clinica/dashboard
          redirectByRole = '/mi-clinica';
        } else if (
          roles.includes('ROLE_DENTIST') ||
          rolesNoPrefix.includes('DENTIST')
        ) {
          redirectByRole = '/dashboard';
        }
        // (aquí podrías añadir ASSISTANT / PATIENT)
      } catch (e) {
        console.warn('HomePage: no se pudo leer /api/me', e);
      }

      // 3) decidir destino final:
      //    prioridad 1: completar perfil
      //    prioridad 2: redirect guardado
      //    prioridad 3: redirect por rol
      let target: string | null = null;

      if (mustComplete && isDentist) {
        target = '/completar-perfil';
      } else {
        target = redirectFromStorage ?? redirectByRole ?? null;
      }

      const currentlyAtRoot =
        window.location.pathname === '/' ||
        window.location.pathname === '/index.html';

      if (target && (redirectFromStorage !== null || currentlyAtRoot)) {
        const ok = await this.router.navigateByUrl(target);
        if (!ok) {
          // por si falla el routing (ej. ruta mal escrita)
          window.location.href = target;
        }
      } else {
        console.debug(
          'HomePage: no se fuerza redirect, target=',
          target,
          ' currentlyAtRoot=',
          currentlyAtRoot
        );
      }
    } catch (err) {
      console.warn('HomePage: checkAuth error:', err);
    }
  }

  goRegistro(): void {
    this.router.navigateByUrl('/registro');
  }

  login(): void {
    if (!this.isBrowser) return;
    // Dejamos que el callback/Home decidan a dónde ir según rol y mustCompleteProfile
    this.auth.startLogin('/');
  }

  resend(e: Event): void {
    e.preventDefault();
    console.log('TODO: implementar reenvío de activación');
  }
}
