// src/app/features/clinic/patients/odontogram/odontogram.model.ts

export interface ToothAttachmentDto {
  id: number;
  attachmentId: number;
  filename: string;
  storageKey: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  notes?: string | null;
  createdAt?: string | null;

  downloadUrl?: string;
  thumbnailUrl?: string;

  toothReference?: string;
}

export interface ToothDto {
  id?: number;
  toothNumber: number;
  toothStatus?: string | null;
  notes?: string | null;
  surfaceStates?: Record<string, string> | null;

  // 🆕 imágenes asociadas al diente
  attachments?: ToothAttachmentDto[] | null;
}

export interface DentalProcedureDto {
  id?: number;

  toothNumber?: number | null;
  surface?: string | null;
  type?: string | null;
  description?: string | null;

  performedBy?: string | null;
  performedAt?: string | null;

  /** Fecha de creación del procedimiento */
  createdAt?: string | null;

  /** Estado clínico */
  status?: 'OPEN' | 'COMPLETED' | null;
  completedAt?: string | null;

  /** 🆕 Consulta clínica donde fue creado (si aplica) */
  createdInConsultationId?: number | null;
}


export interface DentalChartDto {
  id?: number;
  clinicId?: number | null;
  patientId?: number | null;
  clinicalRecordId?: number | null;
  version?: number;
  status?: string | null;
  teeth?: ToothDto[] | null;
  procedures?: DentalProcedureDto[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UpsertToothRequest {
  toothNumber: number;
  toothStatus?: string;
  notes?: string;
  surfaceStates?: Record<string, string>;
}

export interface AddProcedureRequest {
  toothNumber?: number | null;
  surface?: string | null;
  type: string;
  description?: string | null;
}
