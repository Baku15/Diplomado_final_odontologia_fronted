// src/app/features/admin/solicitudes/registration-requests.api.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {environment} from '../../../../environments/environment';

export interface RegistrationRequestView {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  status: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApprovePayload {
  username?: string;
  roleName?: string;
}

@Injectable({ providedIn: 'root' })
export class RegistrationRequestsApi {
  // base relativo (mantener para lectura humana)
  private base = '/api/admin/registration-requests';

  constructor(private http: HttpClient) {}

  // helper: construye URL absoluta según entorno (browser vs server)
  private buildUrl(path: string): string {
    return `${environment.apiBase}${path}`;
  }

  listPending(page = 0, size = 20) {
    const params = new HttpParams()
      .set('status', 'PENDIENTE')
      .set('page', page.toString())
      .set('size', size.toString());

    const url = this.buildUrl(this.base);
    return this.http.get<Page<RegistrationRequestView>>(url, { params });
  }

  approve(id: number, body: ApprovePayload = { roleName: 'ROLE_DENTIST' }) {
    const url = this.buildUrl(`${this.base}/${id}/approve`);
    return this.http.post<void>(url, body);
  }

  reject(id: number, reason = 'Rechazado por el administrador') {
    const params = new HttpParams().set('reason', reason);
    const url = this.buildUrl(`${this.base}/${id}/reject`);
    return this.http.post<void>(url, {}, { params });
  }
}
