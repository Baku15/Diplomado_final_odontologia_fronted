// src/app/features/admin/admin.data-access.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegistrationRequestViewDto } from '../../core/models/registration';

@Injectable({ providedIn: 'root' })
export class AdminDataAccess {
  private http = inject(HttpClient);
  // nota: aquí tenías '/api/admin/registrations' (distinto a registration-requests)
  // mantenlo si tu backend usa esa ruta; si no, unifícalo.
  private base = '/api/admin/registrations';

  private buildUrl(path: string): string {
    if (typeof window !== 'undefined' && window?.location?.origin) {
      return `${window.location.origin}${path}`;
    }
    return `http://localhost:8080${path}`;
  }

  listPending(page = 0, size = 20) {
    const path = `${this.base}/pending?page=${page}&size=${size}`;
    const url = this.buildUrl(path);
    return this.http.get<{ content: RegistrationRequestViewDto[] }>(url);
  }

  approve(id: number, body: { username?: string; roleName?: string; sendTempPassword?: boolean }) {
    const url = this.buildUrl(`${this.base}/${id}/approve`);
    return this.http.post(url, body);
  }

  reject(id: number) {
    const url = this.buildUrl(`${this.base}/${id}/reject`);
    return this.http.post(url, {});
  }
}
