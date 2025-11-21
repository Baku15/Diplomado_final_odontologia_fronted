// src/app/features/clinic/clinic-admin.guard.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClinicAdminGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async canActivate(): Promise<boolean> {
    // 🟡 Igual: en SSR no llamamos al backend con URL relativa
    if (!isPlatformBrowser(this.platformId)) {
      console.log('ClinicAdminGuard (SSR): saltando comprobación de /api/me');
      return true;
    }

    try {
      const me: any = await firstValueFrom(
        this.http.get('/api/me', { withCredentials: true })
      );
      const roles: string[] = me?.roles ?? [];

      console.log('ClinicAdminGuard: /api/me =', me);

      const isClinicAdmin = roles.includes('ROLE_CLINIC_ADMIN');

      if (!isClinicAdmin) {
        console.warn(
          'ClinicAdminGuard: usuario sin ROLE_CLINIC_ADMIN, redirigiendo a /'
        );
        this.router.navigateByUrl('/');
        return false;
      }

      return true;
    } catch (err) {
      console.error('ClinicAdminGuard: error consultando /api/me', err);
      this.router.navigateByUrl('/');
      return false;
    }
  }
}
