// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HttpClient } from '@angular/common/http';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private oidc = inject(OidcSecurityService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$ = this._isAuthenticated.asObservable();

  private _userData = new BehaviorSubject<any | null>(null);
  public readonly userData$ = this._userData.asObservable();

  private isAbsoluteUrl(u?: string): boolean {
    return typeof u === 'string' && (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//).test(u);
  }

  /**
   * Inicializa el servicio: intenta recuperar sesión (checkAuth).
   * Llamar desde el shell o componentes que se carguen al inicio.
   */
  init(): void {
    const anyOidc: any = this.oidc;
    const candidate = (typeof window !== 'undefined' && this.isAbsoluteUrl(window.location?.href))
      ? window.location.href
      : undefined;

    if (typeof anyOidc.checkAuth === 'function') {
      try {
        if (candidate) {
          anyOidc.checkAuth(candidate).subscribe((res: any) => this.handleCheckAuthResult(res), (err: any) => {
            console.warn('AuthService.init: checkAuth(candidate) failed, trying fallback', err);
            try {
              anyOidc.checkAuth().subscribe((r: any) => this.handleCheckAuthResult(r), (e: any) => this.handleCheckAuthError(e));
            } catch (e) {
              this.handleCheckAuthError(e);
            }
          });
        } else {
          anyOidc.checkAuth().subscribe((res: any) => this.handleCheckAuthResult(res), (err: any) => this.handleCheckAuthError(err));
        }
      } catch (err) {
        this.handleCheckAuthError(err);
      }
    } else {
      console.warn('AuthService.init: checkAuth no existe en OidcSecurityService');
    }
  }

  private handleCheckAuthResult(res: any) {
    const isAuth = !!res?.isAuthenticated;
    this._isAuthenticated.next(isAuth);
    if (res?.userData) {
      this._userData.next(res.userData);
    } else {
      this._userData.next(null);
    }
    console.debug('AuthService.checkAuth result:', {isAuthenticated: isAuth, userData: res?.userData ?? null});
  }

  private handleCheckAuthError(err: any) {
    console.warn('AuthService.checkAuth error', err);
    this._isAuthenticated.next(false);
    this._userData.next(null);
  }

  /**
   * Inicia el flujo de login usando la librería (genera state + code_verifier).
   * Guarda la ruta de retorno en sessionStorage antes de autorizar.
   */
  startLogin(postLoginRedirect: string = '/') {
    try {
      if (postLoginRedirect && postLoginRedirect.startsWith('/') && !postLoginRedirect.includes('http')) {
        sessionStorage.setItem('post_login_redirect', postLoginRedirect);
      } else {
        sessionStorage.setItem('post_login_redirect', '/');
      }

      const anyOidc: any = this.oidc;
      if (typeof anyOidc.authorize === 'function') {
        try {
          // intenta con configId si la versión lo soporta
          anyOidc.authorize('odontoweb');
        } catch (e) {
          // fallback sin configId
          anyOidc.authorize();
        }
        return;
      }

      console.error('AuthService.startLogin: authorize() no existe en OidcSecurityService');
    } catch (err) {
      console.error('AuthService.startLogin error', err);
    }
  }

  /**
   * Logout robusto y awaitable:
   * - intenta POST /api/auth/revoke (withCredentials: true)
   * - siempre hace cleanup local (subjects + storage)
   * - navega al home (router) al finalizar
   */
  async logout(): Promise<void> {
    const localCleanup = () => {
      try {
        this._isAuthenticated.next(false);
      } catch {
      }
      try {
        this._userData.next(null);
      } catch {
      }
      try {
        sessionStorage.clear();
      } catch {
      }
      try {
        localStorage.clear();
      } catch {
      }
    };

    // 1️⃣ Llamar backend para invalidar sesión JSESSIONID
    try {
      await firstValueFrom(
        this.http.post('/api/auth/revoke', null, {withCredentials: true})
          .pipe(catchError(() => of(null)))
      );
    } catch {
    }

    // 2️⃣ 🔥 Muy importante: eliminar tokens del OIDC CLIENT
    try {
      await this.oidc.logoffLocal();   // ← ESTO ES LA CLAVE
    } catch (e) {
      console.warn('logoffLocal falló', e);
    }

    // 3️⃣ Limpieza interna
    localCleanup();

    // 4️⃣ Navegar a home
    try {
      await this.router.navigateByUrl('/');
    } catch {
      window.location.href = '/';
    }
  }
}
