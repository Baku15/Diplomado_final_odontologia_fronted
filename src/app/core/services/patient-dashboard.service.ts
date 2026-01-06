// src/app/core/services/patient-dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientDashboardMetrics } from '../models/patient-dashboard-metrics.model';

@Injectable({ providedIn: 'root' })
export class PatientDashboardService {

  constructor(private http: HttpClient) {}

  getMetrics(from: string, to: string): Observable<PatientDashboardMetrics> {
    return this.http.get<PatientDashboardMetrics>(
      '/api/dashboard/doctor/patients',
      { params: { from, to } }
    );
  }

  getPatientsByCategory(
    category: 'NEW' | 'RECURRENT' | 'INACTIVE',
    from: string,
    to: string
  ) {
    return this.http.get<any[]>(
      '/api/dashboard/doctor/patients/list',
      { params: { category, from, to } }
    );
  }
}
