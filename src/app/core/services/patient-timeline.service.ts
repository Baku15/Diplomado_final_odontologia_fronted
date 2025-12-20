import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { PatientService } from './patient.service';

@Injectable({ providedIn: 'root' })
export class PatientTimelineService {
  private http = inject(HttpClient);
  private patientService = inject(PatientService);

  async getTimeline(
    patientId: number,
    page = 0,
    size = 5,
    status?: 'ALL' | 'ACTIVE' | 'CLOSED'
  ): Promise<any> {

    const clinicId = await this.patientService.getClinicIdForRoutes();
    if (!clinicId) return null;

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (status && status !== 'ALL') {
      params.append('status', status);
    }

    const url =
      `${this.patientService.apiBaseUrl}` +
      `/api/clinic/${clinicId}/patients/${patientId}/timeline?${params.toString()}`;

    return lastValueFrom(this.http.get<any>(url));
  }
}
