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

  login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingrese email y contraseña';
      alert(this.errorMessage);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth
      .login({
        email: this.email,
        password: this.password
      })
      .subscribe({
        next: (res: any) => {
          if (res.token) {
            // Guardar token y rol
            this.auth.saveToken(res.token);
            
            // Obtener datos del usuario desde el token
            const role = this.jwtService.getRole(res.token);
            console.log('Login exitoso. Rol:', role);
            
            // Navegar al menú
            this.router.navigate(['/menu']);
          } else {
            this.errorMessage = 'Error: No se recibió token';
            alert(this.errorMessage);
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.log('ERROR:', err);
          this.errorMessage = 'Credenciales invalidas';
          alert(this.errorMessage);
        }
      });
  }
}
