// src/app/features/clinic/patients/clinical-record.model.ts

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

// --- Wrappers mínimos para que el backend reciba OBJETOS,
//     no strings. El backend ignorará campos desconocidos. ---
export interface ClinicalRecordMedicalHistory {
  summary?: string | null;
}

export interface ClinicalRecordDentalHistory {
  summary?: string | null;
}

export interface ClinicalRecordExtraoralExam {
  summary?: string | null;
}

export interface ClinicalRecordIntraoralExam {
  summary?: string | null;
}

// DTO que usamos tanto para detalle como para upsert.
export interface ClinicalRecordDetail {
  id?: number | null;

  // Datos clave
  chiefComplaint?: string | null;
  currentIllness?: string | null;

  // Antecedentes (en el backend están dentro de MedicalHistoryDto / DentalHistoryDto,
  // aquí manejamos el texto en summary.*)
  medicalHistory?: ClinicalRecordMedicalHistory | null;
  dentalHistory?: ClinicalRecordDentalHistory | null;
  allergies?: string | null;
  medications?: string | null;
  systemicConditions?: string | null;
  pregnancyStatus?: string | null;
  riskBehaviors?: string | null;

  // Examen clínico (parte va en Extraoral/Intraoral en backend)
  extraoralExam?: ClinicalRecordExtraoralExam | null;
  intraoralExam?: ClinicalRecordIntraoralExam | null;
  periodontalStatus?: string | null;
  cariesRisk?: string | null;
  occlusionNotes?: string | null;

  // Diagnóstico y plan
  initialDiagnosticSummary?: string | null;
  initialTreatmentPlanSummary?: string | null;
  initialPrognosis?: string | null;

  // Signos vitales
  vitalSigns?: ClinicalRecordVitalSigns | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}
