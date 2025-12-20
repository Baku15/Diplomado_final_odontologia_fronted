// src/app/features/admin/solicitudes/admin-role.guard.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminRoleGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async canActivate(): Promise<boolean> {
    // 🟡 En SSR (Node) NO llamamos a /api/me porque la URL relativa rompe
    if (!isPlatformBrowser(this.platformId)) {
      console.log('AdminRoleGuard (SSR): saltando comprobación de /api/me');
      return true;
    }

    try {
      const me: any = await firstValueFrom(
        this.http.get('/api/me', { withCredentials: true })
      );
      const roles: string[] = me?.roles ?? [];

      console.log('AdminRoleGuard: /api/me =', me);

      const isSuperuser = roles.includes('ROLE_SUPERUSER');

      if (!isSuperuser) {
        console.warn(
          'AdminRoleGuard: usuario sin ROLE_SUPERUSER, redirigiendo a /'
        );
        this.router.navigateByUrl('/');
        return false;
      }

      return true;
    } catch (err) {
      console.error('AdminRoleGuard: error consultando /api/me', err);
      this.router.navigateByUrl('/');
      return false;
    }
  }
}
