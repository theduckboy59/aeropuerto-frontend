import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CatalogoService } from '../../services/catalogo.service';
import { DestinoAutorizado, DestinosAutorizadosService } from '../../services/destinos-autorizados.service';
import { Vuelo, VueloFiltros, VueloService } from '../../services/vuelo.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-vuelos',
  templateUrl: './vuelos.component.html',
  styleUrl: './vuelos.component.css'
})
export class VuelosComponent implements OnInit {

  private readonly ESTADO_ACTIVO_ID = 1;

  vuelos: Vuelo[] = [];
  aerolineas: any[] = [];
  aeropuertos: any[] = [];
  destinosAutorizados: DestinoAutorizado[] = [];

  aeropuertosFiltro: any[] = [];

  aerolineaMap: Record<number, string> = {};
  aeropuertoMap: Record<number, string> = {};

  filtros: any = this.getFiltrosVacios();

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  cargando = false;
  cargandoVuelos = false;

  private searchTimer: any = null;

  constructor(
    private router: Router,
    private catalogo: CatalogoService,
    private destinosService: DestinosAutorizadosService,
    private vueloService: VueloService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargando = true;

    this.catalogo.aerolineas().subscribe({
      next: (aerolineas) => {
        this.aerolineas = aerolineas ?? [];
        this.buildAerolineaMap();

        this.catalogo.aeropuertos().subscribe({
          next: (aeropuertos) => {
            this.aeropuertos = aeropuertos ?? [];
            this.buildAeropuertoMap();

            this.destinosService.listar({
              estadoId: this.ESTADO_ACTIVO_ID
            }).subscribe({
              next: (destinos) => {
                this.destinosAutorizados = destinos ?? [];
                this.actualizarAeropuertosFiltro();
                this.cargando = false;
                this.cargarVuelos(0);
              },
              error: (err) => {
                console.error(err);
                this.destinosAutorizados = [];
                this.actualizarAeropuertosFiltro();
                this.cargando = false;
                this.cargarVuelos(0);
              }
            });
          },
          error: (err) => {
            console.error(err);
            this.cargando = false;
            alert(getApiErrorMessage(err, 'Error cargando aeropuertos'));
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando aerolíneas'));
      }
    });
  }

  cargarVuelos(page: number = 0): void {
    this.page = page;
    this.cargandoVuelos = true;

    const filtros: VueloFiltros = {
      q: this.clean(this.filtros.q),
      buscarSalida: this.clean(this.filtros.buscarSalida),
      buscarLlegada: this.clean(this.filtros.buscarLlegada),
      aerolineaId: this.clean(this.filtros.aerolineaId),
      aeropuertoSalidaId: this.clean(this.filtros.aeropuertoSalidaId),
      aeropuertoLlegadaId: this.clean(this.filtros.aeropuertoLlegadaId),
      fechaSalida: this.clean(this.filtros.fechaSalida),
      horaSalida: this.normalizarHora(this.filtros.horaSalida),
      fechaLlegada: this.clean(this.filtros.fechaLlegada),
      horaLlegada: this.normalizarHora(this.filtros.horaLlegada),
      page,
      size: this.size
    };

    this.vueloService.listar(filtros).subscribe({
      next: (res) => {
        this.vuelos = res?.content ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages = res?.totalPages ?? 0;
        this.page = res?.number ?? page;
        this.size = res?.size ?? this.size;
        this.cargandoVuelos = false;
      },
      error: (err) => {
        console.error(err);
        this.vuelos = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.cargandoVuelos = false;
        alert(getApiErrorMessage(err, 'Error cargando vuelos'));
      }
    });
  }

  onFiltroChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.cargarVuelos(0);
    }, 300);
  }

  onAerolineaFiltroChange(): void {
    this.filtros.aeropuertoSalidaId = '';
    this.filtros.aeropuertoLlegadaId = '';

    this.actualizarAeropuertosFiltro();
    this.cargarVuelos(0);
  }

  buscar(): void {
    this.cargarVuelos(0);
  }

  limpiar(): void {
    this.filtros = this.getFiltrosVacios();
    this.actualizarAeropuertosFiltro();
    this.cargarVuelos(0);
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

    if (!confirm('¿Eliminar vuelo? Se aplicará borrado lógico.')) {
      return;
    }

    this.vueloService.eliminar(vuelo.id).subscribe({
      next: () => {
        alert('Vuelo eliminado correctamente');
        this.cargarVuelos(this.page);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error al eliminar vuelo'));
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
    if (this.page + 1 >= this.totalPages) {
      return;
    }

    this.cargarVuelos(this.page + 1);
  }

  actualizarAeropuertosFiltro(): void {
    const aerolineaId = this.toNumberOrNull(this.filtros.aerolineaId);

    if (!aerolineaId) {
      this.aeropuertosFiltro = [...this.aeropuertos];
      return;
    }

    const idsAutorizados = new Set(
      this.destinosAutorizados
        .filter((d) => Number(d.aerolineaId) === aerolineaId)
        .map((d) => Number(d.aeropuertoId))
    );

    this.aeropuertosFiltro = this.aeropuertos
      .filter((a) => idsAutorizados.has(Number(a.id)));
  }

  getAerolineaLabel(vuelo: Vuelo): string {
    if (vuelo.aerolineaNombre) {
      return vuelo.aerolineaNombre;
    }

    const id = vuelo.aerolineaId;

    if (id === null || id === undefined) {
      return '-';
    }

    return this.aerolineaMap[Number(id)] ?? String(id);
  }

  getAeropuertoSalidaLabel(vuelo: Vuelo): string {
    if (vuelo.aeropuertoSalidaNombre) {
      return this.buildAeropuertoLabel({
        id: vuelo.aeropuertoSalidaId,
        nombre: vuelo.aeropuertoSalidaNombre,
        codigoIata: vuelo.aeropuertoSalidaCodigoIata,
        codigoIcao: vuelo.aeropuertoSalidaCodigoIcao
      });
    }

    const id = vuelo.aeropuertoSalidaId;

    if (id === null || id === undefined) {
      return '-';
    }

    return this.aeropuertoMap[Number(id)] ?? String(id);
  }

  getAeropuertoLlegadaLabel(vuelo: Vuelo): string {
    if (vuelo.aeropuertoLlegadaNombre) {
      return this.buildAeropuertoLabel({
        id: vuelo.aeropuertoLlegadaId,
        nombre: vuelo.aeropuertoLlegadaNombre,
        codigoIata: vuelo.aeropuertoLlegadaCodigoIata,
        codigoIcao: vuelo.aeropuertoLlegadaCodigoIcao
      });
    }

    const id = vuelo.aeropuertoLlegadaId;

    if (id === null || id === undefined) {
      return '-';
    }

    return this.aeropuertoMap[Number(id)] ?? String(id);
  }

  getAeropuertoOptionLabel(aeropuerto: any): string {
    return this.buildAeropuertoLabel(aeropuerto);
  }

  buildAeropuertoLabel(aeropuerto: any): string {
    if (!aeropuerto) {
      return '-';
    }

    const codigoIata = aeropuerto.codigoIata ? ` (${aeropuerto.codigoIata})` : '';
    const codigoIcao = aeropuerto.codigoIcao ? ` / ${aeropuerto.codigoIcao}` : '';

    return `${aeropuerto.nombre ?? aeropuerto.aeropuertoNombre ?? aeropuerto.id}${codigoIata}${codigoIcao}`;
  }

  private buildAerolineaMap(): void {
    this.aerolineaMap = {};

    this.aerolineas.forEach((a) => {
      if (a?.id !== null && a?.id !== undefined) {
        this.aerolineaMap[Number(a.id)] = a.nombre ?? String(a.id);
      }
    });
  }

  private buildAeropuertoMap(): void {
    this.aeropuertoMap = {};

    this.aeropuertos.forEach((a) => {
      if (a?.id !== null && a?.id !== undefined) {
        this.aeropuertoMap[Number(a.id)] = this.buildAeropuertoLabel(a);
      }
    });
  }

  private getFiltrosVacios() {
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

  private clean(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private normalizarHora(value: any): string {
    const hora = this.clean(value);

    if (!hora) {
      return '';
    }

    if (hora.length === 5) {
      return `${hora}:00`;
    }

    return hora;
  }

  private toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const n = Number(value);

    return Number.isNaN(n) ? null : n;
  }
}