// src/app/features/admin/admin.data-access.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegistrationRequestViewDto } from '../../core/models/registration';

@Injectable({ providedIn: 'root' })
export class AdminDataAccess {
  private http = inject(HttpClient);
  private base = '/api/admin/registrations';

  listPending(page = 0, size = 20) {
    return this.http.get<{content: RegistrationRequestViewDto[]}>(`${this.base}/pending?page=${page}&size=${size}`);
  }

  approve(id: number, body: { username?: string; roleName?: string; sendTempPassword?: boolean }) {
    return this.http.post(`${this.base}/${id}/approve`, body);
  }

  reject(id: number) {
    return this.http.post(`${this.base}/${id}/reject`, {});
  }
}
