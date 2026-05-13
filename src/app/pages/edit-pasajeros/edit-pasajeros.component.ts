import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PasajeroService } from '../../services/pasajero.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-edit-pasajeros',
  templateUrl: './edit-pasajeros.component.html',
  styleUrl: './edit-pasajeros.component.css'
})
export class EditPasajerosComponent implements OnInit {
  id!: number;
  loading = false;
  errorMessage = '';

  form: any = {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pasajeroService: PasajeroService
  ) {}

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    this.id = Number(paramId);

    if (!this.id || Number.isNaN(this.id)) {
      this.router.navigate(['/menu/dashboard/pasajeros']);
      return;
    }

    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.pasajeroService.obtenerPorId(this.id).subscribe({
      next: (data: any) => {
        this.form = {
          username: data.username ?? '',
          email: data.email ?? '',
          password: '',
          pasaporte: data.pasaporte ?? '',
          nombreCompleto: data.nombreCompleto ?? '',
          fechaNacimiento: data.fechaNacimiento ?? '',
          nacionalidad: data.nacionalidad ?? '',
          codigoArea: data.codigoArea ?? '',
          telefono: data.telefono ?? '',
          telefonoEmergencia: data.telefonoEmergencia ?? '',
          direccion: data.direccion ?? ''
        };
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(error, 'Error al cargar pasajero');
      }
    });
  }

  guardar(): void {
    const requiredFields = [
      'username',
      'email',
      'pasaporte',
      'nombreCompleto',
      'fechaNacimiento',
      'nacionalidad',
      'codigoArea',
      'telefono',
      'telefonoEmergencia',
      'direccion'
    ];

    const hasMissing = requiredFields.some((field: string) => {
      const value = this.form[field];
      return value === null || value === undefined || String(value).trim() === '';
    });

    if (hasMissing) {
      this.errorMessage = 'Debe ingresar los campos obligatorios.';
      return;
    }

    if (String(this.form.pasaporte).length > 15) {
      this.errorMessage = 'Pasaporte debe tener maximo 15 caracteres.';
      return;
    }

    if (!/^[0-9]{8}$/.test(String(this.form.telefono)) || !/^[0-9]{8}$/.test(String(this.form.telefonoEmergencia))) {
      this.errorMessage = 'Telefono y telefono de emergencia deben tener 8 digitos.';
      return;
    }

    if (this.form.password && !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/.test(String(this.form.password))) {
      this.errorMessage = 'El formato de la contrasena debe incluir al menos una mayuscula, un caracter especial y un numero.';
      return;
    }

    const payload = {
      ...this.form,
      password: this.form.password ? this.form.password : ''
    };

    this.loading = true;
    this.errorMessage = '';

    this.pasajeroService.actualizar(this.id, payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/menu/dashboard/pasajeros']);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(error, 'Error al actualizar pasajero');
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/menu/dashboard/pasajeros']);
  }
}
