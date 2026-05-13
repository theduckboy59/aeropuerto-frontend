import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Avion, AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ModeloAvion, ModeloAvionService } from '../../services/modelo-avion.service';
import { ConfigClaseFilasAvionService, ConfigClaseFilasAvion } from '../../services/config-clase-filas-avion.service';
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

  // pagination & filtros
  totalElements = 0;
  page = 0;
  size = 50;
  filtros: any = { avionId: null, claseVueloId: null, tipoAsientoId: null, nivel: null, fila: null, columna: '', numeroAsiento: '', page: 0, size: 50 };
  errorMsg: string | null = null;

  constructor(
    private avionService: AvionService,
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

    forkJoin({ aviones: aviones$, modelos: modelos$, clases: clases$, tiposAsiento: tiposAsiento$ }).subscribe({
      next: (res: any) => {
        const errors: string[] = [];

        if (res.aviones.ok) this.aviones = res.aviones.data ?? [];
        else errors.push(this._formatCatalogError(res.aviones.err, res.aviones.source));

        if (res.modelos.ok) this.modelos = res.modelos.data ?? [];
        else errors.push(this._formatCatalogError(res.modelos.err, res.modelos.source));

        if (res.clases.ok) this.clases = res.clases.data ?? [];
        else errors.push(this._formatCatalogError(res.clases.err, res.clases.source));

        if (res.tiposAsiento.ok) this.tiposAsiento = res.tiposAsiento.data ?? [];
        else errors.push(this._formatCatalogError(res.tiposAsiento.err, res.tiposAsiento.source));

        if (errors.length) {
          this.errorMsg = 'Error cargando catálogos:\n' + errors.join('\n');
          alert(this.errorMsg);
        } else {
          this.errorMsg = null;
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error inesperado en forkJoin:', err);
        this.errorMsg = `Error inesperado cargando catálogos: ${err?.message || JSON.stringify(err)}`;
        this.cargando = false;
        alert(this.errorMsg);
      }
    });
  }

  private _formatCatalogError(err: any, source: string): string {
    try {
      const status = err?.status ?? 'UNKNOWN';
      const statusText = err?.statusText ?? '';
      const url = err?.url ?? source;
      const serverMessage = err?.error?.message || err?.message || JSON.stringify(err?.error || err);
      return `${source} -> ${status} ${statusText}: ${serverMessage} (url: ${url})`;
    } catch (e) {
      return `${source} -> Error desconocido`; 
    }
  }

  onSelectAvion(): void {
    if (!this.selectedAvionId) return;
    this.selectedAvion = this.aviones.find((a) => a.id === Number(this.selectedAvionId)) ?? null;
    if (this.selectedAvion && this.selectedAvion.modeloAvionId) {
      this.selectedModelo = this.modelos.find((m) => m.id === Number(this.selectedAvion!.modeloAvionId)) ?? null;
    } else {
      this.selectedModelo = null;
    }

    // set filtros avion
    this.filtros.avionId = Number(this.selectedAvionId);
    this.page = 0;
    this.filtros.page = 0;

    // cargar configuracion de filas
    this.configService.listar({ avionId: this.selectedAvionId, activo: true, size: 20 }).subscribe({
      next: (res) => {
        this.configs = res.content ?? [];
      },
      error: (err) => {
        console.error(err);
        this.configs = [];
      }
    });

    // cargar asientos existentes
    this.buscarAsientos();
  }

  buscarAsientos(page = this.page, size = this.size): void {
    if (!this.filtros.avionId) return;
    this.filtros.page = page;
    this.filtros.size = size;
    const params: any = { ...this.filtros };

    // remove empty values
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') delete params[k];
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

  validarCoberturaFilas(): string | null {
    if (!this.selectedAvion) return 'Debe seleccionar un avión.';
    const filas = Number(this.selectedAvion.filasConfiguradas || 0);
    if (!filas || filas <= 0) return 'El avión no tiene filas configuradas.';
    // verificar cobertura
    const covered = new Set<number>();
    this.configs.forEach((c) => {
      for (let i = c.filaDesde; i <= c.filaHasta; i++) covered.add(i);
    });
    for (let i = 1; i <= filas; i++) if (!covered.has(i)) return `La fila ${i} no tiene clase configurada.`;
    return null;
  }

  generarAsientos(regenerar = false): void {
    const err = this.validarCoberturaFilas();
    if (err) return alert(err);
    if (!this.selectedAvion) return alert('Seleccione avión');
    if (regenerar) {
      if (this.selectedAvion.cantidadVuelos && this.selectedAvion.cantidadVuelos > 0) {
        return alert('No se pueden regenerar asientos porque el avión ya tiene vuelos asociados.');
      }
      if (!confirm('¿Está seguro de regenerar los asientos? Se eliminará la distribución actual y se volverá a crear.')) return;
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
    if (!this.selectedAvion) return alert('Seleccione avión');
    if (this.selectedAvion.cantidadVuelos && this.selectedAvion.cantidadVuelos > 0) {
      return alert('No se pueden eliminar los asientos porque el avión ya tiene vuelos asociados.');
    }
    if (!confirm('¿Está seguro de eliminar los asientos generados para este avión?')) return;
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

  obtenerNombreClase(claseVueloId: number): string {
    const c = this.clases.find((x: any) => Number(x.id) === Number(claseVueloId));
    return c ? c.nombre : String(claseVueloId);
  }

  obtenerNombreTipoAsiento(tipoAsientoId: number): string {
    const t = this.tiposAsiento.find((x: any) => Number(x.id) === Number(tipoAsientoId));
    return t ? t.nombre : String(tipoAsientoId);
  }

  obtenerCodigoAvion(avionId: number): string {
    const a = this.aviones.find((x) => Number(x.id) === Number(avionId));
    return a ? a.codigoAvion : String(avionId);
  }

  getTotalPages(): number {
    if (!this.size || this.size <= 0) return 0;
    return Math.ceil((this.totalElements || 0) / this.size);
  }
}
