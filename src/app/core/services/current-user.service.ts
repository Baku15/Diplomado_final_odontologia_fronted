// src/app/core/services/current-user.service.ts
import { inject, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private oidc = inject(OidcSecurityService);

  // Helper: get raw userData as any (safety: convert to any to avoid TS index errors)
  private async getRawUserData(): Promise<any> {
    try {
      const data = await firstValueFrom(this.oidc.userData$);
      return data ?? {};
    } catch {
      return {};
    }
  }

  async getRoles(): Promise<string[]> {
    const data: any = await this.getRawUserData();
    // los tokens suelen traer claim 'roles' o 'role' o similares -> normalizamos
    const roles = Array.isArray(data?.roles)
      ? data.roles
      : (data?.role ? (Array.isArray(data.role) ? data.role : [data.role]) : []);
    // normalizar a strings y quitar prefijo ROLE_ si aparece
    return roles.map((r: any) => String(r)).filter(Boolean);
  }

  async isSuperuser(): Promise<boolean> {
    const roles = await this.getRoles();
    return roles.some(r => ['SUPERUSER', 'ROLE_SUPERUSER', 'superuser'].includes(r));
  }

  async isClinicAdmin(): Promise<boolean> {
    const roles = await this.getRoles();
    return roles.some(r => ['CLINIC_ADMIN', 'ROLE_CLINIC_ADMIN'].includes(r));
  }

  async isDentist(): Promise<boolean> {
    const roles = await this.getRoles();
    return roles.some(r => ['DENTIST', 'ROLE_DENTIST'].includes(r));
  }

  // getClaim seguro: mira en userData y devuelve claim si existe
  async getClaim<T = any>(claim: string): Promise<T | null> {
    const data: any = await this.getRawUserData();
    // usar acceso protegido para evitar TS index errors
    if (data && Object.prototype.hasOwnProperty.call(data, claim)) {
      return data[claim] as T;
    }
    return null;
  }

  async getClinicId(): Promise<number | null> {
    const c = await this.getClaim<number>('clinic_id');
    if (c == null) return null;
    // puede venir como string -> intentar parsear
    const n = typeof c === 'string' ? Number(c) : c;
    return Number.isFinite(n) ? n : null;
  }

  async getUserId(): Promise<number | null> {
    const u = await this.getClaim<number>('user_id');
    if (u == null) return null;
    const n = typeof u === 'string' ? Number(u) : u;
    return Number.isFinite(n) ? n : null;
  }
}
