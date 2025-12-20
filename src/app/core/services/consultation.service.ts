import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ClinicalConsultationDto,
  CloseConsultationRequest
} from '../models/consultation.model';
import {DentalProcedureDto} from '../models/odontogram.model';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private http = inject(HttpClient);

  private baseUrl(clinicId: number, patientId: number) {
    return `/api/clinic/${clinicId}/patients/${patientId}/consultations`;
  }

  async getActiveConsultation(
    clinicId: number,
    patientId: number
  ): Promise<ClinicalConsultationDto | null> {
    try {
      return await firstValueFrom(
        this.http.get<ClinicalConsultationDto>(
          `${this.baseUrl(clinicId, patientId)}/active`
        )
      );
    } catch (e: any) {
      if (e?.status === 204) return null;
      throw e;
    }
  }

  async listConsultations(
    clinicId: number,
    patientId: number
  ): Promise<ClinicalConsultationDto[]> {
    return firstValueFrom(
      this.http.get<ClinicalConsultationDto[]>(
        `${this.baseUrl(clinicId, patientId)}`
      )
    );
  }


  async closeConsultation(
    clinicId: number,
    patientId: number,
    consultationId: number,
    req: CloseConsultationRequest
  ): Promise<ClinicalConsultationDto> {
    return firstValueFrom(
      this.http.post<ClinicalConsultationDto>(
        `${this.baseUrl(clinicId, patientId)}/${consultationId}/close`,
        req
      )
    );
  }

// 🔥 NUEVO – obtener consulta por ID
  async getById(
    clinicId: number,
    patientId: number,
    consultationId: number
  ): Promise<ClinicalConsultationDto> {
    return firstValueFrom(
      this.http.get<ClinicalConsultationDto>(
        `${this.baseUrl(clinicId, patientId)}/${consultationId}`
      )
    );
  }


  // 🔥 NUEVO – procedimientos de la consulta
  async listProcedures(
    clinicId: number,
    patientId: number,
    consultationId: number
  ): Promise<DentalProcedureDto[]> {
    return firstValueFrom(
      this.http.get<DentalProcedureDto[]>(
        `${this.baseUrl(clinicId, patientId)}/${consultationId}/procedures`
      )
    );
  }

  async getActiveOrInProgress(
    clinicId: number,
    patientId: number
  ): Promise<ClinicalConsultationDto | null> {
    try {
      return await firstValueFrom(
        this.http.get<ClinicalConsultationDto>(
          `/api/clinic/${clinicId}/patients/${patientId}/consultations/active-or-in-progress`
        )
      );
    } catch (e: any) {
      if (e?.status === 204 || e?.status === 404) return null;
      throw e;
    }
  }

  // 🔄 Entrar al odontograma (IN_PROGRESS → ACTIVE)
  async enterOdontogram(
    clinicId: number,
    patientId: number
  ): Promise<ClinicalConsultationDto> {
    return firstValueFrom(
      this.http.post<ClinicalConsultationDto>(
        `/api/clinic/${clinicId}/patients/${patientId}/consultations/enter-odontogram`,
        {}
      )
    );
  }

  // 🚪 Salir del odontograma (manejo automático de estado)
  async leaveOdontogram(
    consultationId: number,
    hasClinicalChanges: boolean
  ): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `/api/clinic/0/patients/0/consultations/${consultationId}/leave-odontogram?hasClinicalChanges=${hasClinicalChanges}`,
        {}
      )
    );
  }


}
