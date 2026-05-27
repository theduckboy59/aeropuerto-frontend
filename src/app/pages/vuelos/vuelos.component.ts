import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CatalogoService } from '../../services/catalogo.service';
import { Vuelo, VueloFiltros, VueloService } from '../../services/vuelo.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-vuelos',
  templateUrl: './vuelos.component.html',
  styleUrl: './vuelos.component.css'
})
export class VuelosComponent implements OnInit {

  vuelos: Vuelo[] = [];
  aerolineas: any[] = [];
  aeropuertos: any[] = [];

  filtros: any = this.getFiltrosDefault();

  cargando = false;
  cargandoCatalogos = false;

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  private filtroTimer: any = null;

  constructor(
    private vueloService: VueloService,
    private catalogo: CatalogoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarVuelos();
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos = true;

    this.catalogo.aerolineas().subscribe({
      next: (aerolineas) => {
        this.aerolineas = aerolineas ?? [];

        this.catalogo.aeropuertos().subscribe({
          next: (aeropuertos) => {
            this.aeropuertos = aeropuertos ?? [];
            this.cargandoCatalogos = false;
          },
          error: (err) => {
            console.error(err);
            this.cargandoCatalogos = false;
            alert(getApiErrorMessage(err, 'Error cargando aeropuertos'));
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.cargandoCatalogos = false;
        alert(getApiErrorMessage(err, 'Error cargando aerolíneas'));
      }
    });
  }

  cargarVuelos(page = 0): void {
    this.page = page;
    this.cargando = true;

    const params: VueloFiltros = {
      ...this.normalizarFiltros(),
      page: this.page,
      size: this.size
    };

    this.vueloService.listar(params).subscribe({
      next: (res) => {
        this.vuelos = res?.content ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages = res?.totalPages ?? 0;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.vuelos = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando vuelos'));
      }
    });
  }

  buscar(): void {
    this.cargarVuelos(0);
  }

  limpiar(): void {
    this.filtros = this.getFiltrosDefault();
    this.cargarVuelos(0);
  }

  onFiltroChange(): void {
    if (this.filtroTimer) {
      clearTimeout(this.filtroTimer);
    }

    this.filtroTimer = setTimeout(() => {
      this.buscar();
    }, 350);
  }

  crear(): void {
    this.router.navigate(['/menu/aerolinea/vuelos/nuevo']);
  }

  editar(vuelo: Vuelo): void {
    if (!vuelo?.id) {
      return;
    }

    this.router.navigate(['/menu/aerolinea/vuelos/editar', vuelo.id]);
  }

  eliminar(vuelo: Vuelo): void {
    if (!vuelo?.id) {
      return;
    }

    if (!confirm(`¿Eliminar el vuelo ${vuelo.codigoVuelo || vuelo.id}?`)) {
      return;
    }

    this.vueloService.eliminar(vuelo.id).subscribe({
      next: () => {
        alert('Vuelo eliminado');
        this.cargarVuelos(this.page);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error eliminando vuelo'));
      }
    });
  }

  paginaAnterior(): void {
    if (this.page <= 0) {
      return;
    }

    this.cargarVuelos(this.page - 1);
  }

  paginaSiguiente(): void {
    if ((this.page + 1) >= this.totalPages) {
      return;
    }

    this.cargarVuelos(this.page + 1);
  }

  cambiarSize(): void {
    const sizeNumber = Number(this.size);

    if (Number.isNaN(sizeNumber) || sizeNumber <= 0) {
      this.size = 10;
    }

    this.cargarVuelos(0);
  }

  getRangoMostrado(): string {
    if (!this.totalElements) {
      return '0';
    }

    const desde = this.page * this.size + 1;
    const hasta = Math.min((this.page + 1) * this.size, this.totalElements);

    return `${desde} - ${hasta}`;
  }

  formatPrecio(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return Number(value).toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private normalizarFiltros(): VueloFiltros {
    return {
      q: this.cleanString(this.filtros.q),
      buscarSalida: this.cleanString(this.filtros.buscarSalida),
      buscarLlegada: this.cleanString(this.filtros.buscarLlegada),
      aerolineaId: this.cleanNumber(this.filtros.aerolineaId),
      aeropuertoSalidaId: this.cleanNumber(this.filtros.aeropuertoSalidaId),
      aeropuertoLlegadaId: this.cleanNumber(this.filtros.aeropuertoLlegadaId),
      fechaSalida: this.cleanString(this.filtros.fechaSalida),
      horaSalida: this.cleanHora(this.filtros.horaSalida),
      fechaLlegada: this.cleanString(this.filtros.fechaLlegada),
      horaLlegada: this.cleanHora(this.filtros.horaLlegada)
    };
  }

  private getFiltrosDefault(): any {
    return {
      q: '',
      buscarSalida: '',
      buscarLlegada: '',
      aerolineaId: '',
      aeropuertoSalidaId: '',
      aeropuertoLlegadaId: '',
      fechaSalida: '',
      horaSalida: '',
      fechaLlegada: '',
      horaLlegada: ''
    };
  }

  private cleanString(value: any): string | null {
    const limpio = (value ?? '').toString().trim();

    return limpio || null;
  }

  private cleanNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const n = Number(value);

    return Number.isNaN(n) ? null : n;
  }

  private cleanHora(value: any): string | null {
    const hora = this.cleanString(value);

    if (!hora) {
      return null;
    }

    if (hora.length === 5) {
      return `${hora}:00`;
    }

    return hora;
  }
}