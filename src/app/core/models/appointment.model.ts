export type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: number;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  durationMinutes: number;
  status: AppointmentStatus;
  reason?: string;

  sendEmail?: boolean;
  sendWhatsapp?: boolean;
  reminderMinutesBefore?: number;

  patientId: number;
  doctorId: number;
  consultationId?: number;
}
