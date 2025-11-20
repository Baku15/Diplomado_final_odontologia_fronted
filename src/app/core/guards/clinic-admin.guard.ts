// src/app/core/guards/clinic-admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CurrentUserService } from '../services/current-user.service';

@Injectable({ providedIn: 'root' })
export class ClinicAdminGuard implements CanActivate {
  constructor(private cu: CurrentUserService, private router: Router) {}
  async canActivate(): Promise<boolean> {
    try {
      const ok = await this.cu.isClinicAdmin();
      if (!ok) await this.router.navigateByUrl('/');
      return ok;
    } catch (e) {
      console.error('ClinicAdminGuard error', e);
      await this.router.navigateByUrl('/');
      return false;
    }
  }
}
