export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertType =
  | 'CONSULTATION'
  | 'APPOINTMENT'
  | 'ODONTOGRAM'
  | 'PATIENT'
  | 'SYSTEM';

export interface SystemAlert {
  id: number;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  resolved: boolean;
  createdAt: string;

  patientId?: number | null;
  appointmentId?: number | null;
  consultationId?: number | null;
}
