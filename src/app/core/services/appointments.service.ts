import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import {DoctorSchedule} from '../models/doctor-schedule.model';
import {map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {

  constructor(private http: HttpClient) {}

  getDoctorAgenda(
    clinicId: number,
    doctorId: number,
    date: string
  ): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `/api/clinic/${clinicId}/patients/0/appointments/doctor/${doctorId}`,
      { params: { date } }
    );
  }

  createAppointment(
    clinicId: number,
    patientId: number,
    doctorId: number,
    payload: any
  ): Observable<Appointment> {
    return this.http.post<Appointment>(
      `/api/clinic/${clinicId}/patients/${patientId}/appointments`,
      payload,
      { params: { doctorId } }
    );
  }

  cancelAppointment(
    clinicId: number,
    patientId: number,
    appointmentId: number
  ): Observable<Appointment> {
    return this.http.post<Appointment>(
      `/api/clinic/${clinicId}/patients/${patientId}/appointments/${appointmentId}/cancel`,
      {}
    );
  }

  markNoShow(
    clinicId: number,
    patientId: number,
    appointmentId: number
  ): Observable<Appointment> {
    return this.http.post<Appointment>(
      `/api/clinic/${clinicId}/patients/${patientId}/appointments/${appointmentId}/no-show`,
      {}
    );
  }

//  Obtener horario del doctor autenticado
  getDoctorSchedule(): Observable<DoctorSchedule[]> {
    return this.http
      .get<any>(`${environment.apiBase}/api/doctor/me/schedule`)
      .pipe(
        map(res => {
          if (!res?.days || !Array.isArray(res.days)) return [];

          return res.days.map((d: any) => ({
            dayOfWeek: d.dayOfWeek,
            startTime: d.startTime,
            endTime: d.endTime,
            hasBreak: d.giveBreak === true,
            breakStart: d.breakStart ?? undefined,
            breakEnd: d.breakEnd ?? undefined,
            active: d.working === true
          } as DoctorSchedule));
        })
      );
  }

}
