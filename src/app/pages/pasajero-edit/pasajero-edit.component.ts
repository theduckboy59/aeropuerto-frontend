import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PasajeroService } from '../../services/pasajero.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-pasajero-edit',
  templateUrl: './pasajero-edit.component.html',
  styleUrl: './pasajero-edit.component.css'
})
export class PasajeroEditComponent implements OnInit {
  id!: number;
  loading = false;
  errorMessage = '';

  form: any = {
    pasaporte: '',
    nombreCompleto: '',
    fechaNacimiento: '',
    nacionalidad: '',
    codigoArea: '',
    telefono: '',
    telefonoEmergencia: '',
    direccion: '',
    estadoId: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pasajeroService: PasajeroService
  ) {}

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    this.id = Number(paramId);

    if (!this.id) {
      this.router.navigate(['/menu/dashboard/pasajeros']);
      return;
    }

    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.pasajeroService.obtenerPorId(this.id).subscribe({
      next: (data: any) => {
        this.form = {
          pasaporte: data.pasaporte ?? '',
          nombreCompleto: data.nombreCompleto ?? '',
          fechaNacimiento: data.fechaNacimiento ?? '',
          nacionalidad: data.nacionalidad ?? '',
          codigoArea: data.codigoArea ?? '',
          telefono: data.telefono ?? '',
          telefonoEmergencia: data.telefonoEmergencia ?? '',
          direccion: data.direccion ?? '',
          estadoId: data.estadoId ?? ''
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
    const datos = {
      ...this.form,
      estadoId: this.form.estadoId !== '' ? Number(this.form.estadoId) : this.form.estadoId
    };

    this.loading = true;
    this.pasajeroService.actualizar(this.id, datos).subscribe({
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
