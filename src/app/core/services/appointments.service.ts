import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import {DoctorSchedule} from '../models/doctor-schedule.model';
import {map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AppointmentDashboardMetrics} from '../models/appointment-dashboard-metrics.model';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {

  constructor(private http: HttpClient) {
  }

  getDoctorAgenda(
    clinicId: number,
    doctorId: number,
    date: string,
    patientId?: number
  ): Observable<Appointment[]> {

    const pid = patientId ?? 0; // 👈 CLAVE

    return this.http.get<Appointment[]>(
      `/api/clinic/${clinicId}/patients/${pid}/appointments/doctor/${doctorId}`,
      {params: {date}}
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
  createAppointmentDirect(
    clinicId: number,
    doctorId: number,
    payload: any
  ): Observable<Appointment> {
    return this.http.post<Appointment>(
      `/api/clinic/${clinicId}/appointments/doctor/${doctorId}`,
      payload
    );
  }

// ✏️ EDITAR CITA EXISTENTE
  updateAppointment(
    clinicId: number,
    patientId: number,
    appointmentId: number,
    payload: {
      durationMinutes: number;
      reason?: string;
      sendEmail?: boolean;
      sendWhatsapp?: boolean;
      reminderMinutesBefore?: number;
    }
  ): Observable<Appointment> {
    return this.http.put<Appointment>(
      `/api/clinic/${clinicId}/patients/${patientId}/appointments/${appointmentId}`,
      payload
    );
  }


  startConsultationFromAppointment(
    clinicId: number,
    appointmentId: number
  ): Observable<{ patientId: number; consultationId: number }> {
    return this.http.post<{ patientId: number; consultationId: number }>(
      `/api/clinic/${clinicId}/appointments/${appointmentId}/start-consultation`,
      {}
    );
  }

  completeDirectAppointment(
    clinicId: number,
    appointmentId: number
  ) {
    return this.http.post(
      `/api/clinic/${clinicId}/appointments/${appointmentId}/complete-direct`,
      {}
    );
  }

  cancelAppointmentFromAgenda(
    clinicId: number,
    appointmentId: number
  ): Observable<Appointment> {
    return this.http.post<Appointment>(
      `/api/clinic/${clinicId}/appointments/${appointmentId}/cancel`,
      {}
    );
  }


  completeClinicalAppointment(
    clinicId: number,
    patientId: number,
    appointmentId: number
  ) {
    return this.http.post(
      `/api/clinic/${clinicId}/patients/${patientId}/appointments/${appointmentId}/complete`,
      {}
    );
  }

  getPatientContact(patientId: number) {
    return this.http.get<{
      email: string | null;
      canSendEmail: boolean;
    }>(`/api/patients/${patientId}/contact`);
  }

  // =========================
// 📊 DASHBOARD ODONTÓLOGO (HOY)
// =========================
  getDoctorDashboardToday() {
    return this.http.get<{
      date: string;

      total: number;
      completed: number;
      scheduled: number;
      noShow: number;
      cancelled: number;

      currentAppointment?: {
        id: number;
        patientName: string;
        startTime: string;
        endTime: string;
      } | null;

      nextAppointment?: {
        id: number;
        patientName: string;
        startTime: string;
        endTime: string;
      } | null;

      alertsToday: {
        id: number;
        type: string;
        severity: string;
        message: string;
      }[];
    }>(`/api/doctor/dashboard/today`);
  }

  getAppointmentMetrics() {
    return this.http.get<{
      scheduled: number;
      completed: number;
      cancelled: number;
      noShow: number;
      completionRate: number;
    }>(`/api/metrics/appointments`);
  }

  // =========================
  // DASHBOARD MÉTRICAS
  // =========================
  getDoctorAppointmentDashboardMetrics(
    period: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM',
    start?: string,
    end?: string
  ): Observable<AppointmentDashboardMetrics> {

    const params: any = { period };

    if (period === 'CUSTOM') {
      if (!start || !end) {
        throw new Error('CUSTOM requiere start y end');
      }
      params.start = start;
      params.end = end;
    }

    return this.http.get<AppointmentDashboardMetrics>(
      '/api/dashboard/doctor/appointments',
      { params }
    );
  }


  // =========================
  // LISTADO FILTRADO (DASHBOARD)
  // =========================
  // 👉 ESTE ES EL MÉTODO QUE FALTABA
  getDoctorAppointments(params: {
    status?: string;
    date?: string;
    period: 'TODAY' | 'WEEK' | 'MONTH';
    page: number;
    size: number;
  }) {
    return this.http.get<{
      content: Appointment[];
      last: boolean;
    }>('/api/doctor/appointments', {
      params: {
        period: params.period,
        page: params.page,
        size: params.size,
        ...(params.status ? { status: params.status } : {}),
        ...(params.date ? { date: params.date } : {})   // 👈 CLAVE
      }
    });
  }

  getDoctorConsultations(params: {
    status?: string;
    date?: string;
    period?: 'TODAY' | 'WEEK' | 'MONTH';
    page: number;
    size: number;
    from?: string;
    to?: string;
  }) {

    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size);

    if (params.period) {
      httpParams = httpParams.set('period', params.period);
    }

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params.date) {
      httpParams = httpParams.set('date', params.date);
    }

    if (params.from) {
      httpParams = httpParams.set('from', params.from);
    }

    if (params.to) {
      httpParams = httpParams.set('to', params.to);
    }

    // 🔍 DEBUG FINAL (déjalo ahora)
    console.log('[SERVICE] consultas params', httpParams.toString());

    return this.http.get<{
      content: any[];
      last: boolean;
    }>('/api/dashboard/doctor/consultations/list', {
      params: httpParams
    });
  }
// =========================
// 📊 DASHBOARD CONSULTAS (DOCTOR)
// =========================
  getDoctorConsultationDashboardMetrics(
    period: 'TODAY' | 'WEEK' | 'MONTH'
  ) {
    return this.http.get<any>(
      '/api/dashboard/doctor/consultations',
      {
        params: { period }
      }
    );
  }


}
