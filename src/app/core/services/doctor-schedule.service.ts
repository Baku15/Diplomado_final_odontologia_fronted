import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DoctorSchedule } from '../models/doctor-schedule.model';

@Injectable({ providedIn: 'root' })
export class DoctorScheduleService {

  constructor(private http: HttpClient) {}

  getMySchedule(): Observable<DoctorSchedule[]> {
    return this.http.get<DoctorSchedule[]>(
      '/api/doctor/me/schedule'
    );
  }
}
