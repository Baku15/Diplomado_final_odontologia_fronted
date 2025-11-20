// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, of, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  init(): void {
    const anyOidc: any = this.oidc;
    const candidate = (typeof window !== 'undefined' && this.isAbsoluteUrl(window.location?.href))
      ? window.location.href
      : undefined;

    if (typeof anyOidc.checkAuth === 'function') {
      try {
        if (candidate) {
          anyOidc.checkAuth(candidate)
            .subscribe((res: any) => this.handleCheckAuthResult(res), (err: any) => {
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
    // userData puede venir en res.userData o la librería expone userData$
    if (res?.userData) {
      this._userData.next(res.userData);
    } else {
      this._userData.next(null);
    }
    console.debug('AuthService.checkAuth result:', { isAuthenticated: isAuth, userData: res?.userData ?? null });
  }

  // Devuelve el access token (string) si existe, o '' si no
  getAccessToken(): string {
    try {
      // angular-auth-oidc-client expone getAccessToken() en la instancia OidcSecurityService
      const token = (this.oidc as any).getAccessToken();
      return token ?? '';
    } catch (e) {
      console.warn('AuthService.getAccessToken: no disponible', e);
      return '';
    }
  }


  private handleCheckAuthError(err: any) {
    console.warn('AuthService.checkAuth error', err);
    this._isAuthenticated.next(false);
    this._userData.next(null);
  }

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
          anyOidc.authorize('odontoweb');
        } catch {
          anyOidc.authorize();
        }
        return;
      }

      console.error('AuthService.startLogin: authorize() no existe en OidcSecurityService');
    } catch (err) {
      console.error('AuthService.startLogin error', err);
    }
  }

  async logout(): Promise<void> {
    const localCleanup = () => {
      try { this._isAuthenticated.next(false); } catch {}
      try { this._userData.next(null); } catch {}
      try { sessionStorage.clear(); } catch {}
      try { localStorage.clear(); } catch {}
    };

    try {
      await firstValueFrom(
        this.http.post('/api/auth/revoke', null, { withCredentials: true }).pipe(catchError(() => of(null)))
      );
    } catch {}

    try { await (this.oidc as any).logoffLocal(); } catch (e) { console.warn('logoffLocal falló', e); }

    localCleanup();

    try { await this.router.navigateByUrl('/'); } catch { window.location.href = '/'; }
  }
}
