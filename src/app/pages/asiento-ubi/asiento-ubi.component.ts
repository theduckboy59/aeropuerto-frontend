import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Avion } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import {
  AsientoUbi,
  AsientoUbiFiltros,
  AsientoUbiService
} from '../../services/asiento-ubi.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-asiento-ubi',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './asiento-ubi.component.html',
  styleUrls: ['./asiento-ubi.component.css']
})
export class AsientoUbiComponent implements OnInit {
  aviones: Avion[] = [];
  clases: any[] = [];
  tiposAsiento: any[] = [];

  asientos: AsientoUbi[] = [];

  cargandoCatalogos = false;
  cargandoAsientos = false;

  errorMsg: string | null = null;

  page = 0;

  /*
   * Por defecto 3000 para que pueda mostrar tus 2702 asientos
   * en una sola carga.
   */
  size = 3000;

  totalElements = 0;

  filtros = this.getFiltrosVacios();

  constructor(
    private catalogo: CatalogoService,
    private asientoService: AsientoUbiService
  ) {}

  ngOnInit(): void {
    this.cargarInicial();
  }

  cargarInicial(): void {
    this.cargandoCatalogos = true;
    this.errorMsg = null;

    const aviones$ = this.catalogo.avion().pipe(
      map((data: any) => ({ ok: true, data })),
      catchError((err) => of({ ok: false, err, source: '/catalogos/avion' }))
    );

    const clases$ = this.catalogo.claseVuelo().pipe(
      map((data: any) => ({ ok: true, data })),
      catchError((err) => of({ ok: false, err, source: '/catalogos/clase-vuelo' }))
    );

    const tiposAsiento$ = this.catalogo.tipoAsiento().pipe(
      map((data: any) => ({ ok: true, data })),
      catchError((err) => of({ ok: false, err, source: '/catalogos/tipo-asiento' }))
    );

    forkJoin({
      aviones: aviones$,
      clases: clases$,
      tiposAsiento: tiposAsiento$
    }).subscribe({
      next: (res: any) => {
        const errores: string[] = [];

        if (res.aviones.ok) {
          this.aviones = res.aviones.data ?? [];
        } else {
          errores.push(this.formatCatalogError(res.aviones.err, res.aviones.source));
        }

        if (res.clases.ok) {
          this.clases = res.clases.data ?? [];
        } else {
          errores.push(this.formatCatalogError(res.clases.err, res.clases.source));
        }

        if (res.tiposAsiento.ok) {
          this.tiposAsiento = res.tiposAsiento.data ?? [];
        } else {
          errores.push(this.formatCatalogError(res.tiposAsiento.err, res.tiposAsiento.source));
        }

        this.cargandoCatalogos = false;

        if (errores.length) {
          this.errorMsg = errores.join('\n');
        }

        this.buscarAsientos(0);
      },
      error: (err) => {
        console.error(err);
        this.cargandoCatalogos = false;
        this.errorMsg = getApiErrorMessage(err, 'Error cargando catálogos');
        this.buscarAsientos(0);
      }
    });
  }

  buscarAsientos(page = 0): void {
    this.page = page;
    this.cargandoAsientos = true;
    this.errorMsg = null;

    const params: AsientoUbiFiltros = {
      avionId: this.normalizarNumeroFiltro(this.filtros.avionId),
      claseVueloId: this.normalizarNumeroFiltro(this.filtros.claseVueloId),
      tipoAsientoId: this.normalizarNumeroFiltro(this.filtros.tipoAsientoId),
      vendible: this.normalizarVendibleFiltro(this.filtros.vendible),
      nivel: this.normalizarNumeroFiltro(this.filtros.nivel),
      fila: this.normalizarNumeroFiltro(this.filtros.fila),
      columna: this.normalizarTextoFiltro(this.filtros.columna),
      numeroAsiento: this.normalizarTextoFiltro(this.filtros.numeroAsiento),
      page: this.page,
      size: Number(this.size)
    };

    this.asientoService.listar(params).subscribe({
      next: (res) => {
        this.asientos = res?.content ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.cargandoAsientos = false;
      },
      error: (err) => {
        console.error(err);
        this.asientos = [];
        this.totalElements = 0;
        this.cargandoAsientos = false;
        this.errorMsg = getApiErrorMessage(err, 'Error cargando asientos');
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = this.getFiltrosVacios();
    this.buscarAsientos(0);
  }

  cambiarSize(): void {
    const sizeNumber = Number(this.size);

    if (Number.isNaN(sizeNumber) || sizeNumber <= 0) {
      this.size = 3000;
    }

    this.buscarAsientos(0);
  }

  paginaAnterior(): void {
    if (this.page <= 0) {
      return;
    }

    this.buscarAsientos(this.page - 1);
  }

  paginaSiguiente(): void {
    if ((this.page + 1) >= this.getTotalPages()) {
      return;
    }

    this.buscarAsientos(this.page + 1);
  }

  getTotalPages(): number {
    if (!this.size || this.size <= 0) {
      return 0;
    }

    return Math.ceil((this.totalElements || 0) / this.size);
  }

  getAvionLabel(avionId: number | null | undefined): string {
    if (avionId === null || avionId === undefined) {
      return '-';
    }

    const avion = this.aviones.find((a) => Number(a.id) === Number(avionId));

    if (!avion) {
      return String(avionId);
    }

    return avion.codigoAvion || String(avionId);
  }

  getClaseLabel(asiento: AsientoUbi): string {
    if (asiento.claseVueloNombre) {
      return asiento.claseVueloNombre;
    }

    if (asiento.claseVueloId === null || asiento.claseVueloId === undefined) {
      return 'INHABILITADO';
    }

    const clase = this.clases.find((c: any) => Number(c.id) === Number(asiento.claseVueloId));

    return clase
      ? clase.nombre || clase.descripcion || clase.label || String(asiento.claseVueloId)
      : String(asiento.claseVueloId);
  }

  getTipoAsientoLabel(asiento: AsientoUbi): string {
    if (asiento.tipoAsientoNombre) {
      return asiento.tipoAsientoNombre;
    }

    if (asiento.tipoAsientoId === null || asiento.tipoAsientoId === undefined) {
      return '-';
    }

    const tipo = this.tiposAsiento.find((t: any) => Number(t.id) === Number(asiento.tipoAsientoId));

    return tipo
      ? tipo.nombre || tipo.descripcion || tipo.label || String(asiento.tipoAsientoId)
      : String(asiento.tipoAsientoId);
  }

  getVendibleLabel(asiento: AsientoUbi): string {
    return asiento.vendible ? 'Vendible' : 'Inhabilitado';
  }

  getVendibleClass(asiento: AsientoUbi): string {
    return asiento.vendible ? 'pill ok' : 'pill muted';
  }

  getRangoMostrado(): string {
    if (!this.totalElements) {
      return '0';
    }

    const desde = this.page * this.size + 1;
    const hasta = Math.min((this.page + 1) * this.size, this.totalElements);

    return `${desde} - ${hasta}`;
  }

  private getFiltrosVacios() {
    return {
      avionId: '',
      claseVueloId: '',
      tipoAsientoId: '',
      vendible: '',
      nivel: '',
      fila: '',
      columna: '',
      numeroAsiento: ''
    };
  }

  private normalizarNumeroFiltro(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);

    return Number.isNaN(numberValue) ? null : numberValue;
  }

  private normalizarTextoFiltro(value: any): string | null {
    const texto = String(value ?? '').trim();

    return texto ? texto.toUpperCase() : null;
  }

  private normalizarVendibleFiltro(value: any): boolean | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value === true || value === 'true') {
      return true;
    }

    if (value === false || value === 'false') {
      return false;
    }

    return null;
  }

  private formatCatalogError(err: any, source: string): string {
    const status = err?.status ?? 'UNKNOWN';
    const statusText = err?.statusText ?? '';
    const serverMessage = err?.error?.message || err?.message || 'Error desconocido';

    return `${source} -> ${status} ${statusText}: ${serverMessage}`;
  }
}