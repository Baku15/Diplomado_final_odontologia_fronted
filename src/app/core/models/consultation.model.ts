// src/app/features/clinic/consultations/consultation.model.ts

export type ClinicalConsultationStatus =
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'CLOSED';

export interface ClinicalConsultationDto {
  id: number;
  clinicId: number;
  patientId: number;
  dentistId: number;
  doctorId: number;

  status: ClinicalConsultationStatus;

  startedAt: string;
  endedAt?: string | null;

  summary?: string | null;
  clinicalNotes?: string | null;

  appointmentId?: number | null;
}

export interface CloseConsultationRequest {
  summary?: string;
  clinicalNotes?: string;
  requireNextAppointment: boolean;
}
