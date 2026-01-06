export interface PatientDashboardMetrics {

  totalPatients: number;
  newPatients: number;
  activePatients: number;
  inactivePatients: number;

  patientsInTreatment: number;
  patientsAtRisk: number;

  patientsByDate: {
    date: string;   // yyyy-MM-dd
    count: number;
  }[];

  topPatients: {
    patientId: number;
    patientName: string;
    consultations: number;
  }[];
}
