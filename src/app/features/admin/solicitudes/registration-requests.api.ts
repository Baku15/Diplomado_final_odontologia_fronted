// src/app/features/admin/solicitudes/registration-requests.api.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

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
  username?: string;        // opcional: el admin puede definir el username
  roleName?: string;        // opcional: normalmente "ROLE_DENTIST"
}

@Injectable({ providedIn: 'root' })
export class RegistrationRequestsApi {
  private base = '/api/admin/registration-requests';
  constructor(private http: HttpClient) {}

  /** 🔹 Listado de solicitudes pendientes */
  listPending(page = 0, size = 20) {
    const params = new HttpParams()
      .set('status', 'PENDIENTE')
      .set('page', page)
      .set('size', size);
    return this.http.get<Page<RegistrationRequestView>>(this.base, { params });
  }

  /** 🔹 Aprobar solicitud (crea usuario y envía link de activación) */
  approve(id: number, body: ApprovePayload = { roleName: 'ROLE_DENTIST' }) {
    return this.http.post<void>(`${this.base}/${id}/approve`, body);
  }

  /** 🔹 Rechazar solicitud con motivo (opcional) */
  reject(id: number, reason = 'Rechazado por el administrador') {
    // En tu backend puede ser body o parámetro query; si usas query:
    const params = new HttpParams().set('reason', reason);
    return this.http.post<void>(`${this.base}/${id}/reject`, {}, { params });
  }
}
