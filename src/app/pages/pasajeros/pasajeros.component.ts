import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PasajeroService } from '../../services/pasajero.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-pasajeros',
  templateUrl: './pasajeros.component.html',
  styleUrl: './pasajeros.component.css'
})
export class PasajerosComponent implements OnInit {
  pasajeros: any[] = [];
  loading = false;
  errorMessage = '';

  filtros: any = {
    nombre: '',
    pasaporte: ''
  };

  constructor(
    private pasajeroService: PasajeroService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.pasajeroService.listar(this.filtros).subscribe({
      next: (data: any[]) => {
        this.pasajeros = data;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(error, 'Error al listar pasajeros');
      }
    });
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros = {
      nombre: '',
      pasaporte: ''
    };
    this.cargar();
  }

  editar(id: number): void {
    this.router.navigate(['/menu/dashboard/pasajeros/editar', id]);
  }

  eliminar(id: number): void {
    if (!confirm('¿Desea inactivar este pasajero?')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.pasajeroService.eliminar(id).subscribe({
      next: () => {
        this.loading = false;
        alert('Pasajero inactivado correctamente.');
        this.cargar();
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(error, 'Error al inactivar pasajero');
      }
    });
  }

  getEstadoLabel(pasajero: any): string {
    if (pasajero.estado) {
      return pasajero.estado;
    }

    const estadoId = pasajero.estadoId;
    if (estadoId === 1 || estadoId === '1') {
      return 'Activo';
    }
    if (estadoId === 2 || estadoId === '2') {
      return 'Inactivo';
    }
    return 'N/A';
  }
}
