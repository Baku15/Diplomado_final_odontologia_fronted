// src/app/core/services/clinic-staff.api.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface StaffView {
  id: number;
  username?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  phone?: string | null;
  roles?: string[];
  status?: string;
  // otros campos que tu backend devuelva...
}

export interface Page<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number; // page index
}

export interface CreateDoctorDto {
  nombre: string;
  apellido: string;
  email: string;
  username?: string;
  licenseNumber?: string;
  specialty?: string;
  phone?: string;
  address?: string;
}

export interface CreateAssistantDto {
  nombre: string;
  apellido: string;
  email: string;
  username?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class ClinicStaffApi {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/clinic`;

  createDoctor(clinicId: number, dto: CreateDoctorDto): Observable<any> {
    return this.http.post(`${this.base}/${clinicId}/doctors`, dto);
  }

  createAssistant(clinicId: number, dto: CreateAssistantDto): Observable<any> {
    return this.http.post(`${this.base}/${clinicId}/assistants`, dto);
  }

  /**
   * listStaff
   * - Si pasas page & size hace paginación (backend debe soportarla)
   * - Si no, hace GET simple y espera un array o una página (por compatibilidad)
   */
  listStaff(clinicId: number, page?: number, size?: number): Observable<StaffView[] | Page<StaffView>> {
    let url = `${this.base}/${clinicId}/staff`;

    if (page != null && size != null) {
      const params = new HttpParams()
        .set('page', String(page))
        .set('size', String(size));
      return this.http.get<Page<StaffView>>(url, { params });
    }

    return this.http.get<StaffView[]>(url);
  }

  /**
   * Endpoints para activar / desactivar staff.
   * Ajusta las rutas si tu backend usa otro path.
   */
  activateStaff(clinicId: number, staffId: number): Observable<any> {
    const url = `${this.base}/${clinicId}/staff/${staffId}/activate`;
    return this.http.post(url, null);
  }

  deactivateStaff(clinicId: number, staffId: number): Observable<any> {
    const url = `${this.base}/${clinicId}/staff/${staffId}/deactivate`;
    return this.http.post(url, null);
  }
}
