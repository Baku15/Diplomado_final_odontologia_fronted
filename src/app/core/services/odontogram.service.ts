// src/app/features/clinic/patients/odontogram/odontogram.service.ts

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  DentalChartDto,
  UpsertToothRequest,
  AddProcedureRequest,
  DentalProcedureDto,
  ToothAttachmentDto
} from '../models/odontogram.model';
import { PatientService } from './patient.service';

@Injectable({ providedIn: 'root' })
export class OdontogramService {
  private http = inject(HttpClient);
  private patientService = inject(PatientService);

  private baseUrl(clinicId: number, patientId: number) {
    return `${this.patientService.apiBaseUrl}/api/clinic/${clinicId}/patients/${patientId}/odontogram`;
  }

  async getActiveChart(clinicId: number, patientId: number): Promise<DentalChartDto | null> {
    try {
      return await firstValueFrom(this.http.get<DentalChartDto>(this.baseUrl(clinicId, patientId)));
    } catch (e: any) {
      if (e?.status === 204) return null;
      throw e;
    }
  }

  async createChart(clinicId: number, patientId: number, clinicalRecordId?: number) {
    const url = `${this.baseUrl(clinicId, patientId)}${clinicalRecordId ? `?clinicalRecordId=${clinicalRecordId}` : ''}`;
    return firstValueFrom(this.http.post<DentalChartDto>(url, {}));
  }

  async upsertTooth(clinicId: number, patientId: number, chartId: number, req: UpsertToothRequest) {
    return firstValueFrom(
      this.http.put<DentalChartDto>(`${this.baseUrl(clinicId, patientId)}/${chartId}/tooth`, req)
    );
  }

  async addProcedure(clinicId: number, patientId: number, chartId: number, req: AddProcedureRequest) {
    return firstValueFrom(
      this.http.post<DentalProcedureDto>(`${this.baseUrl(clinicId, patientId)}/${chartId}/procedures`, req)
    );
  }

  async updateProcedure(clinicId: number, patientId: number, chartId: number, procedureId: number, req: AddProcedureRequest) {
    return firstValueFrom(
      this.http.put<DentalProcedureDto>(
        `${this.baseUrl(clinicId, patientId)}/${chartId}/procedures/${procedureId}`,
        req
      )
    );
  }

  async completeProcedure(clinicId: number, patientId: number, chartId: number, procedureId: number) {
    return firstValueFrom(
      this.http.patch<DentalProcedureDto>(
        `${this.baseUrl(clinicId, patientId)}/${chartId}/procedures/${procedureId}/complete`,
        {}
      )
    );
  }

  async closeChart(clinicId: number, patientId: number, chartId: number) {
    return firstValueFrom(
      this.http.post<DentalChartDto>(`${this.baseUrl(clinicId, patientId)}/${chartId}/close`, {})
    );
  }

  async getHistory(clinicId: number, patientId: number) {
    return firstValueFrom(
      this.http.get<DentalChartDto[]>(`${this.baseUrl(clinicId, patientId)}/history`)
    );
  }

  // ================================
  // 🆕 IMÁGENES POR DIENTE
  // ================================

  async listToothAttachments(
    clinicId: number,
    patientId: number,
    chartId: number,
    toothNumber: number
  ): Promise<ToothAttachmentDto[]> {
    const url = `${this.baseUrl(clinicId, patientId)}/${chartId}/tooth/${toothNumber}/attachments`;
    return firstValueFrom(this.http.get<ToothAttachmentDto[]>(url));
  }

  async addToothAttachment(
    clinicId: number,
    patientId: number,
    chartId: number,
    toothNumber: number,
    attachmentId: number
  ): Promise<ToothAttachmentDto> {
    const url = `${this.baseUrl(clinicId, patientId)}/${chartId}/tooth/${toothNumber}/attachments/${attachmentId}`;
    return firstValueFrom(this.http.post<ToothAttachmentDto>(url, {}));
  }

  async removeToothAttachment(
    clinicId: number,
    patientId: number,
    chartId: number,
    toothNumber: number,
    attachmentId: number
  ): Promise<void> {
    const url = `${this.baseUrl(clinicId, patientId)}/${chartId}/tooth/${toothNumber}/attachments/${attachmentId}`;
    await firstValueFrom(this.http.delete<void>(url));
  }
}
