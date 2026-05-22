import { Component, OnInit } from '@angular/core';
import { CatalogoService } from '../../services/catalogo.service';
import { TripulacionService } from '../../services/tripulacion.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tripulacion',
  templateUrl: './tripulacion.component.html',
  styleUrl: './tripulacion.component.css'
})
export class TripulacionComponent implements OnInit {
  tripulaciones: any[] = [];
  tripulacionesFiltradas: any[] = [];
  tripulacionesVisibles: any[] = [];

  aerolineas: any[] = [];
  estadosTripulacion: any[] = [];
  tiposEmpleado: any[] = [];

  aerolineaMap: Record<string, string> = {};
  estadoTripulacionMap: Record<string, string> = {};
  tipoEmpleadoMap: Record<string, string> = {};

  filtros = {
    aerolineaId: '',
    estadoId: '',
    q: ''
  };

  paginacion = {
    page: 0,
    size: 10,
    totalItems: 0,
    totalPages: 0
  };

  detalle: any = null;
  cargando = false;
  cargandoDetalle = false;

  constructor(
    private service: TripulacionService,
    private catalogo: CatalogoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCatalogos();
    this.cargarTripulaciones();
  }

  cargarCatalogos() {
    this.catalogo.aerolineas().subscribe({
      next: (data) => {
        this.aerolineas = data || [];
        this.aerolineaMap = this.buildMap(data || []);
      },
      error: () => {
        this.catalogo.aerolinea().subscribe({
          next: (data) => {
            this.aerolineas = data || [];
            this.aerolineaMap = this.buildMap(data || []);
          },
          error: () => {
            this.aerolineas = [];
            this.aerolineaMap = {};
          }
        });
      }
    });

    this.catalogo.estadoTripulacion().subscribe({
      next: (data) => {
        this.estadosTripulacion = data || [];
        this.estadoTripulacionMap = this.buildMap(data || []);
      },
      error: (e) => {
        const message = getApiErrorMessage(e, 'Error al cargar estados de tripulación');
        alert(message);
      }
    });

    this.catalogo.tipoEmpleado().subscribe({
      next: (data) => {
        this.tiposEmpleado = data || [];
        this.tipoEmpleadoMap = this.buildMap(data || []);
      },
      error: (e) => {
        const message = getApiErrorMessage(e, 'Error al cargar tipos de empleado');
        alert(message);
      }
    });
  }

  cargarTripulaciones() {
    this.cargando = true;

    const aerolineaId = this.filtros.aerolineaId;

    const fuente = aerolineaId
      ? this.service.getTripulacionesByAerolinea(Number(aerolineaId))
      : this.service.getTripulaciones();

    fuente.subscribe({
      next: (data) => {
        this.cargando = false;
        this.tripulaciones = data || [];
        this.aplicarFiltrosLocales();
      },
      error: (e) => {
        this.cargando = false;
        const message = getApiErrorMessage(e, 'Error al cargar tripulaciones');
        alert(message);
      }
    });
  }

  aplicarFiltros() {
    this.detalle = null;
    this.paginacion.page = 0;
    this.cargarTripulaciones();
  }

  limpiarFiltros() {
    this.filtros = {
      aerolineaId: '',
      estadoId: '',
      q: ''
    };

    this.paginacion.page = 0;
    this.detalle = null;

    this.cargarTripulaciones();
  }

  verDetalle(tripulacion: any) {
    if (!tripulacion?.id) return;

    this.cargandoDetalle = true;

    this.service.getTripulacion(tripulacion.id).subscribe({
      next: (data) => {
        this.cargandoDetalle = false;
        this.detalle = data;
      },
      error: (e) => {
        this.cargandoDetalle = false;
        const message = getApiErrorMessage(e, 'Error al cargar detalle');
        alert(message);
      }
    });
  }

  getPiloto(tripulacion: any) {
    const empleados = tripulacion?.empleados || [];

    const piloto = empleados.find((empleado: any) => {
      const tipoNombre = this.getTipoEmpleadoLabel(empleado?.tipoEmpleadoId);
      return tipoNombre.toUpperCase() === 'PILOTO';
    });

    if (!piloto) return '-';

    return this.getEmpleadoLabel(piloto);
  }

  getEstadoLabel(id: number) {
    return this.estadoTripulacionMap[String(id)] || '-';
  }

  getTipoEmpleadoLabel(id: number) {
    return this.tipoEmpleadoMap[String(id)] || '-';
  }

  getLicenciaLabel(empleado: any) {
    return empleado?.licenciaNombre ||
      empleado?.licencia?.nombre ||
      empleado?.licencia ||
      '-';
  }

  getFechaVencimientoLicencia(empleado: any) {
    return empleado?.fechaVencimientoLicencia ||
      empleado?.licenciaVencimiento ||
      empleado?.fecha_vencimiento_licencia ||
      '-';
  }

  getEmpleadoLabel(empleado: any) {
    const codigo = empleado?.codigoEmpleado ||
      empleado?.codigo ||
      empleado?.id ||
      '';

    const nombre = empleado?.nombreCompleto ||
      empleado?.nombre ||
      empleado?.username ||
      empleado?.email ||
      'Empleado';

    return `${codigo} - ${nombre}`.trim();
  }

  cambiarPagina(delta: number) {
    const siguiente = this.paginacion.page + delta;

    if (
      siguiente < 0 ||
      (
        this.paginacion.totalPages > 0 &&
        siguiente >= this.paginacion.totalPages
      )
    ) {
      return;
    }

    this.paginacion.page = siguiente;
    this.aplicarFiltrosLocales();
  }

  getEstadoResumen() {
    if (!this.tripulacionesFiltradas.length) {
      return '0 de 0';
    }

    const inicio = this.paginacion.page * this.paginacion.size + 1;

    const fin = Math.min(
      (this.paginacion.page + 1) * this.paginacion.size,
      this.tripulacionesFiltradas.length
    );

    return `${inicio}-${fin} de ${this.tripulacionesFiltradas.length}`;
  }

  private aplicarFiltrosLocales() {
    const q = String(this.filtros.q || '').trim().toLowerCase();
    const estadoId = this.filtros.estadoId;

    this.tripulacionesFiltradas = this.tripulaciones.filter((tripulacion) => {
      const coincideEstado =
        !estadoId ||
        String(tripulacion?.estadoTripulacionId) === String(estadoId);

      if (!coincideEstado) return false;

      if (!q) return true;

      const texto = [
        tripulacion?.codigo,
        this.aerolineaMap[String(tripulacion?.aerolineaId)] ||
          tripulacion?.aerolineaNombre,
        this.getEstadoLabel(tripulacion?.estadoTripulacionId),
        this.getPiloto(tripulacion),
        String(tripulacion?.empleados?.length || 0)
      ].join(' ').toLowerCase();

      return texto.includes(q);
    });

    this.paginacion.totalItems = this.tripulacionesFiltradas.length;

    this.paginacion.totalPages = Math.max(
      1,
      Math.ceil(this.tripulacionesFiltradas.length / this.paginacion.size)
    );

    if (this.paginacion.page >= this.paginacion.totalPages) {
      this.paginacion.page = this.paginacion.totalPages - 1;
    }

    const inicio = this.paginacion.page * this.paginacion.size;
    const fin = inicio + this.paginacion.size;

    this.tripulacionesVisibles = this.tripulacionesFiltradas.slice(inicio, fin);
  }

  private buildMap(items: any[]) {
    return (items || []).reduce((acc: Record<string, string>, item: any) => {
      const label =
        item?.nombre ||
        item?.descripcion ||
        item?.label ||
        item?.name ||
        '';

      if (label && item?.id != null) {
        acc[String(item.id)] = label;
      }

      return acc;
    }, {});
  }

  editar(tripulacion: any) {
    if (!tripulacion?.id) return;

    if (!this.puedeEditar(tripulacion)) {
      alert('Solo se pueden editar tripulaciones DISPONIBLES');
      return;
    }

    this.router.navigate([
      '/menu/aerolinea/tripulacion/editar',
      tripulacion.id
    ]);
  }

  puedeEditar(tripulacion: any) {
    const estado = this.getEstadoLabel(tripulacion?.estadoTripulacionId);
    return this.normalizarTexto(estado) === 'DISPONIBLE';
  }

  private normalizarTexto(value: any) {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/-/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }
}