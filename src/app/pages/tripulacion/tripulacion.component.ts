import { Component, OnInit } from '@angular/core';
import { CatalogoService } from '../../services/catalogo.service';
import { TripulacionService } from '../../services/tripulacion.service';

@Component({
  selector: 'app-tripulacion',
  templateUrl: './tripulacion.component.html',
  styleUrl: './tripulacion.component.css'
})
export class TripulacionComponent implements OnInit {
  tripulaciones: any[] = [];
  tripulacionesFiltradas: any[] = [];
  aerolineas: any[] = [];
  aerolineaMap: Record<string, string> = {};
  estados = [
    { id: 1, nombre: 'DISPONIBLE' },
    { id: 2, nombre: 'ASIGNADA' },
    { id: 3, nombre: 'INACTIVA' }
  ];

  filtros = {
    aerolineaId: '',
    estadoId: ''
  };

  detalle: any = null;
  cargando = false;
  cargandoDetalle = false;

  constructor(
    private service: TripulacionService,
    private catalogo: CatalogoService
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
        this.catalogo.aerolinea().subscribe(d => {
          this.aerolineas = d || [];
          this.aerolineaMap = this.buildMap(d || []);
        });
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
        this.aplicarFiltroEstado();
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al cargar tripulaciones';
        alert(message);
      }
    });
  }

  aplicarFiltros() {
    this.detalle = null;
    this.cargarTripulaciones();
  }

  limpiarFiltros() {
    this.filtros = {
      aerolineaId: '',
      estadoId: ''
    };
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
        const message = e.error?.message || 'Error al cargar detalle';
        alert(message);
      }
    });
  }

  cambiarEstado(tripulacion: any) {
    if (!tripulacion?.id) return;
    const actual = Number(tripulacion.estadoTripulacionId || 1);
    const siguiente = this.getSiguienteEstado(actual);
    if (!confirm(`Cambiar estado a ${this.getEstadoLabel(siguiente)}?`)) {
      return;
    }

    this.service.actualizarEstado(tripulacion.id, siguiente).subscribe({
      next: () => {
        tripulacion.estadoTripulacionId = siguiente;
        if (this.detalle?.id === tripulacion.id) {
          this.detalle.estadoTripulacionId = siguiente;
        }
        this.aplicarFiltroEstado();
      },
      error: (e) => {
        const message = e.error?.message || 'Error al cambiar estado';
        alert(message);
      }
    });
  }

  getPiloto(tripulacion: any) {
    const empleados = tripulacion?.empleados || [];
    const piloto = empleados.find((e: any) => Number(e?.tipoEmpleadoId) === 1);
    if (!piloto) return '-';
    return this.getEmpleadoLabel(piloto);
  }

  getEstadoLabel(id: number) {
    const estado = this.estados.find(e => Number(e.id) === Number(id));
    return estado?.nombre || '-';
  }

  getTipoEmpleadoLabel(id: number) {
    const map: Record<string, string> = {
      '1': 'Piloto',
      '2': 'Copiloto',
      '3': 'Tripulante Cabina',
      '4': 'Ingeniero Vuelo'
    };
    return map[String(id)] || 'Empleado';
  }

  getEmpleadoLabel(empleado: any) {
    const codigo = empleado?.codigoEmpleado || empleado?.codigo || empleado?.id || '';
    const nombre = empleado?.nombreCompleto || empleado?.nombre || empleado?.username || empleado?.email || 'Empleado';
    return `${codigo} - ${nombre}`.trim();
  }

  private aplicarFiltroEstado() {
    const estadoId = this.filtros.estadoId;
    if (!estadoId) {
      this.tripulacionesFiltradas = [...this.tripulaciones];
      return;
    }

    this.tripulacionesFiltradas = this.tripulaciones.filter(t => String(t?.estadoTripulacionId) === String(estadoId));
  }

  private getSiguienteEstado(actual: number) {
    if (actual === 1) return 2;
    if (actual === 2) return 3;
    return 1;
  }

  private buildMap(items: any[]) {
    return (items || []).reduce((acc: Record<string, string>, item: any) => {
      const label = item?.nombre || item?.descripcion || item?.label || '';
      if (label) {
        acc[String(item.id)] = label;
      }
      return acc;
    }, {});
  }
}
