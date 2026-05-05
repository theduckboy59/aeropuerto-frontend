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
      pasaporte: '',
      nombreCompleto: '',
      fechaNacimiento: '',
      nacionalidad: '',
      codigoArea: '',
      telefono: '',
      telefonoEmergencia: '',
      direccion: ''
    };
  }

  limitarPasaporte() {
    const value = (this.form.pasaporte ?? '').toString();
    const digitsOnly = value.replace(/\D+/g, '');
    this.form.pasaporte = digitsOnly.substring(0, 15);
  }

  bloquearPasaporteSiCompleto(event: KeyboardEvent) {
    const max = 15;

    const tecla = event.key;
    const esControl =
      tecla === 'Backspace' ||
      tecla === 'Delete' ||
      tecla === 'Tab' ||
      tecla === 'Enter' ||
      tecla === 'ArrowLeft' ||
      tecla === 'ArrowRight' ||
      tecla === 'Home' ||
      tecla === 'End';
    if (esControl) return;

    if (!/^\d$/.test(tecla)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    const haySeleccion = (input.selectionEnd ?? 0) > (input.selectionStart ?? 0);
    if (haySeleccion) return;

    if ((this.form.pasaporte ?? '').length >= max) {
      event.preventDefault();
    }
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
