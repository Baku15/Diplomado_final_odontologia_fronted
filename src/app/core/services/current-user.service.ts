// src/app/core/services/current-user.service.ts
import { inject, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  /**
   * Synchronous helper used by components that need an immediate clinicId.
   * It tries multiple fallbacks:
   *  - OidcSecurityService.getUserData() (if available synchronously)
   *  - current cached userData accessible via internal properties (best-effort)
   * If nothing is available, returns null.
   */
  getClinicIdSync(): number | null {
    try {
      // Prefer public synchronous getter if present (some versions expose it)
      const maybeGetUserData = (this.oidc as any).getUserData;
      const ud = typeof maybeGetUserData === 'function' ? maybeGetUserData.call(this.oidc) : (this.oidc as any).getUserData?.() ?? null;

      // fallback: try to read a cached snapshot from the service (implementation-specific)
      const fallback = (this.oidc as any).userData ?? (this.oidc as any)._userData ?? null;

      const data: any = ud ?? fallback ?? null;
      const clinic = data?.clinic_id ?? data?.clinicId ?? null;
      if (clinic == null) return null;
      const n = typeof clinic === 'string' ? Number(clinic) : clinic;
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  /**
   * Observable helper (reactive) that emits clinicId when userData changes.
   */
  getClinicId$(): Observable<number | null> {
    return this.oidc.userData$.pipe(
      map((ud: any) => {
        const clinic = ud?.clinic_id ?? ud?.clinicId ?? null;
        const n = clinic == null ? null : (typeof clinic === 'string' ? Number(clinic) : clinic);
        return Number.isFinite(n) ? n : null;
      })
    );
  }
}
