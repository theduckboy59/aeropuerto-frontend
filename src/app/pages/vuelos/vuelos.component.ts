import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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
  destinosAutorizados: DestinoAutorizado[] = [];
  aeropuertosFiltro: any[] = [];

  aerolineaMap: Record<number, string> = {};
  aeropuertoMap: Record<number, string> = {};

  filtros: any = this.getFiltrosVacios();

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  cargandoCatalogos = false;
  cargandoVuelos = false;

  private searchTimer: any = null;

  constructor(
    private vueloService: VueloService,
    private catalogo: CatalogoService,
    private destinosService: DestinosAutorizadosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogosYVuelos();
  }

  cargarCatalogosYVuelos(): void {
    this.cargandoCatalogos = true;

    forkJoin({
      aerolineas: this.catalogo.aerolineas(),
      destinos: this.destinosService.listar({
        estadoId: this.ESTADO_ACTIVO_ID
      })
    }).subscribe({
      next: ({ aerolineas, destinos }) => {
        this.aerolineas = aerolineas ?? [];
        this.destinosAutorizados = destinos ?? [];

        this.aerolineaMap = Object.fromEntries(
          this.aerolineas.map((a: any) => [
            Number(a.id),
            a.nombre ?? a.descripcion ?? a.label ?? String(a.id)
          ])
        );

        this.aeropuertoMap = this.buildAeropuertoMap(this.destinosAutorizados);
        this.actualizarAeropuertosFiltro();

        this.cargandoCatalogos = false;
        this.cargarVuelos(0);
      },
      error: (err) => {
        console.error(err);
        this.cargandoCatalogos = false;
        alert(getApiErrorMessage(err, 'Error cargando catálogos'));
      }
    });
  }

  cargarVuelos(page = this.page): void {
    this.page = page;
    this.cargandoVuelos = true;

    const filtros: VueloFiltros = {
      q: this.normalizarTextoFiltro(this.filtros.q),
      buscarSalida: this.normalizarTextoFiltro(this.filtros.buscarSalida),
      buscarLlegada: this.normalizarTextoFiltro(this.filtros.buscarLlegada),

      aerolineaId: this.normalizarNumeroFiltro(this.filtros.aerolineaId),

      aeropuertoSalidaId: this.normalizarNumeroFiltro(this.filtros.aeropuertoSalidaId),
      aeropuertoLlegadaId: this.normalizarNumeroFiltro(this.filtros.aeropuertoLlegadaId),

      fechaSalida: this.normalizarTextoFiltro(this.filtros.fechaSalida),
      horaSalida: this.normalizarTextoFiltro(this.filtros.horaSalida),

      fechaLlegada: this.normalizarTextoFiltro(this.filtros.fechaLlegada),
      horaLlegada: this.normalizarTextoFiltro(this.filtros.horaLlegada),

      page: this.page,
      size: this.size
    };

    this.vueloService.listar(filtros).subscribe({
      next: (res) => {
        this.vuelos = res?.content ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages = res?.totalPages ?? 0;
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

  getRangoMostrado(): string {
    if (!this.totalElements) {
      return '0';
    }

    const inicio = this.page * this.size + 1;
    const fin = Math.min((this.page + 1) * this.size, this.totalElements);

    return `${inicio}-${fin}`;
  }

  private actualizarAeropuertosFiltro(): void {
    const aerolineaId = this.normalizarNumeroFiltro(this.filtros.aerolineaId);

    let destinos = this.destinosAutorizados;

    if (aerolineaId !== null) {
      destinos = destinos.filter((d) =>
        Number(d.aerolineaId) === Number(aerolineaId)
      );
    }

    this.aeropuertosFiltro = this.mapDestinosToAeropuertos(destinos);
  }

  private mapDestinosToAeropuertos(destinos: DestinoAutorizado[]): any[] {
    const map = new Map<number, any>();

    (destinos ?? []).forEach((d) => {
      const id = Number(d.aeropuertoId);

      if (!id || map.has(id)) {
        return;
      }

      map.set(id, {
        id,
        nombre: d.aeropuertoNombre ?? `Aeropuerto ${id}`,
        pais: d.pais ?? ''
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      this.getAeropuertoOptionLabel(a).localeCompare(
        this.getAeropuertoOptionLabel(b)
      )
    );
  }

  private buildAeropuertoMap(destinos: DestinoAutorizado[]): Record<number, string> {
    const result: Record<number, string> = {};

    this.mapDestinosToAeropuertos(destinos).forEach((a) => {
      result[Number(a.id)] = this.getAeropuertoOptionLabel(a);
    });

    return result;
  }

  private buildAeropuertoLabel(a: any): string {
    if (!a) {
      return '-';
    }

    const nombre = a.nombre ?? a.aeropuertoNombre ?? a.descripcion ?? a.label ?? '';
    const codigoIata = a.codigoIata ?? a.aeropuertoCodigoIata ?? '';
    const codigoIcao = a.codigoIcao ?? a.aeropuertoCodigoIcao ?? '';
    const pais = a.pais ?? '';

    const codigos = [codigoIata, codigoIcao]
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .join('/');

    const base = nombre || `Aeropuerto ${a.id ?? ''}`;

    if (codigos && pais) {
      return `${base} (${codigos}) - ${pais}`;
    }

    if (codigos) {
      return `${base} (${codigos})`;
    }

    if (pais) {
      return `${base} - ${pais}`;
    }

    return base;
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

  private normalizarTextoFiltro(value: any): string | null {
    const text = String(value ?? '').trim();

    return text ? text : null;
  }

  private normalizarNumeroFiltro(value: any): number | null {
    const text = String(value ?? '').trim();

    if (!text) {
      return null;
    }

    const number = Number(text);

    return Number.isNaN(number) ? null : number;
  }
}