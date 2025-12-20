// =============================================
// clinical-record.model.ts (COMPLETO Y CORREGIDO)
// =============================================

// --- Signos vitales (compatibles con VitalSignsDto del backend) ---
export interface ClinicalRecordVitalSigns {
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperatureCelsius?: number | null;
  oxygenSaturation?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
}

// --- Wrappers mínimos para antecedentes médicos ---
//   El backend usa MedicalHistoryDto, pero aquí simplificamos
export interface ClinicalRecordMedicalHistory {
  summary?: string | null;
}

// --- Wrappers mínimos para antecedentes odontológicos ---
export interface ClinicalRecordDentalHistory {
  summary?: string | null;
}

// --- Examen extraoral ---
export interface ClinicalRecordExtraoralExam {
  summary?: string | null;
}

// =============================================
// EXAMEN INTRAORAL REAL
// Debe reflejar EXACTAMENTE lo que existe en el backend.
// =============================================
export interface ClinicalRecordIntraoralExam {
  oralMucosa?: string | null;
  gingivalStatus?: string | null;
  plaqueLevel?: string | null;
  calculusLevel?: string | null;
  tongueFindings?: string | null;
  palateFindings?: string | null;
  floorOfMouthFindings?: string | null;
  occlusionNotes?: string | null;   // ← CAMPO CORRECTO
  otherFindings?: string | null;
}

// =============================================
// ClinicalRecordDetail DTO — usado para cargar y guardar
// =============================================
export interface ClinicalRecordDetail {
  id?: number | null;

  // Datos principales
  chiefComplaint?: string | null;
  currentIllness?: string | null;

  // Antecedentes simples
  medicalHistory?: ClinicalRecordMedicalHistory | null;
  dentalHistory?: ClinicalRecordDentalHistory | null;

  allergies?: string | null;
  medications?: string | null;
  systemicConditions?: string | null;
  pregnancyStatus?: string | null;
  riskBehaviors?: string | null;

  // Examen clínico
  extraoralExam?: ClinicalRecordExtraoralExam | null;
  intraoralExam?: ClinicalRecordIntraoralExam | null;

  // Selects independientes
  periodontalStatus?: string | null;
  cariesRisk?: string | null;

  // Diagnóstico y plan
  initialDiagnosticSummary?: string | null;
  initialTreatmentPlanSummary?: string | null;
  initialPrognosis?: string | null;

  // Signos vitales
  vitalSigns?: ClinicalRecordVitalSigns | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

// =============================================
// Attachment — coincidente con backend
// =============================================
export interface AttachmentDto {
  id: number;
  clinicId?: number | null;
  patientId?: number | null;
  clinicalRecordId?: number | null;
  procedureId?: number | null;
  toothReference?: string | null;
  uploaderId?: number | null;
  filename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  storageKey?: string | null;
  thumbnailKey?: string | null;
  type?: 'PHOTO' | 'RADIOGRAPH' | 'CONSENT' | 'BUDGET' | 'OTHER' | string | null;
  notes?: string | null;
  createdAt?: string | null;

  // URLs firmadas opcionales
  downloadUrl?: string | null;
  thumbnailUrl?: string | null;
}
