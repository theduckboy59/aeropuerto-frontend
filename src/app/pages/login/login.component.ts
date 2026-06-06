import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { JwtService } from '../../services/jwt.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  show = false;
  loading = false;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private jwtService: JwtService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.show = !this.show;
  }

  login(): void {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Ingresa tu correo y contrasena.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth
      .login({
        email: this.email.trim(),
        password: this.password
      })
      .subscribe({
        next: (res: any) => {
          this.loading = false;

          if (!res.token) {
            this.errorMessage = 'No se recibio token de acceso.';
            return;
          }

          this.auth.saveToken(res.token);

          const role = this.jwtService.getRole(res.token);
          const landingRoute = this.auth.getLandingRouteForRole(role);

          if (landingRoute) {
            this.router.navigate([landingRoute]);
            return;
          }

          this.errorMessage = 'Tu rol no tiene un menu asignado.';
          this.auth.logout();
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Credenciales invalidas.';
        }
      });
  }
}
