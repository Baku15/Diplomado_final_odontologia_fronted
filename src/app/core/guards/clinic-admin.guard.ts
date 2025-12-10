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
    // SSR: no podemos llamar al backend con rutas relativas; dejamos pasar.
    if (!isPlatformBrowser(this.platformId)) {
      console.log('ClinicAdminGuard (SSR): saltando comprobación /api/me');
      return true;
    }

    try {
      // Llamada a /api/me para obtener roles y clinicId
      const me: any = await firstValueFrom(
        this.http.get('/api/me', { withCredentials: true })
      );

      console.log('ClinicAdminGuard: /api/me ->', me);

      const rawRoles: any = me?.roles ?? me?.role ?? [];
      const roles: string[] = Array.isArray(rawRoles)
        ? rawRoles.map((r: any) => String(r))
        : [String(rawRoles)].filter(Boolean);

      // Normalizar sin prefijos, mayúsculas
      const normalized = roles.map(r => r.replace(/^ROLE_/, '').toUpperCase());

      // Roles permitidos: CLINIC_ADMIN o DENTIST o SUPERUSER
      const allowed = normalized.some(r =>
        ['CLINIC_ADMIN', 'DENTIST', 'SUPERUSER'].includes(r)
      );

      if (!allowed) {
        console.warn('ClinicAdminGuard: acceso denegado. Roles del usuario:', normalized);
        // Redirigir a home o dashboard (elige lo que mejor convenga)
        await this.router.navigateByUrl('/');
        return false;
      }

      // todo ok
      return true;
    } catch (err) {
      console.error('ClinicAdminGuard: error consultando /api/me', err);
      // si falla la consulta, redirigimos a home
      try { await this.router.navigateByUrl('/'); } catch {}
      return false;
    }
  }
}
