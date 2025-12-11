// src/app/features/clinic/patients/clinical-record.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { ClinicalRecordDetail } from './clinical-record.model';

@Injectable({ providedIn: 'root' })
export class ClinicalRecordService {
  private http = inject(HttpClient);
  private currentUser = inject(CurrentUserService);
  public apiBase = environment.apiBase; // expuesto por si lo necesitas

  /**
   * Resuelve clinicId desde el token o /api/me.
   */
  private async resolveClinicId(): Promise<number | null> {
    try {
      const cid = await this.currentUser.getClinicId();
      if (cid) return cid;
    } catch {
      // ignore
    }

    try {
      const me: any = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/me`).pipe(catchError(() => of(null)))
      );
      if (me && (me.clinicId || me.clinic_id)) return Number(me.clinicId ?? me.clinic_id);
    } catch {
      // ignore
    }
    return null;
  }

  async getByPatient(patientId: number): Promise<ClinicalRecordDetail | null> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record`;
    try {
      const resp = await lastValueFrom(
        this.http.get<ClinicalRecordDetail>(url).pipe(
          catchError(err => {
            if (err.status === 404) {
              return of(null);
            }
            throw err;
          })
        )
      );
      return resp;
    } catch (e) {
      throw e;
    }
  }

  async upsertForPatient(
    patientId: number,
    record: ClinicalRecordDetail
  ): Promise<ClinicalRecordDetail> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const baseUrl = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record`;

    const payload: ClinicalRecordDetail = {
      ...record,
      vitalSigns: record.vitalSigns || {},
    };

    if (record.id) {
      return await lastValueFrom(this.http.put<ClinicalRecordDetail>(baseUrl, payload));
    } else {
      return await lastValueFrom(this.http.post<ClinicalRecordDetail>(baseUrl, payload));
    }
  }

  async exportFhir(patientId: number): Promise<string> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record/fhir`;
    const resp = await lastValueFrom(
      this.http.get(url, { responseType: 'text' })
    );
    return resp;
  }

  /**
   * Cierra la historia clínica ACTIVA del paciente (POST .../clinical-record/close).
   * Devuelve el DTO de la historia cerrada.
   */
  async closeClinicalRecord(patientId: number): Promise<ClinicalRecordDetail> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record/close`;
    // backend responde con ClinicalRecordDetailDto
    return await lastValueFrom(this.http.post<ClinicalRecordDetail>(url, {}));
  }
}
