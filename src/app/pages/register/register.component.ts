import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  showPassword: boolean = false;
  loading = false;
  errorMessage = '';

  form: any = this.getEmptyForm();

  constructor(
    private authService: AuthService,
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
    this.form.pasaporte = value.substring(0, 15);
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

    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    const haySeleccion = (input.selectionEnd ?? 0) > (input.selectionStart ?? 0);
    if (haySeleccion) return;

    if ((this.form.pasaporte ?? '').length >= max) {
      event.preventDefault();
    }
  }

  register() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.registerPassenger(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        alert(res.message || 'Se ha creado con exito el usuario.');
        this.form = this.getEmptyForm();
        this.router.navigate(['/login']);
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(e, 'Error inesperado durante el registro');
        console.error('Error:', e);
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
