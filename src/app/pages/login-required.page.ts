import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-required-page',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h1 class="text-2xl font-bold mb-4 text-gray-800">
          Sesión requerida
        </h1>

        <p class="text-gray-600 mb-6">
          Para acceder a esta sección de la clínica necesitas iniciar sesión.
        </p>

        <button
          (click)="doLogin()"
          class="w-full py-2 px-4 rounded-xl font-semibold
                 bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          Iniciar sesión
        </button>

        <p class="text-xs text-gray-400 mt-4">
          Serás redirigido de vuelta a:
          <span class="font-mono">{{ returnUrl }}</span>
        </p>
      </div>
    </div>
  `,
})
export class LoginRequiredPage implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  returnUrl = '/';

  ngOnInit(): void {
    const r = this.route.snapshot.queryParamMap.get('returnUrl');
    if (r && r.startsWith('/')) {
      this.returnUrl = r;
    }
  }

  doLogin(): void {
    // 👉 Aquí SÍ disparamos el flujo OIDC
    this.auth.startLogin(this.returnUrl);
  }
}
