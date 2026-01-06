/* =========================================
   CONSULTATION DASHBOARD METRICS (FRONTEND)
========================================= */

export interface ConsultationTodayMetrics {
  total: number;
  inProgress: number;
  closed: number;

  // ⚠️ Estos ya NO se usan para tiempos reales
  averageDurationMinutes: number;
  longestActiveMinutes: number | null;
  current?: {
    consultationId: number;
    patientId: number;
    patientName: string;
    startedAt: string;
  } | null;
}

export interface ConsultationHistoricalMetrics {
  closedByDate: Record<string, number>;
}

export interface ConsultationRiskMetrics {
  openOver2Hours: number;
  openOver1Day: number;
  averageOpenDurationMinutes: number;
}

/* ===============================
   ⏱️ MÉTRICAS DE TIEMPO REALES
================================ */
export interface ConsultationTimeMetrics {
  averageDurationMinutes: number;
  longestDurationMinutes: number;
  longConsultationsCount: number;
}


/* ===============================
   DASHBOARD ROOT
================================ */
export interface ConsultationDashboardMetrics {
  today: ConsultationTodayMetrics;
  historical: ConsultationHistoricalMetrics;
  risk: ConsultationRiskMetrics;
  time: ConsultationTimeMetrics; // ✅ CLAVE
}

