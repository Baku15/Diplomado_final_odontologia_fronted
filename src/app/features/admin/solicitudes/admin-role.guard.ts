import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import {AuthService} from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminRoleGuard implements CanActivate {
  constructor(
    private oidc: OidcSecurityService,
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    // 1) Asegurarnos del estado actual de autenticación (checkAuth procesa el callback si corresponde)
    const authResult = await firstValueFrom(this.oidc.checkAuth());

    if (!authResult.isAuthenticated) {
      // No está autenticado: iniciar login guardando la ruta destino
      this.authService.startLogin('/admin/solicitudes');
      return false;
    }

    // 2) Ya autenticado: obtener userData y comprobar roles
    const userData: any = await firstValueFrom(this.oidc.userData$);
    const roles: string[] = Array.isArray(userData?.roles)
      ? userData.roles
      : (userData?.role ? [userData.role] : []);

    const ok = roles.includes('ROLE_SUPERUSER') || roles.includes('SUPERUSER') || roles.includes('superuser');
    if (!ok) {
      // Autenticado pero no superuser: redirigir a home (o a una página 403 según prefieras)
      this.router.navigateByUrl('/');
      return false;
    }

    return true;
  }
}
