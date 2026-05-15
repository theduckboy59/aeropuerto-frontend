import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CatalogoService } from '../../services/catalogo.service';
import {
  ConfigClaseFilasAvion,
  ConfigClaseFilasAvionCompleta,
  ConfigClaseFilasAvionRequest,
  ConfigClaseFilasAvionService,
  ConfigClaseFilasAvionSugerencia
} from '../../services/config-clase-filas-avion.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

interface RangoForm {
  modo: 'crear' | 'editar';
  avionId: number | null;
  rangoId: number | null;
  claseVueloId: number | null;
  filaDesde: number | null;
  filaHasta: number | null;
}

@Component({
  selector: 'app-config-clase-filas-avion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './config-clase-filas-avion.component.html',
  styleUrl: './config-clase-filas-avion.component.css'
})
export class ConfigClaseFilasAvionComponent implements OnInit {
  clasesVuelo: any[] = [];

  configsTodas: ConfigClaseFilasAvionCompleta[] = [];
  configsFiltradas: ConfigClaseFilasAvionCompleta[] = [];
  configsPagina: ConfigClaseFilasAvionCompleta[] = [];

  filtros = {
    q: '',
    estado: ''
  };

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  claseMap: Record<number, string> = {};

  cargando = false;
  guardando = false;
  errorMsg: string | null = null;

  panelAbierto = false;
  avionEditando: ConfigClaseFilasAvionCompleta | null = null;

  form: RangoForm = this.getEmptyForm();

  sugerencia: ConfigClaseFilasAvionSugerencia | null = null;

  constructor(
    private catalogo: CatalogoService,
    private configService: ConfigClaseFilasAvionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarInicial();
  }

  cargarInicial(): void {
    this.cargando = true;
    this.errorMsg = null;

    forkJoin({
      clases: this.catalogo.claseVuelo(),
      configs: this.configService.listarAvionesActivosCompletos()
    }).subscribe({
      next: ({ clases, configs }) => {
        this.clasesVuelo = clases ?? [];

        this.claseMap = Object.fromEntries(
          this.clasesVuelo.map((c: any) => [
            Number(c.id),
            c.nombre ?? c.descripcion ?? c.label ?? String(c.id)
          ])
        );

        this.configsTodas = configs ?? [];
        this.aplicarFiltros();

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        this.errorMsg = getApiErrorMessage(
          err,
          'No se pudo cargar la configuración de filas.'
        );
      }
    });
  }

  buscar(): void {
    this.cargando = true;
    this.errorMsg = null;
    this.page = 0;

    this.configService
      .listarAvionesActivosCompletos(this.filtros.q)
      .subscribe({
        next: (data) => {
          this.configsTodas = data ?? [];
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
          this.errorMsg = getApiErrorMessage(
            err,
            'No se pudo buscar la configuración de filas.'
          );
        }
      });
  }

  limpiar(): void {
    this.filtros = {
      q: '',
      estado: ''
    };

    this.page = 0;
    this.buscar();
  }

  abrirCrearRango(
    item: ConfigClaseFilasAvionCompleta,
    claseNombre?: string
  ): void {
    this.router.navigate(
      ['/menu/aerolinea/config-clase-filas-avion/nuevo'],
      {
        queryParams: {
          avionId: item.avionId,
          clase: claseNombre ?? null
        }
      }
    );
  }

  abrirEditarRango(
    item: ConfigClaseFilasAvionCompleta,
    rango: ConfigClaseFilasAvion
  ): void {
    if (!rango.id) {
      alert('Este rango no se puede editar directamente.');
      return;
    }

    this.router.navigate([
      '/menu/aerolinea/config-clase-filas-avion/editar',
      rango.id
    ]);
  }

  cerrarPanel(): void {
    this.panelAbierto = false;
    this.avionEditando = null;
    this.sugerencia = null;
    this.form = this.getEmptyForm();
  }

  guardarRango(): void {
    const validacion = this.validarForm();

    if (validacion) {
      alert(validacion);
      return;
    }

    if (!this.form.avionId || !this.form.claseVueloId) {
      alert('Datos incompletos.');
      return;
    }

    const payload: ConfigClaseFilasAvionRequest = {
      claseVueloId: Number(this.form.claseVueloId),
      filaDesde: Number(this.form.filaDesde),
      filaHasta: Number(this.form.filaHasta)
    };

    this.guardando = true;

    const peticion =
      this.form.modo === 'editar' && this.form.rangoId
        ? this.configService.actualizarRango(this.form.rangoId, payload)
        : this.configService.crearRango(this.form.avionId, payload);

    peticion.subscribe({
      next: (actualizada) => {
        this.guardando = false;
        this.actualizarConfiguracionLocal(actualizada);
        this.cerrarPanel();
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        alert(getApiErrorMessage(err, 'No se pudo guardar el rango.'));
      }
    });
  }

  eliminarRango(
    item: ConfigClaseFilasAvionCompleta,
    rango: ConfigClaseFilasAvion
  ): void {
    if (!rango.id) {
      return;
    }

    if (!confirm('¿Eliminar este rango? Las filas quedarán como inhabilitadas si no las cubre otra clase.')) {
      return;
    }

    this.configService.eliminarRango(rango.id).subscribe({
      next: (actualizada) => {
        this.actualizarConfiguracionLocal(actualizada);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'No se pudo eliminar el rango.'));
      }
    });
  }

  reiniciarConfiguracion(item: ConfigClaseFilasAvionCompleta): void {
    if (!confirm(`¿Reiniciar la configuración del avión ${item.codigoAvion}?`)) {
      return;
    }

    this.configService.reiniciarConfiguracionCompleta(item.avionId).subscribe({
      next: (actualizada) => {
        this.actualizarConfiguracionLocal(actualizada);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'No se pudo reiniciar la configuración.'));
      }
    });
  }

  generarSugerencia(): void {
    this.sugerencia = null;

    const validacion = this.validarForm();

    if (validacion) {
      alert(validacion);
      return;
    }

    if (!this.form.avionId || !this.form.claseVueloId) {
      return;
    }

    const claseNombre = this.getNombreClasePorId(this.form.claseVueloId);

    this.configService.sugerirSiguienteRango({
      avionId: this.form.avionId,
      claseBase: claseNombre,
      filaDesde: Number(this.form.filaDesde),
      filaHasta: Number(this.form.filaHasta)
    }).subscribe({
      next: (data) => {
        this.sugerencia = data;
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'No se pudo generar la sugerencia.'));
      }
    });
  }

  aplicarSugerencia(): void {
    if (!this.sugerencia || !this.avionEditando) {
      return;
    }

    if (this.sugerencia.filaDesdeSugerida === null || this.sugerencia.filaHastaSugerida === null) {
      return;
    }

    const clase = this.buscarClaseCatalogoPorNombre(this.sugerencia.claseSugerida);

    if (!clase?.id) {
      alert(`No existe la clase ${this.sugerencia.claseSugerida} en el catálogo.`);
      return;
    }

    this.form = {
      modo: 'crear',
      avionId: this.avionEditando.avionId,
      rangoId: null,
      claseVueloId: Number(clase.id),
      filaDesde: this.sugerencia.filaDesdeSugerida,
      filaHasta: this.sugerencia.filaHastaSugerida
    };

    this.sugerencia = null;
  }

  cambiarPagina(delta: number): void {
    const siguiente = this.page + delta;

    if (siguiente < 0) {
      return;
    }

    if (this.totalPages && siguiente >= this.totalPages) {
      return;
    }

    this.page = siguiente;
    this.paginar();
  }

  aplicarFiltros(): void {
    let data = [...this.configsTodas];

    if (this.filtros.estado === 'configurado') {
      data = data.filter((item) => item.configurado === true);
    }

    if (this.filtros.estado === 'sin_configurar') {
      data = data.filter((item) => item.configurado === false);
    }

    this.configsFiltradas = data;
    this.totalElements = data.length;
    this.totalPages = Math.ceil(this.totalElements / this.size);
    this.paginar();
  }

  paginar(): void {
    const inicio = this.page * this.size;
    const fin = inicio + this.size;

    this.configsPagina = this.configsFiltradas.slice(inicio, fin);
  }

  getRangos(
    item: ConfigClaseFilasAvionCompleta,
    nombreClase: string
  ): ConfigClaseFilasAvion[] {
    const objetivo = this.normalizar(nombreClase);

    return (item.configuraciones ?? [])
      .filter((config) => {
        const nombre =
          config.claseVueloNombre ??
          this.claseMap[Number(config.claseVueloId)] ??
          '';

        return this.normalizar(nombre) === objetivo;
      })
      .filter((config) => config.filaDesde !== null && config.filaHasta !== null);
  }

  getRangoLabel(
    item: ConfigClaseFilasAvionCompleta,
    nombreClase: string
  ): string {
    const rangos = this.getRangos(item, nombreClase);

    if (!rangos.length) {
      return 'Sin rango';
    }

    return rangos
      .map((r) => this.formatearRango(r.filaDesde, r.filaHasta))
      .join(', ');
  }

  getInhabilitadoLabel(item: ConfigClaseFilasAvionCompleta): string {
    if (item.filasInhabilitadasAutomaticas?.length) {
      return item.filasInhabilitadasAutomaticas.join(', ');
    }

    return 'Ninguna';
  }

  getRangosEditables(item: ConfigClaseFilasAvionCompleta): ConfigClaseFilasAvion[] {
    return (item.configuraciones ?? [])
      .filter((config) => config.id !== null)
      .filter((config) => {
        const nombre =
          config.claseVueloNombre ??
          this.claseMap[Number(config.claseVueloId)] ??
          '';

        const normalizado = this.normalizar(nombre);

        return normalizado === 'ECONOMICA' || normalizado === 'EJECUTIVA';
      });
  }

  getNombreClase(config: ConfigClaseFilasAvion): string {
    return (
      config.claseVueloNombre ??
      this.claseMap[Number(config.claseVueloId)] ??
      '-'
    );
  }

  getNombreClasePorId(id: number): string {
    return this.claseMap[Number(id)] ?? String(id);
  }

  getClaseVendibles(): any[] {
    return this.clasesVuelo.filter((clase: any) => {
      const nombre = this.normalizar(
        clase.nombre ?? clase.descripcion ?? clase.label ?? ''
      );

      return nombre === 'ECONOMICA' || nombre === 'EJECUTIVA';
    });
  }

  getFechaActualizacion(item: ConfigClaseFilasAvionCompleta): string {
    const fechas = (item.configuraciones ?? [])
      .map((config) => config.updatedAt || config.createdAt)
      .filter((fecha): fecha is string => !!fecha);

    if (!fechas.length) {
      return '-';
    }

    return fechas.sort().reverse()[0];
  }

  private validarForm(): string | null {
    if (!this.avionEditando) {
      return 'Debe seleccionar un avión.';
    }

    if (!this.form.claseVueloId) {
      return 'Debe seleccionar una clase.';
    }

    if (this.form.filaDesde === null || this.form.filaDesde === undefined) {
      return 'Debe ingresar fila desde.';
    }

    if (this.form.filaHasta === null || this.form.filaHasta === undefined) {
      return 'Debe ingresar fila hasta.';
    }

    const desde = Number(this.form.filaDesde);
    const hasta = Number(this.form.filaHasta);
    const max = Number(this.avionEditando.filasConfiguradas);

    if (Number.isNaN(desde) || desde <= 0) {
      return 'La fila desde debe ser mayor a 0.';
    }

    if (Number.isNaN(hasta) || hasta < desde) {
      return 'La fila hasta no puede ser menor que la fila desde.';
    }

    if (hasta > max) {
      return `La fila hasta no puede superar las ${max} filas configuradas del avión.`;
    }

    return null;
  }

  private actualizarConfiguracionLocal(actualizada: ConfigClaseFilasAvionCompleta): void {
    const index = this.configsTodas.findIndex(
      (item) => Number(item.avionId) === Number(actualizada.avionId)
    );

    if (index >= 0) {
      this.configsTodas[index] = actualizada;
    } else {
      this.configsTodas.push(actualizada);
    }

    this.aplicarFiltros();
  }

  private buscarClaseCatalogoPorNombre(nombreClase: string): any | undefined {
    const objetivo = this.normalizar(nombreClase);

    return this.clasesVuelo.find((clase: any) => {
      const nombre = clase.nombre ?? clase.descripcion ?? clase.label ?? '';

      return this.normalizar(nombre) === objetivo;
    });
  }

  private formatearRango(
    desde: number | null,
    hasta: number | null
  ): string {
    if (desde === null || hasta === null) {
      return 'Sin rango';
    }

    if (desde === hasta) {
      return String(desde);
    }

    return `${desde} - ${hasta}`;
  }

  private getEmptyForm(): RangoForm {
    return {
      modo: 'crear',
      avionId: null,
      rangoId: null,
      claseVueloId: null,
      filaDesde: null,
      filaHasta: null
    };
  }

  private normalizar(valor: string): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }
}