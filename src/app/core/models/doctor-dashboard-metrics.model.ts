export interface DoctorDashboardMetrics {

  // Consultas con actividad clínica real
  totalConsultationsWithActivity: number;

  // Procedimientos
  totalProcedures: number;
  completedProcedures: number;
  pendingProcedures: number;

  // Dientes
  totalTeethIntervened: number;
  teethWithHighClinicalLoad: number;

  // Evidencia clínica
  teethWithImages: number;
}
