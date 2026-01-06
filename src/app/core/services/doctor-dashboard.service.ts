import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DoctorDashboardMetrics } from '../models/doctor-dashboard-metrics.model';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import {ToothInterventionDetail} from '../models/tooth-intervention-detail.model';

@Injectable({ providedIn: 'root' })
export class DoctorDashboardService {

  private http = inject(HttpClient);
  private api = environment.apiBase;

  async getMetrics(
    from: string,
    to: string
  ): Promise<DoctorDashboardMetrics>
  {

    return firstValueFrom(
      this.http.get<DoctorDashboardMetrics>(
        `${this.api}/api/dashboard/doctor/metrics`,
        { params: { from, to } }
      )
    );
  }

  async getTeethInterventionDetail(
    from: string,
    to: string
  ): Promise<ToothInterventionDetail[]> {

    return firstValueFrom(
      this.http.get<ToothInterventionDetail[]>(
        `${this.api}/api/dashboard/doctor/odontogram/teeth-detail`,
        { params: { from, to } }
      )
    );
  }
}
