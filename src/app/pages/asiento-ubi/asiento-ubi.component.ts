import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Avion } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ModeloAvion, ModeloAvionService } from '../../services/modelo-avion.service';
import {
  ConfigClaseFilasAvion,
  ConfigClaseFilasAvionService
} from '../../services/config-clase-filas-avion.service';
import { AsientoUbiService } from '../../services/asiento-ubi.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-asiento-ubi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asiento-ubi.component.html',
  styleUrls: ['./asiento-ubi.component.css']
})
export class AsientoUbiComponent implements OnInit {
  aviones: Avion[] = [];
  modelos: ModeloAvion[] = [];
  clases: any[] = [];
  tiposAsiento: any[] = [];

  selectedAvionId: number | null = null;
  selectedAvion: Avion | null = null;
  selectedModelo: ModeloAvion | null = null;

  configs: ConfigClaseFilasAvion[] = [];
  asientos: any[] = [];

  cargando = false;
  errorMsg: string | null = null;

  totalElements = 0;
  page = 0;
  size = 50;

  filtros: any = {
    avionId: null,
    claseVueloId: '',
    tipoAsientoId: '',
    nivel: '',
    fila: '',
    columna: '',
    numeroAsiento: ''
  };

  constructor(
    private modeloService: ModeloAvionService,
    private catalogo: CatalogoService,
    private configService: ConfigClaseFilasAvionService,
    private asientoService: AsientoUbiService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogosIniciales();
  }

  cargarCatalogosIniciales(): void {
    this.cargando = true;
    this.errorMsg = null;

    const aviones$ = this.catalogo.avion().pipe(
      map((d: any) => ({ ok: true, data: d })),
      catchError((err) => of({ ok: false, err, source: '/catalogos/avion' }))
    );

    const modelos$ = this.modeloService.getModelos({ size: 100 }).pipe(
      map((d: any) => ({ ok: true, data: d })),
      catchError((err) => of({ ok: false, err, source: '/modelo-avion?size=100' }))
    );

    const clases$ = this.catalogo.claseVuelo().pipe(
      map((d: any) => ({ ok: true, data: d })),
      catchError((err) => of({ ok: false, err, source: '/catalogos/clase-vuelo' }))
    );

    const tiposAsiento$ = this.catalogo.tipoAsiento().pipe(
      map((d: any) => ({ ok: true, data: d })),
      catchError((err) => of({ ok: false, err, source: '/catalogos/tipo-asiento' }))
    );

    forkJoin({
      aviones: aviones$,
      modelos: modelos$,
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

        if (res.modelos.ok) {
          this.modelos = res.modelos.data ?? [];
        } else {
          errores.push(this.formatCatalogError(res.modelos.err, res.modelos.source));
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

        this.cargando = false;

        if (errores.length) {
          this.errorMsg = errores.join('\n');
          alert(this.errorMsg);
        }
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        this.errorMsg = getApiErrorMessage(err, 'Error cargando catálogos');
        alert(this.errorMsg);
      }
    });
  }

  onSelectAvion(): void {
    if (!this.selectedAvionId) {
      this.selectedAvion = null;
      this.selectedModelo = null;
      this.configs = [];
      this.asientos = [];
      this.totalElements = 0;
      return;
    }

    const avionId = Number(this.selectedAvionId);

    this.selectedAvion =
      this.aviones.find((a) => Number(a.id) === avionId) ?? null;

    if (this.selectedAvion?.modeloAvionId) {
      this.selectedModelo =
        this.modelos.find((m) => Number(m.id) === Number(this.selectedAvion!.modeloAvionId)) ?? null;
    } else {
      this.selectedModelo = null;
    }

    this.filtros.avionId = avionId;
    this.page = 0;

    this.cargarConfiguracionAvion(avionId);
    this.buscarAsientos(0, this.size);
  }

  cargarConfiguracionAvion(avionId: number): void {
    this.configService.obtenerCompleta(avionId).subscribe({
      next: (res) => {
        this.configs = (res.configuraciones ?? [])
          .filter((c) => c.id !== null)
          .filter((c) => c.claseVueloId !== null);
      },
      error: (err) => {
        console.error(err);
        this.configs = [];
      }
    });
  }

  generarAsientos(regenerar = false): void {
    if (!this.selectedAvion) {
      alert('Seleccione un avión.');
      return;
    }

    if (!this.configs.length) {
      alert('El avión no tiene rangos vendibles configurados.');
      return;
    }

    if (regenerar) {
      if (this.selectedAvion.cantidadVuelos && this.selectedAvion.cantidadVuelos > 0) {
        alert('No se pueden regenerar asientos porque el avión ya tiene vuelos asociados.');
        return;
      }

      if (!confirm('¿Regenerar los asientos? Se eliminará la distribución actual y se volverá a crear.')) {
        return;
      }
    }

    this.asientoService.generar(this.selectedAvion.id, regenerar).subscribe({
      next: (res: any) => {
        alert(res?.mensaje || 'Asientos generados correctamente.');
        this.buscarAsientos(0, this.size);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error generando asientos'));
      }
    });
  }

  limpiarAsientos(): void {
    if (!this.selectedAvion) {
      alert('Seleccione un avión.');
      return;
    }

    if (this.selectedAvion.cantidadVuelos && this.selectedAvion.cantidadVuelos > 0) {
      alert('No se pueden eliminar los asientos porque el avión ya tiene vuelos asociados.');
      return;
    }

    if (!confirm('¿Eliminar los asientos generados para este avión?')) {
      return;
    }

    this.asientoService.limpiarAvion(this.selectedAvion.id).subscribe({
      next: (res: any) => {
        alert(res?.mensaje || 'Asientos eliminados correctamente.');
        this.asientos = [];
        this.totalElements = 0;
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error eliminando asientos'));
      }
    });
  }

  buscarAsientos(page = this.page, size = this.size): void {
    if (!this.filtros.avionId) {
      return;
    }

    this.page = page;
    this.size = size;

    const params: any = {
      ...this.filtros,
      page,
      size
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        delete params[key];
      }
    });

    this.asientoService.listar(params).subscribe({
      next: (res) => {
        this.asientos = res.content ?? [];
        this.totalElements = res.totalElements ?? 0;
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error cargando asientos'));
      }
    });
  }

  limpiarFiltrosAsientos(): void {
    this.filtros = {
      avionId: this.selectedAvionId,
      claseVueloId: '',
      tipoAsientoId: '',
      nivel: '',
      fila: '',
      columna: '',
      numeroAsiento: ''
    };

    this.buscarAsientos(0, this.size);
  }

  obtenerNombreClase(claseVueloId: number | null | undefined): string {
    if (claseVueloId === null || claseVueloId === undefined) {
      return 'Sin clase';
    }

    const clase = this.clases.find((x: any) => Number(x.id) === Number(claseVueloId));

    return clase
      ? clase.nombre || clase.descripcion || clase.label || String(claseVueloId)
      : String(claseVueloId);
  }

  obtenerNombreTipoAsiento(tipoAsientoId: number | null | undefined): string {
    if (tipoAsientoId === null || tipoAsientoId === undefined) {
      return 'Sin tipo';
    }

    const tipo = this.tiposAsiento.find((x: any) => Number(x.id) === Number(tipoAsientoId));

    return tipo
      ? tipo.nombre || tipo.descripcion || tipo.label || String(tipoAsientoId)
      : String(tipoAsientoId);
  }

  obtenerCodigoAvion(avionId: number | null | undefined): string {
    if (avionId === null || avionId === undefined) {
      return '-';
    }

    const avion = this.aviones.find((x) => Number(x.id) === Number(avionId));

    return avion ? avion.codigoAvion : String(avionId);
  }

  getTotalPages(): number {
    if (!this.size || this.size <= 0) {
      return 0;
    }

    return Math.ceil((this.totalElements || 0) / this.size);
  }

  private formatCatalogError(err: any, source: string): string {
    const status = err?.status ?? 'UNKNOWN';
    const statusText = err?.statusText ?? '';
    const serverMessage = err?.error?.message || err?.message || 'Error desconocido';

    return `${source} -> ${status} ${statusText}: ${serverMessage}`;
  }
}