import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {
  SegmentoOperado,
  VueloOperado,
  VueloOperadoService
} from '../../services/vuelo-operado.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-vuelos-operados',
  templateUrl: './vuelos-operados.component.html',
  styleUrl: './vuelos-operados.component.css'
})
export class VuelosOperadosComponent implements OnInit {

  vuelosOperados: VueloOperado[] = [];
  estadosVuelo: any[] = [];

  filtros = {
    estadoVueloId: '',
    fechaSalidaReal: '',
    fechaLlegadaReal: ''
  };

  page = 0;
  size =150
  totalElements = 0;
  totalPages = 0;

  cargando = false;

  constructor(
    private service: VueloOperadoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstados();
    this.cargarOperados(0);
  }

  cargarEstados(): void {
    this.service.listarEstadosVuelo().subscribe({
      next: (data) => this.estadosVuelo = data ?? [],
      error: (err) => {
        console.error(err);
        this.estadosVuelo = [];
      }
    });
  }

  cargarOperados(page: number = 0): void {
    this.page = page;
    this.cargando = true;

    this.service.listar({
      estadoVueloId: this.clean(this.filtros.estadoVueloId),
      fechaSalidaReal: this.clean(this.filtros.fechaSalidaReal),
      fechaLlegadaReal: this.clean(this.filtros.fechaLlegadaReal),
      page,
      size: this.size
    }).subscribe({
      next: (res) => {
        this.vuelosOperados = res?.content ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages = res?.totalPages ?? 0;
        this.page = res?.number ?? page;
        this.size = res?.size ?? this.size;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.vuelosOperados = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando vuelos operados'));
      }
    });
  }

  crear(): void {
    this.router.navigate(['/menu/aerolinea/vuelos-operados/nuevo']);
  }

  editar(vuelo: VueloOperado): void {
    if (!vuelo?.id) return;

    this.router.navigate(['/menu/aerolinea/vuelos-operados/editar', vuelo.id]);
  }

  cancelar(vuelo: VueloOperado): void {
    if (!vuelo?.id) return;

    if (!vuelo.puedeCancelar) {
      alert('Este vuelo no se puede cancelar en su estado actual');
      return;
    }

    if (!confirm('¿Cancelar vuelo operado? Se liberará avión y tripulación.')) {
      return;
    }

    this.service.eliminar(vuelo.id).subscribe({
      next: () => {
        alert('Vuelo operado cancelado correctamente');
        this.cargarOperados(this.page);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error al cancelar vuelo operado'));
      }
    });
  }

  buscar(): void {
    this.cargarOperados(0);
  }

  limpiar(): void {
    this.filtros = {
      estadoVueloId: '',
      fechaSalidaReal: '',
      fechaLlegadaReal: ''
    };

    this.cargarOperados(0);
  }

  paginaAnterior(): void {
    if (this.page <= 0) return;

    this.cargarOperados(this.page - 1);
  }

  paginaSiguiente(): void {
    if (this.page + 1 >= this.totalPages) return;

    this.cargarOperados(this.page + 1);
  }

  getRuta(vuelo: VueloOperado): string {
    const segmentos = this.getSegmentosOrdenados(vuelo);

    if (!segmentos.length) {
      const salida = vuelo.aeropuertoSalidaCodigoIata || vuelo.aeropuertoSalidaNombre || '-';
      const llegada = vuelo.aeropuertoLlegadaCodigoIata || vuelo.aeropuertoLlegadaNombre || '-';
      return `${salida} → ${llegada}`;
    }

    const partes: string[] = [];

    segmentos.forEach((s, index) => {
      const salida = s.aeropuertoSalidaCodigoIata || s.aeropuertoSalidaNombre || String(s.aeropuertoSalidaId || '-');
      const llegada = s.aeropuertoLlegadaCodigoIata || s.aeropuertoLlegadaNombre || String(s.aeropuertoLlegadaId || '-');

      if (index === 0) {
        partes.push(salida);
      }

      partes.push(llegada);
    });

    return partes.join(' → ');
  }

  getProgramado(vuelo: VueloOperado): string {
    const fecha = vuelo.fechaSalidaProgramada || '-';
    const hora = vuelo.horaSalidaProgramada || '-';

    return `${fecha} ${hora}`;
  }

  getTramo(vuelo: VueloOperado): string {
    return `${vuelo.segmentoActualOrden || 1}/${vuelo.cantidadSegmentos || 1}`;
  }

  getSegmentoActual(vuelo: VueloOperado): SegmentoOperado | null {
    const segmentos = this.getSegmentosOrdenados(vuelo);

    if (!segmentos.length) return null;

    const orden = Number(vuelo.segmentoActualOrden || 1);

    return segmentos.find((s) => Number(s.ordenSegmento) === orden) ?? segmentos[0];
  }

  getCodigoAvionActual(vuelo: VueloOperado): string {
    const segmento = this.getSegmentoActual(vuelo);
    return segmento?.codigoAvion || (segmento?.avionId ? String(segmento.avionId) : '-');
  }

  getCodigoTripulacionActual(vuelo: VueloOperado): string {
    const segmento = this.getSegmentoActual(vuelo);
    return segmento?.codigoTripulacion || (segmento?.tripulacionId ? String(segmento.tripulacionId) : '-');
  }

  getSalidaReal(vuelo: VueloOperado): string {
    const segmento = this.getSegmentoActual(vuelo);
    const fecha = segmento?.fechaSalidaReal || '-';
    const hora = segmento?.horaSalidaReal || '';

    return `${fecha} ${hora}`.trim();
  }

  getLlegadaReal(vuelo: VueloOperado): string {
    const segmento = this.getSegmentoActual(vuelo);
    const fecha = segmento?.fechaLlegadaReal || '-';
    const hora = segmento?.horaLlegadaReal || '';

    return `${fecha} ${hora}`.trim();
  }

  getEstadoClass(vuelo: VueloOperado): string {
    const estado = this.normalize(vuelo.estadoVueloNombre);

    if (estado === 'FINALIZADO') return 'pill ok';
    if (estado === 'CANCELADO') return 'pill danger';
    if (estado === 'EN_ESCALA') return 'pill warn';
    if (estado === 'EN_VUELO') return 'pill info';

    return 'pill muted';
  }

  clean(value: any): any {
    const text = String(value ?? '').trim();

    return text ? text : null;
  }

  private getSegmentosOrdenados(vuelo: VueloOperado): SegmentoOperado[] {
    return [...(vuelo.segmentos ?? [])]
      .sort((a, b) => Number(a.ordenSegmento || 0) - Number(b.ordenSegmento || 0));
  }

  private normalize(value: any): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }
}