import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AsientoVuelo, AsientoVueloService } from '../../services/asiento-vuelo.service';
import { CatalogoService } from '../../services/catalogo.service';
import { CheckInService } from '../../services/checkin.service';
import {
  ClienteDestinoAutorizado,
  ClienteFechaDisponible,
  ClienteVueloDisponible,
  ClienteVueloSegmentoDisponible,
  ClienteVueloService
} from '../../services/cliente-vuelo.service';
import { DocumentosService } from '../../services/documentos.service';
import { PagoService } from '../../services/pago.service';
import { PasajeroService } from '../../services/pasajero.service';
import {
  ReservaSegmentoAsientoRequest,
  ReservaService
} from '../../services/reserva.service';

@Component({
  selector: 'app-reservar-vuelo',
  templateUrl: './reservar-vuelo.component.html',
  styleUrl: './reservar-vuelo.component.css'
})
export class ReservarVueloComponent implements OnInit {

  cargando = false;
  cargandoAsientos = false;

  error: string | null = null;
  aviso: string | null = null;

  pasajero: any | null = null;

  aeropuertos: any[] = [];
  destinosAutorizados: ClienteDestinoAutorizado[] = [];
  fechasDisponibles: ClienteFechaDisponible[] = [];
  fechasRegresoDisponibles: ClienteFechaDisponible[] = [];

  clases: any[] = [];
  metodosPago: any[] = [];

  filtros = {
    tipoViaje: 'IDA',
    aeropuertoSalidaId: '',
    aeropuertoLlegadaId: '',
    fechaSalida: '',
    fechaRegreso: ''
  };

  vuelosDisponibles: ClienteVueloDisponible[] = [];
  vueloSeleccionado: ClienteVueloDisponible | null = null;

  claseVueloId = '';
  cantidadMaletas = 0;

  asientosPorSegmento: Record<number, AsientoVuelo[]> = {};
  asientoUnicoId = '';
  asientoSeleccionadoPorSegmento: Record<number, string> = {};

  reserva: any | null = null;
  pago: any | null = null;
  checkin: any | null = null;

  pagoForm = {
    metodoPagoId: '',
    nit: 'CF',
    nombreCliente: ''
  };

  constructor(
    private catalogos: CatalogoService,
    private pasajeros: PasajeroService,
    private clienteVuelosService: ClienteVueloService,
    private asientosService: AsientoVueloService,
    private reservasService: ReservaService,
    private pagosService: PagoService,
    private checkinService: CheckInService,
    private documentos: DocumentosService
  ) {}

  ngOnInit(): void {
    this.cargando = true;
    this.error = null;
    this.aviso = null;

    this.pasajeros.obtenerActual().subscribe({
      next: (pasajero) => {
        this.pasajero = pasajero;
        this.pagoForm.nombreCliente = pasajero?.nombreCompleto || '';
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil del pasajero. Inicia sesión de nuevo.';
      }
    });

    this.catalogos.aeropuertos().subscribe({
      next: (r) => {
        this.aeropuertos = r ?? [];
      },
      error: () => {
        this.error = 'No se pudieron cargar aeropuertos.';
      }
    });

    this.catalogos.claseVuelo().subscribe({
      next: (r) => {
        this.clases = r ?? [];
      }
    });

    this.catalogos.metodoPago().subscribe({
      next: (r) => {
        this.metodosPago = r ?? [];
      }
    });

    setTimeout(() => {
      this.cargando = false;
    }, 250);
  }

  get segmentos(): ClienteVueloSegmentoDisponible[] {
    return this.vueloSeleccionado?.segmentos ?? [];
  }

  get esIdaVuelta(): boolean {
    return this.filtros.tipoViaje === 'IDA_VUELTA';
  }

  get esCambioAvion(): boolean {
    if (!this.vueloSeleccionado) {
      return false;
    }

    const tipo = this.normalizarTexto(this.vueloSeleccionado.tipoSegmentoVueloNombre);

    return (
      tipo.includes('CAMBIO_AVION') ||
      tipo.includes('CAMBIO') ||
      this.vueloSeleccionado.requiereNuevoAsiento === true
    );
  }

  get usaAsientoUnico(): boolean {
    return !!this.vueloSeleccionado && !this.esCambioAvion;
  }

  get primerSegmentoId(): number | null {
    const segmento = this.segmentos[0];

    if (!segmento) {
      return null;
    }

    return this.getSegmentoId(segmento);
  }

  get asientosUnicos(): AsientoVuelo[] {
    const segmentoId = this.primerSegmentoId;

    if (!segmentoId) {
      return [];
    }

    return this.asientosPorSegmento[segmentoId] ?? [];
  }

  get puedeCargarAsientos(): boolean {
    return !!this.vueloSeleccionado && !!Number(this.claseVueloId) && this.segmentos.length > 0;
  }

  get puedeReservar(): boolean {
    if (!this.pasajero?.id || !this.pasajero?.userId) {
      return false;
    }

    if (!this.vueloSeleccionado || !Number(this.claseVueloId)) {
      return false;
    }

    if (this.usaAsientoUnico) {
      return !!Number(this.asientoUnicoId);
    }

    return this.segmentos.every((s) => {
      const segmentoId = this.getSegmentoId(s);
      return !!segmentoId && !!Number(this.asientoSeleccionadoPorSegmento[segmentoId]);
    });
  }

  get puedePagar(): boolean {
    return !!this.reserva?.reservaId && !this.pago;
  }

  get puedeHacerCheckin(): boolean {
    return !!this.reserva?.boletoId && !!this.reserva?.vueloOperadoId && !!this.pago && !this.checkin;
  }

  get precioClaseSeleccionada(): number | null {
    if (!this.vueloSeleccionado || !Number(this.claseVueloId)) {
      return null;
    }

    const clase = this.clases.find((c) => Number(c.id) === Number(this.claseVueloId));
    const nombreClase = this.normalizarTexto(clase?.nombre);

    if (nombreClase.includes('EJECUTIVA')) {
      return Number(this.vueloSeleccionado.precioEjecutiva ?? 0);
    }

    return Number(this.vueloSeleccionado.precioEconomica ?? 0);
  }

  onTipoViajeChange(): void {
    this.filtros.fechaRegreso = '';
    this.fechasRegresoDisponibles = [];

    if (this.esIdaVuelta) {
      this.cargarFechasRegresoDisponibles();
    }
  }

  onOrigenChange(): void {
    this.error = null;
    this.aviso = null;

    this.filtros.aeropuertoLlegadaId = '';
    this.filtros.fechaSalida = '';
    this.filtros.fechaRegreso = '';

    this.destinosAutorizados = [];
    this.fechasDisponibles = [];
    this.fechasRegresoDisponibles = [];

    this.resetSeleccionCompleta();

    const salidaId = Number(this.filtros.aeropuertoSalidaId);

    if (!salidaId) {
      return;
    }

    this.cargarDestinosAutorizados();
  }

  onDestinoChange(): void {
    this.error = null;
    this.aviso = null;

    this.filtros.fechaSalida = '';
    this.filtros.fechaRegreso = '';

    this.fechasDisponibles = [];
    this.fechasRegresoDisponibles = [];

    this.resetSeleccionCompleta();

    const salidaId = Number(this.filtros.aeropuertoSalidaId);
    const llegadaId = Number(this.filtros.aeropuertoLlegadaId);

    if (!salidaId || !llegadaId) {
      return;
    }

    if (salidaId === llegadaId) {
      this.error = 'No se puede seleccionar el mismo aeropuerto de salida y llegada.';
      return;
    }

    this.cargarFechasDisponibles();
  }

  onFechaSalidaChange(): void {
    this.error = null;
    this.aviso = null;

    this.filtros.fechaRegreso = '';
    this.fechasRegresoDisponibles = [];

    this.resetSeleccionCompleta();

    if (this.esIdaVuelta) {
      this.cargarFechasRegresoDisponibles();
    }
  }

  cargarDestinosAutorizados(): void {
    const salidaId = Number(this.filtros.aeropuertoSalidaId);

    if (!salidaId) {
      return;
    }

    this.clienteVuelosService.listarDestinosAutorizados(salidaId).subscribe({
      next: (res) => {
        this.destinosAutorizados = res ?? [];

        if (!this.destinosAutorizados.length) {
          this.aviso = 'No hay destinos autorizados para el origen seleccionado.';
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar destinos autorizados.';
      }
    });
  }

  cargarFechasDisponibles(): void {
    const salidaId = Number(this.filtros.aeropuertoSalidaId);
    const llegadaId = Number(this.filtros.aeropuertoLlegadaId);

    if (!salidaId || !llegadaId || salidaId === llegadaId) {
      return;
    }

    this.clienteVuelosService
      .listarFechasDisponibles(
        salidaId,
        llegadaId
      )
      .subscribe({
        next: (res) => {
          this.fechasDisponibles = res ?? [];

          if (!this.fechasDisponibles.length) {
            this.aviso = 'No hay fechas disponibles para esa ruta.';
          }
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar fechas disponibles.';
        }
      });
  }

  cargarFechasRegresoDisponibles(): void {
    const salidaId = Number(this.filtros.aeropuertoSalidaId);
    const llegadaId = Number(this.filtros.aeropuertoLlegadaId);
    const fechaSalida = (this.filtros.fechaSalida || '').trim();

    if (!this.esIdaVuelta || !salidaId || !llegadaId || !fechaSalida) {
      return;
    }

    this.clienteVuelosService
      .listarFechasRegresoDisponibles(
        llegadaId,
        salidaId,
        fechaSalida
      )
      .subscribe({
        next: (res) => {
          this.fechasRegresoDisponibles = res ?? [];

          if (!this.fechasRegresoDisponibles.length) {
            this.aviso = 'No hay fechas de regreso disponibles para esa ruta.';
          }
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar fechas de regreso.';
        }
      });
  }

  buscar(): void {
    this.error = null;
    this.aviso = null;

    this.resetSeleccionCompleta();

    const salidaId = Number(this.filtros.aeropuertoSalidaId);
    const llegadaId = Number(this.filtros.aeropuertoLlegadaId);
    const fecha = (this.filtros.fechaSalida || '').trim();

    if (!salidaId || !llegadaId) {
      this.error = 'Debe seleccionar aeropuerto de salida y destino.';
      return;
    }

    if (salidaId === llegadaId) {
      this.error = 'No se puede seleccionar el mismo aeropuerto de salida y llegada.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService
      .listarDisponibles(
        salidaId,
        llegadaId,
        fecha || null
      )
      .subscribe({
        next: (res) => {
          this.vuelosDisponibles = res ?? [];

          if (!this.vuelosDisponibles.length) {
            this.aviso = 'No se encontraron vuelos según los parámetros ingresados.';
          }

          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar vuelos disponibles.';
          this.cargando = false;
        }
      });
  }

  seleccionarVuelo(vuelo: ClienteVueloDisponible): void {
    this.error = null;
    this.aviso = null;

    this.resetDespuesDeVuelo();

    const vueloOperadoId = Number(vuelo.vueloOperadoId);

    if (!vueloOperadoId) {
      this.error = 'Vuelo inválido.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService.obtenerDetalle(vueloOperadoId).subscribe({
      next: (detalle) => {
        this.vueloSeleccionado = detalle;

        if (!this.segmentos.length) {
          this.aviso = 'El vuelo seleccionado no tiene segmentos disponibles.';
        }

        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar el detalle del vuelo seleccionado.';
        this.cargando = false;
      }
    });
  }

  onClaseChange(): void {
    this.error = null;
    this.aviso = null;

    this.asientosPorSegmento = {};
    this.asientoUnicoId = '';
    this.asientoSeleccionadoPorSegmento = {};
  }

  cargarAsientos(): void {
    this.error = null;
    this.aviso = null;

    this.asientosPorSegmento = {};
    this.asientoUnicoId = '';
    this.asientoSeleccionadoPorSegmento = {};

    if (!this.puedeCargarAsientos) {
      this.error = 'Selecciona un vuelo y una clase para cargar asientos.';
      return;
    }

    const claseId = Number(this.claseVueloId);
    const segmentos = this.segmentos;
    const segmentoIds = segmentos
      .map((s) => this.getSegmentoId(s))
      .filter((id): id is number => !!id);

    if (!segmentoIds.length) {
      this.error = 'El vuelo no tiene segmentos válidos para cargar asientos.';
      return;
    }

    this.cargandoAsientos = true;

    forkJoin(
      segmentoIds.map((segmentoId) =>
        this.asientosService.listarDisponiblesPorSegmento(
          segmentoId,
          claseId
        )
      )
    ).subscribe({
      next: (respuestas) => {
        const map: Record<number, AsientoVuelo[]> = {};

        segmentoIds.forEach((segmentoId, index) => {
          map[segmentoId] = respuestas[index] ?? [];
        });

        this.asientosPorSegmento = map;

        const totalAsientos = Object.values(map)
          .reduce((acc, lista) => acc + lista.length, 0);

        if (!totalAsientos) {
          this.aviso = 'No hay asientos disponibles para la clase seleccionada.';
        }

        if (this.usaAsientoUnico && !this.asientosUnicos.length) {
          this.aviso = 'No hay asientos disponibles para el primer segmento del trayecto.';
        }

        this.cargandoAsientos = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar asientos disponibles.';
        this.cargandoAsientos = false;
      }
    });
  }

  reservar(): void {
    this.error = null;
    this.aviso = null;
    this.reserva = null;
    this.pago = null;
    this.checkin = null;

    if (!this.puedeReservar) {
      this.error = 'Antes de reservar debes seleccionar clase, asiento y maletas.';
      return;
    }

    const segmentosAsientos = this.construirSegmentosAsientos();

    if (!segmentosAsientos.length) {
      return;
    }

    const primerSegmento = segmentosAsientos[0];

    this.cargando = true;

    this.reservasService
      .crear({
        userId: Number(this.pasajero.userId),
        pasajeroId: Number(this.pasajero.id),
        vueloOperadoId: Number(this.vueloSeleccionado?.vueloOperadoId),

        segmentoOperadoId: primerSegmento.segmentoOperadoId,
        asientoVueloId: primerSegmento.asientoVueloId,
        claseVueloId: Number(this.claseVueloId),
        cantidadMaletas: Number(this.cantidadMaletas ?? 0),
        requiereAsiento: true,

        segmentosAsientos,

        pasajeros: [
          {
            pasajeroId: Number(this.pasajero.id),
            claseVueloId: Number(this.claseVueloId),
            cantidadMaletas: Number(this.cantidadMaletas ?? 0),
            requiereAsiento: true,
            asientoVueloId: primerSegmento.asientoVueloId,
            segmentosAsientos
          }
        ]
      })
      .subscribe({
        next: (res) => {
          this.reserva = res;
          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo crear la reserva.';
          this.cargando = false;
        }
      });
  }

  pagar(): void {
    this.error = null;
    this.aviso = null;

    if (!this.reserva?.reservaId) {
      this.error = 'Primero crea la reserva.';
      return;
    }

    const metodoPagoId = Number(this.pagoForm.metodoPagoId);

    if (!metodoPagoId) {
      this.error = 'Selecciona el método de pago.';
      return;
    }

    const monto = Number(this.reserva?.total ?? this.reserva?.subtotal ?? 0);

    if (!monto || monto <= 0) {
      this.error = 'Monto inválido para pago.';
      return;
    }

    this.cargando = true;

    this.pagosService
      .pagar({
        reservaId: Number(this.reserva.reservaId),
        metodoPagoId,
        monto,
        nit: (this.pagoForm.nit || '').trim() || 'CF',
        nombreCliente: (this.pagoForm.nombreCliente || '').trim()
      })
      .subscribe({
        next: (res) => {
          this.pago = res;
          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo registrar el pago.';
          this.cargando = false;
        }
      });
  }

  hacerCheckin(): void {
    this.error = null;
    this.aviso = null;

    if (!this.reserva?.boletoId || !this.reserva?.vueloOperadoId) {
      this.error = 'No hay boleto asociado para check-in.';
      return;
    }

    if (!this.pago) {
      this.error = 'Primero debe registrar el pago.';
      return;
    }

    this.cargando = true;

    this.checkinService
      .realizar({
        boletoId: Number(this.reserva.boletoId),
        vueloOperadoId: Number(this.reserva.vueloOperadoId),
        tipoCheckin: 'WEB'
      })
      .subscribe({
        next: (res) => {
          this.checkin = res;
          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo hacer check-in. Verifica que el pago exista.';
          this.cargando = false;
        }
      });
  }

  setAsientoSegmento(
    segmento: ClienteVueloSegmentoDisponible,
    asientoVueloId: string
  ): void {
    const segmentoId = this.getSegmentoId(segmento);

    if (!segmentoId) {
      return;
    }

    this.asientoSeleccionadoPorSegmento[segmentoId] = asientoVueloId;
  }

  getAsientoSegmento(
    segmento: ClienteVueloSegmentoDisponible
  ): string {
    const segmentoId = this.getSegmentoId(segmento);

    if (!segmentoId) {
      return '';
    }

    return this.asientoSeleccionadoPorSegmento[segmentoId] ?? '';
  }

  getAsientosSegmento(
    segmento: ClienteVueloSegmentoDisponible
  ): AsientoVuelo[] {
    const segmentoId = this.getSegmentoId(segmento);

    if (!segmentoId) {
      return [];
    }

    return this.asientosPorSegmento[segmentoId] ?? [];
  }

  getSegmentoId(
    segmento: ClienteVueloSegmentoDisponible
  ): number {
    return Number(segmento.segmentoOperadoId);
  }

  getCodigoAsiento(
    asiento: AsientoVuelo | null | undefined
  ): string {
    return String(
      asiento?.codigoAsientoSistema ||
      (asiento as any)?.numeroAsiento ||
      asiento?.id ||
      ''
    );
  }

  getTituloSegmento(
    segmento: ClienteVueloSegmentoDisponible
  ): string {
    return `${segmento.ordenSegmento || '-'} | ${segmento.aeropuertoSalidaCodigoIata || '-'} → ${segmento.aeropuertoLlegadaCodigoIata || '-'}`;
  }

  getDuracionTexto(
    minutos: number | null | undefined
  ): string {
    const total = Number(minutos ?? 0);

    if (!total) {
      return '-';
    }

    const h = Math.floor(total / 60);
    const m = total % 60;

    if (h && m) {
      return `${h}h ${m}m`;
    }

    if (h) {
      return `${h}h`;
    }

    return `${m}m`;
  }

  getFechaDisponibleTexto(fecha: ClienteFechaDisponible): string {
    const precio = fecha.precioMinimo != null
      ? ` | desde ${fecha.precioMinimo}`
      : '';

    return `${fecha.fechaSalida} | ${fecha.vuelosDisponibles ?? 0} vuelo(s)${precio}`;
  }

  tipoVueloTexto(
    vuelo: ClienteVueloDisponible | null
  ): string {
    const tipo = vuelo?.tipoSegmentoVueloNombre || 'DIRECTO';

    return String(tipo).replace(/_/g, ' ');
  }

  descargarReservaPdf(): void {
    const id = Number(this.reserva?.reservaId);

    if (!id) {
      return;
    }

    const codigo = this.nombreArchivoSeguro(
      this.reserva?.codigoReserva,
      'reserva'
    );

    this.documentos.reservaPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `reserva_${codigo}.pdf`)
    });
  }

  descargarBoletoPdf(): void {
    const id = Number(this.reserva?.boletoId);

    if (!id) {
      return;
    }

    const codigo = this.nombreArchivoSeguro(
      this.reserva?.codigoBoleto,
      'boleto'
    );

    this.documentos.boletoPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `boleto_${codigo}.pdf`)
    });
  }

  descargarFacturaPdf(): void {
    const id = Number(this.pago?.id);

    if (!id) {
      return;
    }

    const serie = this.nombreArchivoSeguro(
      this.pago?.factura?.serie,
      'FEL'
    );

    const numero = this.nombreArchivoSeguro(
      this.pago?.factura?.numero,
      'sin_numero'
    );

    this.documentos.facturaPorPagoPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `factura_${serie}_${numero}.pdf`)
    });
  }

  private construirSegmentosAsientos(): ReservaSegmentoAsientoRequest[] {
    if (!this.vueloSeleccionado) {
      this.error = 'Selecciona un vuelo.';
      return [];
    }

    if (this.usaAsientoUnico) {
      return this.construirAsientoUnicoParaTrayecto();
    }

    return this.construirAsientosPorSegmento();
  }

  private construirAsientoUnicoParaTrayecto(): ReservaSegmentoAsientoRequest[] {
    const primerSegmentoId = this.primerSegmentoId;
    const asientoId = Number(this.asientoUnicoId);

    if (!primerSegmentoId || !asientoId) {
      this.error = 'Selecciona un asiento.';
      return [];
    }

    const asientoBase = this.asientosUnicos.find((a) => Number(a.id) === asientoId);

    if (!asientoBase) {
      this.error = 'El asiento seleccionado ya no está disponible.';
      return [];
    }

    const codigoBase = this.getCodigoAsiento(asientoBase);

    if (!codigoBase) {
      this.error = 'No se pudo identificar el código del asiento seleccionado.';
      return [];
    }

    const resultado: ReservaSegmentoAsientoRequest[] = [];

    for (const segmento of this.segmentos) {
      const segmentoId = this.getSegmentoId(segmento);

      if (!segmentoId) {
        this.error = 'Hay un segmento inválido en el vuelo.';
        return [];
      }

      const asientosSegmento = this.asientosPorSegmento[segmentoId] ?? [];

      const asientoEquivalente = asientosSegmento.find(
        (a) => this.getCodigoAsiento(a) === codigoBase
      );

      if (!asientoEquivalente) {
        this.error = `El asiento ${codigoBase} no está disponible en el segmento ${segmento.ordenSegmento}.`;
        return [];
      }

      resultado.push({
        segmentoOperadoId: segmentoId,
        asientoVueloId: Number(asientoEquivalente.id)
      });
    }

    return resultado;
  }

  private construirAsientosPorSegmento(): ReservaSegmentoAsientoRequest[] {
    const resultado: ReservaSegmentoAsientoRequest[] = [];

    for (const segmento of this.segmentos) {
      const segmentoId = this.getSegmentoId(segmento);
      const asientoId = Number(this.asientoSeleccionadoPorSegmento[segmentoId]);

      if (!segmentoId || !asientoId) {
        this.error = `Selecciona asiento para el segmento ${segmento.ordenSegmento}.`;
        return [];
      }

      resultado.push({
        segmentoOperadoId: segmentoId,
        asientoVueloId: asientoId
      });
    }

    return resultado;
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  private nombreArchivoSeguro(
    value: any,
    fallback: string
  ): string {
    const text = String(value ?? '').trim();

    if (!text) {
      return fallback;
    }

    return text.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private resetSeleccionCompleta(): void {
    this.vuelosDisponibles = [];
    this.resetDespuesDeVuelo();
  }

  private resetDespuesDeVuelo(): void {
    this.vueloSeleccionado = null;
    this.claseVueloId = '';
    this.cantidadMaletas = 0;
    this.asientosPorSegmento = {};
    this.asientoUnicoId = '';
    this.asientoSeleccionadoPorSegmento = {};
    this.reserva = null;
    this.pago = null;
    this.checkin = null;
  }

  private normalizarTexto(value: any): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }
}