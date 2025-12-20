// src/app/core/services/clinical-record.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ClinicalRecordDetail } from '../models/clinical-record.model';
import { PatientService } from './patient.service';

@Injectable({ providedIn: 'root' })
export class ClinicalRecordService {

  private http = inject(HttpClient);
  private patientService = inject(PatientService);
  private apiBase = environment.apiBase;

  // ===============================
  // 🔑 Resolver clinicId (1 sola vez)
  // ===============================
  private async resolveClinicId(): Promise<number> {
    const clinicId = await this.patientService.getClinicIdForRoutes();
    if (!clinicId) {
      throw new Error('No clinicId disponible');
    }
    return clinicId;
  }

  // ===============================
  // 📘 Obtener historia clínica
  // ===============================
  async getByPatient(
    patientId: number
  ): Promise<ClinicalRecordDetail | null> {

    const clinicId = await this.resolveClinicId();
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record`;

    return lastValueFrom(
      this.http.get<ClinicalRecordDetail>(url).pipe(
        catchError(err => {
          if (err.status === 404) return of(null);
          throw err;
        })
      )
    );
  }

  // ===============================
  // ✏️ Crear / actualizar historia
  // ===============================
  async upsertForPatient(
    patientId: number,
    record: ClinicalRecordDetail
  ): Promise<ClinicalRecordDetail> {

    const clinicId = await this.resolveClinicId();
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record`;

    const payload: ClinicalRecordDetail = {
      ...record,
      vitalSigns: record.vitalSigns || {},
    };

    if (record.id) {
      return lastValueFrom(this.http.put<ClinicalRecordDetail>(url, payload));
    }

    return lastValueFrom(this.http.post<ClinicalRecordDetail>(url, payload));
  }

  // ===============================
  // 🔒 Cerrar historia clínica
  // ===============================
  async closeClinicalRecord(
    patientId: number
  ): Promise<ClinicalRecordDetail> {

    const clinicId = await this.resolveClinicId();
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record/close`;

    return lastValueFrom(this.http.post<ClinicalRecordDetail>(url, {}));
  }

  // ===============================
  // 📤 Exportar FHIR
  // ===============================
  async exportFhir(
    patientId: number
  ): Promise<string> {

    const clinicId = await this.resolveClinicId();
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/clinical-record/fhir`;

    return lastValueFrom(
      this.http.get(url, { responseType: 'text' })
    );
  }
}
