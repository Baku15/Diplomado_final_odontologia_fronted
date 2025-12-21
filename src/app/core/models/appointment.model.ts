export type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentOrigin =
  | 'DIRECT'
  | 'CLINICAL';

export interface Appointment {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: AppointmentStatus;

  // 🔥 OBLIGATORIO
  origin: AppointmentOrigin;

  reason?: string;

  sendEmail?: boolean;
  sendWhatsapp?: boolean;
  reminderMinutesBefore?: number;

  // 🔥 DIRECT puede no tener paciente
  patientId?: number;

  doctorId: number;
  consultationId?: number;
}
