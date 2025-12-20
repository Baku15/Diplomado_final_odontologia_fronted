import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { ClinicalRecordService } from '../services/clinical-record.service';
@Injectable({ providedIn: 'root' })
export class ClinicalRecordRequiredGuard implements CanActivate {

  private router = inject(Router);
  private clinicalRecordService = inject(ClinicalRecordService);

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const patientId = Number(route.paramMap.get('id'));

    if (!patientId) {
      this.router.navigateByUrl('/dashboard/pacientes');
      return false;
    }

    try {
      // 👇 el service YA resuelve clinicId internamente
      const record = await this.clinicalRecordService.getByPatient(
        patientId
      );

      if (record && record.id) {
        return true;
      }

      // No hay historia clínica → redirigir a crearla
      this.router.navigate([
        '/dashboard/pacientes',
        patientId,
        'historia-clinica'
      ]);
      return false;

    } catch (err) {
      this.router.navigate([
        '/dashboard/pacientes',
        patientId,
        'historia-clinica'
      ]);
      return false;
    }
  }
}
