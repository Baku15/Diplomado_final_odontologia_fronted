import { Injectable, Injector, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  // Lazy get: solo resuelve el servicio si estamos en browser
  private get oidc(): OidcSecurityService | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return this.injector.get(OidcSecurityService);
  }

  init()   { /* opcional */ }

  /** Inicia el flujo OIDC guardando primero la ruta interna segura */
  startLogin(redirectTo: string = '/') {
    if (!isPlatformBrowser(this.platformId)) {
      // en entorno server no intentamos usar sessionStorage
      this.oidc?.authorize();
      return;
    }

    try {
      // Validación básica: ruta interna segura
      if (typeof redirectTo === 'string' && redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.includes('http')) {
        if (!redirectTo.includes('..')) {
          sessionStorage.setItem('post_login_redirect', redirectTo);
        } else {
          sessionStorage.removeItem('post_login_redirect');
        }
      } else {
        sessionStorage.removeItem('post_login_redirect');
      }
    } catch (e) {
      console.warn('No se pudo escribir post_login_redirect en sessionStorage', e);
    }

    // Iniciar flujo OIDC
    this.oidc?.authorize();
  }

  // Mantengo login() para compatibilidad (inicia sin guardar redirect)
  login()  { this.oidc?.authorize(); }

  logout() {
    try { sessionStorage.removeItem('post_login_redirect'); } catch {}
    this.oidc?.logoff();
  }

  clearPostLoginRedirect() {
    try { sessionStorage.removeItem('post_login_redirect'); } catch {}
  }

  // Observables seguros (pueden ser undefined en SSR)
  get isAuthenticated$() { return this.oidc?.isAuthenticated$; }
  get userData$()        { return this.oidc?.userData$; }
}
