import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private api = `${environment.apiUrl}/auth/register`;

  showPassword: boolean = false;

  form: any = this.getEmptyForm();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getEmptyForm() {
    return {
      username: '',
      email: '',
      password: '',
      dpi: '',
      nombreCompleto: '',
      fechaNacimiento: '',
      nacionalidad: '',
      codigoArea: '',
      telefono: '',
      telefonoEmergencia: '',
      direccion: ''
    };
  }

  register() {
    this.http.post<any>(this.api, this.form).subscribe({
      next: (res) => {

        alert(res.message);
        this.form = this.getEmptyForm();
        this.router.navigate(['/portal']);
      },
      error: (e) => {
        const message = e.error?.message || 'Error inesperado';
        alert(message);
      }
    });
  }

  cancelar() {
    const confirmar = confirm('¿Está seguro de cancelar el registro?');

    if (confirmar) {
      this.router.navigate(['/portal']);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}