import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { ConsultationService } from '../services/consultation.service';
import { PatientService } from '../services/patient.service';

@Injectable({ providedIn: 'root' })
export class ActiveConsultationRequiredGuard implements CanActivate {

  private router = inject(Router);
  private consultationService = inject(ConsultationService);
  private patientService = inject(PatientService);

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const patientId = Number(route.paramMap.get('id'));
    if (!patientId) {
      this.router.navigateByUrl('/dashboard/pacientes');
      return false;
    }

    const clinicId = await this.patientService.getClinicIdForRoutes();
    if (!clinicId) {
      return true; // ⬅️ NO BLOQUEAR
    }

    const consultation =
      await this.consultationService.getActiveOrInProgress(
        clinicId,
        patientId
      );

    // ✅ SI EXISTE → continuar normalmente
    if (consultation) {
      return true;
    }

    // ✅ SI NO EXISTE → TAMBIÉN PERMITIR
    // (la consulta se creará con la primera acción clínica)
    return true;
  }
}
