// src/app/features/clinic/doctor-schedule.data-access.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces que reflejan los DTOs del backend
export interface DoctorDayScheduleDto {
  dayOfWeek: number;      // 1 = Lunes ... 7 = Domingo
  working: boolean;       // trabaja o no ese día
  startTime: string | null;
  endTime: string | null;
  giveBreak: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  chairs: number | null;
}

export interface DoctorWeeklyScheduleDto {
  days: DoctorDayScheduleDto[];
}

@Injectable({ providedIn: 'root' })
export class DoctorScheduleDataAccess {
  private readonly baseUrl = '/api/doctor';

  constructor(private http: HttpClient) {}

  getMySchedule(): Observable<DoctorWeeklyScheduleDto> {
    return this.http.get<DoctorWeeklyScheduleDto>(`${this.baseUrl}/me/schedule`);
  }

  saveMySchedule(dto: DoctorWeeklyScheduleDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/me/schedule`, dto);
  }
}
