// src/app/features/clinic/clinic-staff.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface StaffView {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
  status: string;
  phone?: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ClinicStaffApi {
  private http = inject(HttpClient);
  // base server path (ej: http://localhost:8080)
  private base = environment.apiBase;

  private buildUrl(path: string) {
    // path ejemplo: /api/clinic/2/staff
    return `${this.base}${path}`;
  }

  listStaff(clinicId: number, page = 0, size = 20): Observable<Page<StaffView>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    const url = this.buildUrl(`/api/clinic/${clinicId}/staff`);
    return this.http.get<Page<StaffView>>(url, { params });
  }

  createDoctor(clinicId: number, payload: {
    nombre: string;
    apellido: string;
    email: string;
    username?: string | null;
    phone?: string | null;
    roleNames?: string[] | null;
  }) {
    const url = this.buildUrl(`/api/clinic/${clinicId}/staff/doctors`);
    return this.http.post(url, payload);
  }

  createAssistant(clinicId: number, payload: {
    nombre: string;
    apellido: string;
    email: string;
    username?: string | null;
    phone?: string | null;
    roleNames?: string[] | null;
  }) {
    const url = this.buildUrl(`/api/clinic/${clinicId}/staff/assistants`);
    return this.http.post(url, payload);
  }

  updateStaff(clinicId: number, userId: number, payload: {
    nombre: string; apellido: string; email: string; username?: string | null; phone?: string | null; roleNames?: string[] | null; status?: string | null;
  }) {
    const url = this.buildUrl(`/api/clinic/${clinicId}/staff/${userId}`);
    return this.http.put(url, payload);
  }

  activateStaff(clinicId: number, userId: number) {
    const url = this.buildUrl(`/api/clinic/${clinicId}/staff/${userId}/activate`);
    return this.http.post(url, {});
  }

  deactivateStaff(clinicId: number, userId: number) {
    const url = this.buildUrl(`/api/clinic/${clinicId}/staff/${userId}/deactivate`);
    return this.http.post(url, {});
  }

}
