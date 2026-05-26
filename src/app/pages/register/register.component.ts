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

  showPassword = false;
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

  limitarTelefono() {
    const value = (this.form.telefono ?? '').toString().replace(/\D/g, '');
    this.form.telefono = value.substring(0, 8);
  }

  limitarTelefonoEmergencia() {
    const value = (this.form.telefonoEmergencia ?? '').toString().replace(/\D/g, '');
    this.form.telefonoEmergencia = value.substring(0, 8);
  }

  limitarCodigoArea() {
    let value = (this.form.codigoArea ?? '').toString();

    value = value.replace(/[^\d+]/g, '');

    if (value.includes('+')) {
      value = '+' + value.replace(/\+/g, '');
    }

    this.form.codigoArea = value.substring(0, 10);
  }

  register() {
    this.errorMessage = '';

    const msg = this.validarFormulario();

    if (msg) {
      this.errorMessage = msg;
      alert(msg);
      return;
    }

    const confirmado = confirm('¿Está seguro de continuar?');

    if (!confirmado) {
      this.errorMessage = 'Se ha cancelado el registro satisfactoriamente';
      alert('Se ha cancelado el registro satisfactoriamente');
      return;
    }

    const payload = {
      username: this.form.username.trim(),
      email: this.form.email.trim().toLowerCase(),
      password: this.form.password,
      pasaporte: this.form.pasaporte.trim().toUpperCase(),
      nombreCompleto: this.form.nombreCompleto.trim(),
      fechaNacimiento: this.form.fechaNacimiento,
      nacionalidad: this.form.nacionalidad.trim(),
      codigoArea: this.form.codigoArea.trim(),
      telefono: this.form.telefono.trim(),
      telefonoEmergencia: this.form.telefonoEmergencia.trim(),
      direccion: this.form.direccion.trim()
    };

    this.loading = true;

    this.authService.registerPassenger(payload).subscribe({
      next: (res) => {
        this.loading = false;
        alert(res?.message || 'Se ha creado con éxito el usuario.');
        this.form = this.getEmptyForm();
        this.router.navigate(['/login']);
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(
          e,
          'Error inesperado durante el registro'
        );
        alert(this.errorMessage);
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

  private validarFormulario(): string {
    if (
      !this.form.username?.trim() ||
      !this.form.email?.trim() ||
      !this.form.password?.trim() ||
      !this.form.pasaporte?.trim() ||
      !this.form.nombreCompleto?.trim() ||
      !this.form.fechaNacimiento ||
      !this.form.nacionalidad?.trim() ||
      !this.form.codigoArea?.trim() ||
      !this.form.telefono?.trim() ||
      !this.form.telefonoEmergencia?.trim() ||
      !this.form.direccion?.trim()
    ) {
      return 'Debe ingresar los campos obligatorios';
    }

    if (this.form.pasaporte.trim().length > 15) {
      return 'El número de pasaporte no debe exceder 15 caracteres';
    }

    if (!/^\+?\d{1,10}$/.test(this.form.codigoArea.trim())) {
      return 'El código de área telefónico es inválido';
    }

    if (!/^\d{8}$/.test(this.form.telefono.trim())) {
      return 'El número de teléfono debe tener 8 dígitos';
    }

    if (!/^\d{8}$/.test(this.form.telefonoEmergencia.trim())) {
      return 'El teléfono de emergencia debe tener 8 dígitos';
    }

    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/.test(this.form.password)) {
      return 'El formato de la contraseña debe incluir al menos una letra mayúscula, un carácter especial y un número';
    }

    return '';
  }
}