export interface DoctorSchedule {
  dayOfWeek: number; // 1=Lunes ... 7=Domingo
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  hasBreak: boolean;
  breakStart?: string;
  breakEnd?: string;
  active: boolean;
}
