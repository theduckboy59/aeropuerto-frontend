import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import {
  AsientoVuelo,
  AsientoVueloService
} from '../../services/asiento-vuelo.service';

import { CatalogoService } from '../../services/catalogo.service';

import {
  ClienteAeropuertoDisponible,
  ClienteFechaDisponible,
  ClienteUbicacionDisponible,
  ClienteVueloDisponible,
  ClienteVueloSegmentoDisponible,
  ClienteVueloService
} from '../../services/cliente-vuelo.service';

import { CheckInService } from '../../services/checkin.service';
import { DocumentosService } from '../../services/documentos.service';
import { PagoService } from '../../services/pago.service';
import { PasajeroService } from '../../services/pasajero.service';
import { ReservaService } from '../../services/reserva.service';

interface PasajeroReservaForm {
  uid: number;
  esPrincipal: boolean;
  usarPasajeroExistente: boolean;

  pasajeroId: string;

  pasaporte: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  nacionalidad: string;
  codigoArea: string;
  telefono: string;
  telefonoEmergencia: string;
  direccion: string;

  claseVueloId: string;
  cantidadMaletas: number;

  asientoUnicoId: string;
  asientoSeleccionadoPorSegmento: Record<number, string>;
}

interface SegmentoAsientoPayload {
  segmentoOperadoId: number;
  asientoVueloId: number;
}

@Component({
  selector: 'app-reservar-vuelo',
  templateUrl: './reservar-vuelo.component.html',
  styleUrl: './reservar-vuelo.component.css'
})
export class ReservarVueloComponent implements OnInit {
  readonly fechaMinima = this.obtenerFechaMinima();

  cargando = false;
  cargandoAsientos = false;

  error: string | null = null;
  aviso: string | null = null;

  pasajero: any | null = null;

  clases: any[] = [];
  metodosPago: any[] = [];

  busquedaOrigen = '';
  origenes: ClienteUbicacionDisponible[] = [];
  origenSeleccionado: ClienteUbicacionDisponible | null = null;
  aeropuertosSalida: ClienteAeropuertoDisponible[] = [];
  aeropuertoSalidaSeleccionado: ClienteAeropuertoDisponible | null = null;

  busquedaDestino = '';
  destinosUbicaciones: ClienteUbicacionDisponible[] = [];
  destinoUbicacionSeleccionada: ClienteUbicacionDisponible | null = null;
  aeropuertosDestino: ClienteAeropuertoDisponible[] = [];
  aeropuertoDestinoSeleccionado: ClienteAeropuertoDisponible | null = null;

  fechasDisponibles: ClienteFechaDisponible[] = [];
  fechaSalida = '';

  vuelosDisponibles: ClienteVueloDisponible[] = [];
  vueloSeleccionado: ClienteVueloDisponible | null = null;

  pasajerosReserva: PasajeroReservaForm[] = [];
  private uidSeq = 1;

  asientosPorSegmento: Record<number, AsientoVuelo[]> = {};

  reserva: any | null = null;
  pago: any | null = null;
  checkins: any[] = [];

  pagoForm = {
    metodoPagoId: '',
    nit: 'CF',
    nombreCliente: ''
  };

  constructor(
    private clienteVuelosService: ClienteVueloService,
    private asientosService: AsientoVueloService,
    private catalogos: CatalogoService,
    private pasajeros: PasajeroService,
    private reservasService: ReservaService,
    private pagosService: PagoService,
    private checkinService: CheckInService,
    private documentos: DocumentosService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  get segmentos(): ClienteVueloSegmentoDisponible[] {
    return this.vueloSeleccionado?.segmentos ?? [];
  }

  get aeropuertoSalidaId(): number {
    return Number(this.aeropuertoSalidaSeleccionado?.aeropuertoId || 0);
  }

  get aeropuertoDestinoId(): number {
    return Number(this.aeropuertoDestinoSeleccionado?.aeropuertoId || 0);
  }

  get puedeBuscarDestino(): boolean {
    return !!this.aeropuertoSalidaId;
  }

  get puedeBuscarVuelos(): boolean {
    return !!this.aeropuertoSalidaId && !!this.aeropuertoDestinoId;
  }

  get esCambioAvion(): boolean {
    if (!this.vueloSeleccionado) {
      return false;
    }

    const tipo = this.normalizarTexto(this.vueloSeleccionado.tipoSegmentoVueloNombre);

    return tipo.includes('CAMBIO') ||
      this.vueloSeleccionado.requiereNuevoAsiento === true;
  }

  get usaAsientoUnico(): boolean {
    return !!this.vueloSeleccionado && !this.esCambioAvion;
  }

  get primerSegmentoId(): number {
    return Number(this.segmentos[0]?.segmentoOperadoId || 0);
  }

  get cantidadPasajeros(): number {
    return this.pasajerosReserva.length;
  }

  get totalEstimado(): number {
    return this.pasajerosReserva.reduce((acc, p) => {
      return acc + this.getPrecioClasePasajero(p);
    }, 0);
  }

  get boletosReserva(): any[] {
    return this.reserva?.boletos ?? [];
  }

  get puedeCrearReserva(): boolean {
    return this.validarReserva(false);
  }

  get puedePagar(): boolean {
    if (!Number(this.reserva?.reservaId)) {
      return false;
    }

    if (this.esReservaCancelada(this.reserva)) {
      return false;
    }

    return !this.esReservaPagada(this.reserva);
  }

  get puedeHacerCheckin(): boolean {
    return !!Number(this.reserva?.reservaId) &&
      !!Number(this.reserva?.vueloOperadoId) &&
      !!this.pago &&
      !this.checkins.length;
  }

  cargarDatosIniciales(): void {
    this.cargando = true;

    this.pasajeros.obtenerActual().subscribe({
      next: (res) => {
        this.pasajero = res;
        this.pagoForm.nombreCliente = res?.nombreCompleto || '';
        this.inicializarPasajeroPrincipal();
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil del pasajero.';
        this.cargando = false;
      }
    });

    this.catalogos.claseVuelo().subscribe({
      next: (res) => {
        this.clases = res ?? [];
      },
      error: () => {
        this.clases = [];
      }
    });

    this.catalogos.metodoPago().subscribe({
      next: (res) => {
        this.metodosPago = res ?? [];
      },
      error: () => {
        this.metodosPago = [];
      }
    });
  }

  buscarOrigenes(): void {
    this.error = null;
    this.aviso = null;

    this.origenes = [];
    this.origenSeleccionado = null;
    this.aeropuertosSalida = [];
    this.aeropuertoSalidaSeleccionado = null;

    this.limpiarDestinoYVuelo();

    const q = this.busquedaOrigen.trim();

    if (!q) {
      this.error = 'Ingresa país o ciudad de salida.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService.buscarOrigenes(q).subscribe({
      next: (res) => {
        this.origenes = res ?? [];

        if (!this.origenes.length) {
          this.aviso = 'No hay coincidencias de origen con vuelos operados.';
        }

        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron buscar orígenes.';
        this.cargando = false;
      }
    });
  }

  seleccionarOrigen(origen: ClienteUbicacionDisponible): void {
    this.error = null;
    this.aviso = null;

    this.origenSeleccionado = origen;
    this.aeropuertoSalidaSeleccionado = null;
    this.aeropuertosSalida = [];

    this.limpiarDestinoYVuelo();

    this.cargando = true;

    this.clienteVuelosService
      .buscarAeropuertosSalida(origen.pais, origen.ciudad, null)
      .subscribe({
        next: (res) => {
          this.aeropuertosSalida = res ?? [];

          if (!this.aeropuertosSalida.length) {
            this.aviso = 'La ubicación seleccionada no tiene aeropuertos de salida con vuelos.';
          }

          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar aeropuertos de salida.';
          this.cargando = false;
        }
      });
  }

  seleccionarAeropuertoSalida(aeropuerto: ClienteAeropuertoDisponible): void {
    this.error = null;
    this.aviso = null;

    this.aeropuertoSalidaSeleccionado = aeropuerto;

    this.limpiarDestinoYVuelo();

    this.aviso = 'Aeropuerto de salida seleccionado. Ahora busca país o ciudad destino.';
  }

  buscarDestinos(): void {
    this.error = null;
    this.aviso = null;

    this.destinosUbicaciones = [];
    this.destinoUbicacionSeleccionada = null;
    this.aeropuertosDestino = [];
    this.aeropuertoDestinoSeleccionado = null;

    this.limpiarVueloYReserva();

    if (!this.aeropuertoSalidaId) {
      this.error = 'Primero selecciona aeropuerto de salida.';
      return;
    }

    const q = this.busquedaDestino.trim();

    if (!q) {
      this.error = 'Ingresa país o ciudad destino.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService
      .buscarDestinosUbicaciones(this.aeropuertoSalidaId, q)
      .subscribe({
        next: (res) => {
          this.destinosUbicaciones = res ?? [];

          if (!this.destinosUbicaciones.length) {
            this.aviso = 'No hay destinos autorizados con vuelos operados para esa búsqueda.';
          }

          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron buscar destinos.';
          this.cargando = false;
        }
      });
  }

  seleccionarDestinoUbicacion(destino: ClienteUbicacionDisponible): void {
    this.error = null;
    this.aviso = null;

    this.destinoUbicacionSeleccionada = destino;
    this.aeropuertoDestinoSeleccionado = null;
    this.aeropuertosDestino = [];

    this.limpiarVueloYReserva();

    if (!this.aeropuertoSalidaId) {
      this.error = 'Primero selecciona aeropuerto de salida.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService
      .buscarAeropuertosDestino(
        this.aeropuertoSalidaId,
        destino.pais,
        destino.ciudad,
        null
      )
      .subscribe({
        next: (res) => {
          this.aeropuertosDestino = res ?? [];

          if (!this.aeropuertosDestino.length) {
            this.aviso = 'No hay aeropuertos destino con vuelos para esa ciudad.';
          }

          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar aeropuertos destino.';
          this.cargando = false;
        }
      });
  }

  seleccionarAeropuertoDestino(aeropuerto: ClienteAeropuertoDisponible): void {
    this.error = null;
    this.aviso = null;

    if (!this.aeropuertoSalidaId) {
      this.error = 'Primero selecciona aeropuerto de salida.';
      return;
    }

    if (Number(aeropuerto.aeropuertoId) === this.aeropuertoSalidaId) {
      this.error = 'No se puede seleccionar el mismo aeropuerto de salida y llegada.';
      return;
    }

    this.aeropuertoDestinoSeleccionado = aeropuerto;
    this.fechaSalida = '';

    this.limpiarVueloYReserva();
    this.cargarFechasDisponibles();
  }

  cargarFechasDisponibles(): void {
    this.error = null;
    this.aviso = null;

    this.fechasDisponibles = [];

    if (!this.puedeBuscarVuelos) {
      this.error = 'Selecciona aeropuerto de salida y aeropuerto destino.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService
      .listarFechasDisponibles(
        this.aeropuertoSalidaId,
        this.aeropuertoDestinoId
      )
      .subscribe({
        next: (res) => {
          this.fechasDisponibles = res ?? [];

          if (!this.fechasDisponibles.length) {
            this.aviso = 'No hay fechas disponibles para esta ruta.';
          }

          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudieron cargar fechas disponibles.';
          this.cargando = false;
        }
      });
  }

  buscarVuelos(): void {
    this.error = null;
    this.aviso = null;

    this.vuelosDisponibles = [];
    this.limpiarVueloYReserva();

    if (!this.puedeBuscarVuelos) {
      this.error = 'Selecciona aeropuerto de salida y aeropuerto destino.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService
      .listarDisponibles(
        this.aeropuertoSalidaId,
        this.aeropuertoDestinoId,
        this.fechaSalida || null
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

    this.limpiarVueloYReserva();

    const id = Number(vuelo.vueloOperadoId);

    if (!id) {
      this.error = 'Vuelo inválido.';
      return;
    }

    this.cargando = true;

    this.clienteVuelosService.obtenerDetalle(id).subscribe({
      next: (res) => {
        this.vueloSeleccionado = res;

        if (!this.segmentos.length) {
          this.aviso = 'El vuelo seleccionado no tiene segmentos.';
        }

        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar detalle del vuelo.';
        this.cargando = false;
      }
    });
  }

  cargarAsientos(): void {
    this.error = null;
    this.aviso = null;

    this.asientosPorSegmento = {};
    this.limpiarAsientosPasajeros();

    if (!this.vueloSeleccionado || !this.segmentos.length) {
      this.error = 'Selecciona un vuelo.';
      return;
    }

    const segmentoIds = this.segmentos
      .map((s) => Number(s.segmentoOperadoId))
      .filter((id) => !!id);

    if (!segmentoIds.length) {
      this.error = 'El vuelo no tiene segmentos válidos.';
      return;
    }

    this.cargandoAsientos = true;

    forkJoin(
      segmentoIds.map((id) =>
        this.asientosService.listarDisponiblesPorSegmento(id, null)
      )
    ).subscribe({
      next: (respuestas) => {
        const mapa: Record<number, AsientoVuelo[]> = {};

        segmentoIds.forEach((id, index) => {
          mapa[id] = respuestas[index] ?? [];
        });

        this.asientosPorSegmento = mapa;

        const total = Object.values(mapa)
          .reduce((acc, lista) => acc + lista.length, 0);

        if (!total) {
          this.aviso = 'No hay asientos disponibles para este vuelo.';
        }

        this.cargandoAsientos = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar asientos.';
        this.cargandoAsientos = false;
      }
    });
  }

  agregarPasajero(): void {
    this.pasajerosReserva.push(this.crearPasajeroForm(false));
  }

  quitarPasajero(index: number): void {
    const item = this.pasajerosReserva[index];

    if (!item || item.esPrincipal) {
      return;
    }

    this.pasajerosReserva.splice(index, 1);
  }

  cambiarModoPasajero(item: PasajeroReservaForm): void {
    if (item.esPrincipal) {
      return;
    }

    item.pasajeroId = '';
    item.pasaporte = '';
    item.nombreCompleto = '';
    item.fechaNacimiento = '';
    item.nacionalidad = 'Guatemala';
    item.codigoArea = '+502';
    item.telefono = '';
    item.telefonoEmergencia = '';
    item.direccion = '';
  }

  onClaseChange(item: PasajeroReservaForm): void {
    item.asientoUnicoId = '';
    item.asientoSeleccionadoPorSegmento = {};

    this.cargarAsientosDeClase(item);
  }

  cargarAsientosDeClase(item: PasajeroReservaForm): void {
    this.error = null;
    this.aviso = null;

    const claseVueloId = Number(item.claseVueloId);

    if (!this.vueloSeleccionado || !this.segmentos.length) {
      this.error = 'Selecciona un vuelo.';
      return;
    }

    if (!claseVueloId) {
      return;
    }

    const segmentoIds = this.segmentos
      .map((s) => Number(s.segmentoOperadoId))
      .filter((id) => !!id);

    this.cargandoAsientos = true;

    forkJoin(
      segmentoIds.map((segmentoId) =>
        this.asientosService.listarDisponiblesPorSegmento(segmentoId, claseVueloId)
      )
    ).subscribe({
      next: (respuestas) => {
        segmentoIds.forEach((segmentoId, index) => {
          this.asientosPorSegmento[segmentoId] = respuestas[index] ?? [];
        });

        this.cargandoAsientos = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar asientos de la clase seleccionada.';
        this.cargandoAsientos = false;
      }
    });
  }

  onMaletasChange(item: PasajeroReservaForm): void {
    const cantidad = Number(item.cantidadMaletas ?? 0);

    if (Number.isNaN(cantidad) || cantidad < 0) {
      item.cantidadMaletas = 0;
    }
  }

  setAsientoSegmento(
    item: PasajeroReservaForm,
    segmento: ClienteVueloSegmentoDisponible,
    value: any
  ): void {
    const segmentoId = Number(segmento.segmentoOperadoId);

    if (!segmentoId) {
      return;
    }

    item.asientoSeleccionadoPorSegmento[segmentoId] = String(value || '');
  }

  getAsientoSegmento(
    item: PasajeroReservaForm,
    segmento: ClienteVueloSegmentoDisponible
  ): string {
    const segmentoId = Number(segmento.segmentoOperadoId);

    if (!segmentoId) {
      return '';
    }

    return item.asientoSeleccionadoPorSegmento[segmentoId] || '';
  }

  getAsientosSegmento(
    item: PasajeroReservaForm,
    segmento: ClienteVueloSegmentoDisponible
  ): AsientoVuelo[] {
    const segmentoId = Number(segmento.segmentoOperadoId);

    if (!segmentoId || !Number(item.claseVueloId)) {
      return [];
    }

    const actual = Number(this.getAsientoSegmento(item, segmento));

    return (this.asientosPorSegmento[segmentoId] ?? [])
      .filter((a) => !this.asientoUsadoEnSegmento(segmentoId, Number(a.id), item.uid) || Number(a.id) === actual);
  }

  getAsientosUnicos(item: PasajeroReservaForm): AsientoVuelo[] {
    const segmentoId = this.primerSegmentoId;

    if (!segmentoId || !Number(item.claseVueloId)) {
      return [];
    }

    const actual = Number(item.asientoUnicoId);

    return (this.asientosPorSegmento[segmentoId] ?? [])
      .filter((a) => this.asientoExisteEnTodosLosSegmentos(a))
      .filter((a) => !this.asientoUnicoUsado(a, item.uid) || Number(a.id) === actual);
  }

  crearReserva(): void {
    this.error = null;
    this.aviso = null;
    this.reserva = null;
    this.pago = null;
    this.checkins = [];

    if (!this.validarReserva(true)) {
      return;
    }

    const payload = this.construirPayloadReserva();

    if (!payload) {
      return;
    }

    this.cargando = true;

    this.reservasService.crear(payload).subscribe({
      next: (res) => {
        this.reserva = res;
        this.cargando = false;

        this.aviso =
          this.esReservaPagada(res)
            ? 'Reserva creada y pagada.'
            : 'Reserva creada. El pago quedo pendiente; puedes pagarlo ahora o despues desde Mis reservas.';
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || '';

        if (String(msg).toLowerCase().includes('ya tiene un vuelo')) {
          this.error = msg;
        } else {
          this.error = msg || 'No se pudo crear la reserva.';
        }

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
      this.error = 'Selecciona método de pago.';
      return;
    }

    const monto = Number(this.reserva?.total ?? 0);

    if (!monto || monto <= 0) {
      this.error = 'Monto inválido.';
      return;
    }

    this.cargando = true;

    const pagoPendienteId = Number(this.reserva?.pagoId || 0);

    const request = {
      metodoPagoId,
      nit: this.pagoForm.nit?.trim() || 'CF',
      nombreCliente:
        this.pagoForm.nombreCliente?.trim() ||
        this.pasajero?.nombreCompleto ||
        'Consumidor Final'
    };

    const observable = pagoPendienteId
      ? this.pagosService.confirmarPagoPendiente(pagoPendienteId, request)
      : this.pagosService.pagar({
          reservaId: Number(this.reserva.reservaId),
          metodoPagoId,
          monto,
          nit: request.nit,
          nombreCliente: request.nombreCliente,
          tipoPago: 'NORMAL'
        });

    observable.subscribe({
      next: (res) => {
        this.pago = res;
        this.aviso = 'Pago confirmado correctamente. Ya puedes descargar la factura.';
        this.refrescarReservaActual();
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

    if (!this.reserva?.vueloOperadoId || !this.pago) {
      this.error = 'Primero debe existir reserva pagada.';
      return;
    }

    const boletos = this.obtenerBoletosParaCheckin();

    if (!boletos.length) {
      this.error = 'No hay boletos para check-in.';
      return;
    }

    this.cargando = true;

    forkJoin(
      boletos.map((b) =>
        this.checkinService.realizar({
          boletoId: Number(b.boletoId),
          vueloOperadoId: Number(this.reserva?.vueloOperadoId),
          tipoCheckin: 'WEB'
        })
      )
    ).subscribe({
      next: (res) => {
        this.checkins = res ?? [];
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo hacer check-in.';
        this.cargando = false;
      }
    });
  }

  descargarReservaPdf(): void {
    const id = Number(this.reserva?.reservaId);

    if (!id) {
      return;
    }

    this.documentos.reservaPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `reserva_${this.safeName(this.reserva?.codigoReserva)}.pdf`)
    });
  }

  descargarBoletoPdf(boleto: any): void {
    const id = Number(boleto?.boletoId);

    if (!id) {
      return;
    }

    this.documentos.boletoPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `boleto_${this.safeName(boleto?.codigoBoleto)}.pdf`)
    });
  }

  descargarFacturaPdf(): void {
    const id = Number(this.pago?.id || this.reserva?.pagoId);

    if (!id) {
      this.error = 'No hay factura disponible para descargar.';
      return;
    }

    this.documentos.facturaPorPagoPdf(id).subscribe({
      next: (blob) => this.saveBlob(
        blob,
        `factura_${this.safeName(this.reserva?.codigoReserva || id)}.pdf`
      ),
      error: () => {
        this.error = 'No se pudo descargar la factura.';
      }
    });
  }

  getFechaTexto(f: ClienteFechaDisponible): string {
    return `${f.fechaSalida || '-'} | ${f.vuelosDisponibles || 0} vuelo(s)`;
  }

  getUbicacionTexto(u: ClienteUbicacionDisponible | null): string {
    if (!u) {
      return '-';
    }

    return `${u.ciudad || '-'}, ${u.pais || '-'}`;
  }

  getAeropuertoTexto(a: ClienteAeropuertoDisponible | null): string {
    if (!a) {
      return '-';
    }

    return `${a.codigoIata || '-'} - ${a.nombre || '-'} | ${a.ciudad || '-'}, ${a.pais || '-'}`;
  }

  getRutaVuelo(v: ClienteVueloDisponible | null): string {
    if (!v) {
      return '-';
    }

    const salidaCiudad = v.aeropuertoSalidaCiudad || v.aeropuertoSalidaNombre || '-';
    const salidaPais = v.aeropuertoSalidaPais || '-';

    const llegadaCiudad = v.aeropuertoLlegadaCiudad || v.aeropuertoLlegadaNombre || '-';
    const llegadaPais = v.aeropuertoLlegadaPais || '-';

    return `${salidaCiudad}, ${salidaPais} → ${llegadaCiudad}, ${llegadaPais}`;
  }

  getTipoVuelo(v: ClienteVueloDisponible | null): string {
    return String(v?.tipoSegmentoVueloNombre || 'DIRECTO').replace(/_/g, ' ');
  }

  getSegmentoTexto(s: ClienteVueloSegmentoDisponible): string {
    const salidaCiudad = s.aeropuertoSalidaCiudad || s.aeropuertoSalidaNombre || '-';
    const salidaPais = s.aeropuertoSalidaPais || '-';

    const llegadaCiudad = s.aeropuertoLlegadaCiudad || s.aeropuertoLlegadaNombre || '-';
    const llegadaPais = s.aeropuertoLlegadaPais || '-';

    return `Segmento ${s.ordenSegmento || '-'} | ${salidaCiudad}, ${salidaPais} → ${llegadaCiudad}, ${llegadaPais}`;
  }

  getCodigoAsiento(a: AsientoVuelo | null | undefined): string {
    return String(a?.codigoAsientoSistema || a?.id || '');
  }

  getPrecioClasePasajero(item: PasajeroReservaForm): number {
    if (!this.vueloSeleccionado || !Number(item.claseVueloId)) {
      return 0;
    }

    const clase = this.clases.find((c) => Number(c.id) === Number(item.claseVueloId));
    const nombre = this.normalizarTexto(clase?.nombre);

    if (nombre.includes('EJECUTIVA')) {
      return Number(this.vueloSeleccionado.precioEjecutiva || 0);
    }

    return Number(this.vueloSeleccionado.precioEconomica || 0);
  }

  getPasajeroTitulo(item: PasajeroReservaForm, index: number): string {
    if (item.esPrincipal) {
      return `Pasajero ${index + 1} - Titular`;
    }

    return `Pasajero ${index + 1} - Acompañante`;
  }

  getPasajeroResumen(item: PasajeroReservaForm): string {
    if (item.esPrincipal) {
      return this.pasajero?.nombreCompleto || 'Titular';
    }

    return item.nombreCompleto || item.pasaporte || 'Acompañante';
  }

  formatMoney(value: any): string {
    const amount = Number(value ?? 0);

    return amount.toLocaleString('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    });
  }

  refrescarReservaActual(): void {
    const reservaId = Number(this.reserva?.reservaId);

    if (!reservaId) {
      return;
    }

    this.reservasService.obtenerPorId(reservaId).subscribe({
      next: (res) => {
        this.reserva = res;
      },
      error: () => {}
    });
  }

  esReservaPagada(reserva: any): boolean {
    return reserva?.pagada === true ||
      String(reserva?.estadoPago || '').toUpperCase() === 'PAGADO';
  }

  esReservaCancelada(reserva: any): boolean {
    return String(reserva?.estadoReserva || '').toUpperCase() === 'CANCELADA';
  }

  private inicializarPasajeroPrincipal(): void {
    const principal = this.crearPasajeroForm(true);

    principal.usarPasajeroExistente = true;
    principal.pasajeroId = this.pasajero?.id ? String(this.pasajero.id) : '';
    principal.pasaporte = this.pasajero?.pasaporte || '';
    principal.nombreCompleto = this.pasajero?.nombreCompleto || '';
    principal.fechaNacimiento = this.pasajero?.fechaNacimiento || '';
    principal.nacionalidad = this.pasajero?.nacionalidad || 'Guatemala';
    principal.codigoArea = this.pasajero?.codigoArea || '+502';
    principal.telefono = this.pasajero?.telefono || '';
    principal.telefonoEmergencia = this.pasajero?.telefonoEmergencia || '';
    principal.direccion = this.pasajero?.direccion || '';

    this.pasajerosReserva = [principal];
  }

  private crearPasajeroForm(esPrincipal: boolean): PasajeroReservaForm {
    return {
      uid: this.uidSeq++,
      esPrincipal,
      usarPasajeroExistente: esPrincipal,

      pasajeroId: '',
      pasaporte: '',
      nombreCompleto: '',
      fechaNacimiento: '',
      nacionalidad: 'Guatemala',
      codigoArea: '+502',
      telefono: '',
      telefonoEmergencia: '',
      direccion: '',

      claseVueloId: '',
      cantidadMaletas: 0,
      asientoUnicoId: '',
      asientoSeleccionadoPorSegmento: {}
    };
  }

  private validarReserva(mostrar: boolean): boolean {
    if (!this.vueloSeleccionado) {
      if (mostrar) this.error = 'Selecciona un vuelo.';
      return false;
    }

    if (!this.pasajerosReserva.length) {
      if (mostrar) this.error = 'Debe existir al menos un pasajero.';
      return false;
    }

    const pasajeros = new Set<string>();
    const asientos = new Set<string>();

    for (const item of this.pasajerosReserva) {
      if (!Number(item.claseVueloId)) {
        if (mostrar) this.error = `Selecciona clase para ${this.getPasajeroResumen(item)}.`;
        return false;
      }

      if (Number(item.cantidadMaletas || 0) < 0) {
        if (mostrar) this.error = 'La cantidad de maletas no puede ser negativa.';
        return false;
      }

      if (item.esPrincipal) {
        if (!Number(item.pasajeroId)) {
          if (mostrar) this.error = 'No se pudo identificar al pasajero titular.';
          return false;
        }
      } else {
        if (
          !item.pasaporte.trim() ||
          !item.nombreCompleto.trim() ||
          !item.fechaNacimiento ||
          !item.nacionalidad.trim() ||
          !item.telefonoEmergencia.trim()
        ) {
          if (mostrar) this.error = 'Debe ingresar pasaporte, nombre, fecha nacimiento, nacionalidad y telefono de emergencia del acompanante.';
          return false;
        }
      }

      const clave = item.esPrincipal
        ? `ID-${Number(item.pasajeroId)}`
        : `PAS-${item.pasaporte.trim().toUpperCase()}`;

      if (pasajeros.has(clave)) {
        if (mostrar) this.error = 'No puede repetir pasajeros en la misma reserva.';
        return false;
      }

      pasajeros.add(clave);

      const segmentos = this.construirSegmentosAsientos(item, mostrar);

      if (!segmentos.length) {
        return false;
      }

      for (const sa of segmentos) {
        const key = `${sa.segmentoOperadoId}-${sa.asientoVueloId}`;

        if (asientos.has(key)) {
          if (mostrar) this.error = 'No puede repetir el mismo asiento en el mismo segmento.';
          return false;
        }

        asientos.add(key);
      }
    }

    return true;
  }

  private construirPayloadReserva(): any | null {
    if (!this.vueloSeleccionado) {
      this.error = 'Selecciona un vuelo.';
      return null;
    }

    const pasajerosPayload = this.pasajerosReserva.map((item) => {
      const segmentosAsientos = this.construirSegmentosAsientos(item, true);
      const primerSegmento = segmentosAsientos[0];
      const esPrincipal = item.esPrincipal;

      return {
        pasajeroId: esPrincipal ? Number(item.pasajeroId) : null,

        pasaporte: esPrincipal ? null : item.pasaporte.trim(),
        nombreCompleto: esPrincipal ? null : item.nombreCompleto.trim(),
        fechaNacimiento: esPrincipal ? null : item.fechaNacimiento,
        nacionalidad: esPrincipal ? null : item.nacionalidad.trim(),
        codigoArea: esPrincipal ? null : this.valorOpcional(item.codigoArea),
        telefono: esPrincipal ? null : this.valorOpcional(item.telefono),
        telefonoEmergencia: esPrincipal ? null : item.telefonoEmergencia.trim(),
        direccion: esPrincipal ? null : this.valorOpcional(item.direccion),

        claseVueloId: Number(item.claseVueloId),
        cantidadMaletas: Number(item.cantidadMaletas || 0),
        requiereAsiento: true,
        precioBase: this.getPrecioClasePasajero(item),
        asientoVueloId: primerSegmento?.asientoVueloId || null,
        segmentosAsientos
      };
    });

    const primero = pasajerosPayload[0];
    const primerSegmento = primero?.segmentosAsientos?.[0];

    return {
      userId: Number(this.pasajero?.userId || 0) || null,
      pasajeroId: Number(this.pasajero?.id || primero?.pasajeroId || 0) || null,
      vueloOperadoId: Number(this.vueloSeleccionado.vueloOperadoId),

      segmentoOperadoId: primerSegmento?.segmentoOperadoId || null,
      asientoVueloId: primerSegmento?.asientoVueloId || null,
      claseVueloId: primero?.claseVueloId || null,
      cantidadMaletas: primero?.cantidadMaletas || 0,
      precioBase: primero?.precioBase || null,
      requiereAsiento: true,
      segmentosAsientos: primero?.segmentosAsientos || [],

      pasajeros: pasajerosPayload
    };
  }

  private construirSegmentosAsientos(
    item: PasajeroReservaForm,
    mostrar: boolean
  ): SegmentoAsientoPayload[] {
    if (!this.vueloSeleccionado || !this.segmentos.length) {
      if (mostrar) this.error = 'Selecciona un vuelo con segmentos.';
      return [];
    }

    if (this.usaAsientoUnico) {
      return this.construirAsientoUnico(item, mostrar);
    }

    return this.construirAsientosPorSegmento(item, mostrar);
  }

  private construirAsientoUnico(
    item: PasajeroReservaForm,
    mostrar: boolean
  ): SegmentoAsientoPayload[] {
    const asientoId = Number(item.asientoUnicoId);
    const primerSegmentoId = this.primerSegmentoId;

    if (!asientoId || !primerSegmentoId) {
      if (mostrar) this.error = `Selecciona asiento para ${this.getPasajeroResumen(item)}.`;
      return [];
    }

    const asientoBase = (this.asientosPorSegmento[primerSegmentoId] ?? [])
      .find((a) => Number(a.id) === asientoId);

    if (!asientoBase) {
      if (mostrar) this.error = 'El asiento seleccionado ya no está disponible.';
      return [];
    }

    const codigo = this.getCodigoAsiento(asientoBase);
    const resultado: SegmentoAsientoPayload[] = [];

    for (const segmento of this.segmentos) {
      const segmentoId = Number(segmento.segmentoOperadoId);

      const equivalente = (this.asientosPorSegmento[segmentoId] ?? [])
        .find((a) => this.getCodigoAsiento(a) === codigo);

      if (!equivalente) {
        if (mostrar) {
          this.error = `El asiento ${codigo} no está disponible en el segmento ${segmento.ordenSegmento}.`;
        }
        return [];
      }

      resultado.push({
        segmentoOperadoId: segmentoId,
        asientoVueloId: Number(equivalente.id)
      });
    }

    return resultado;
  }

  private construirAsientosPorSegmento(
    item: PasajeroReservaForm,
    mostrar: boolean
  ): SegmentoAsientoPayload[] {
    const resultado: SegmentoAsientoPayload[] = [];

    for (const segmento of this.segmentos) {
      const segmentoId = Number(segmento.segmentoOperadoId);
      const asientoId = Number(item.asientoSeleccionadoPorSegmento[segmentoId]);

      if (!segmentoId || !asientoId) {
        if (mostrar) {
          this.error = `Selecciona asiento para ${this.getPasajeroResumen(item)} en el segmento ${segmento.ordenSegmento}.`;
        }
        return [];
      }

      resultado.push({
        segmentoOperadoId: segmentoId,
        asientoVueloId: asientoId
      });
    }

    return resultado;
  }

  private asientoExisteEnTodosLosSegmentos(asiento: AsientoVuelo): boolean {
    const codigo = this.getCodigoAsiento(asiento);

    if (!codigo) {
      return false;
    }

    return this.segmentos.every((s) => {
      const segmentoId = Number(s.segmentoOperadoId);

      return (this.asientosPorSegmento[segmentoId] ?? [])
        .some((a) => this.getCodigoAsiento(a) === codigo);
    });
  }

  private asientoUsadoEnSegmento(
    segmentoId: number,
    asientoId: number,
    uid: number
  ): boolean {
    return this.pasajerosReserva.some((p) => {
      if (p.uid === uid) {
        return false;
      }

      if (this.usaAsientoUnico) {
        return this.construirAsientoUnico(p, false)
          .some((sa) => sa.segmentoOperadoId === segmentoId && sa.asientoVueloId === asientoId);
      }

      return Number(p.asientoSeleccionadoPorSegmento[segmentoId]) === asientoId;
    });
  }

  private asientoUnicoUsado(asiento: AsientoVuelo, uid: number): boolean {
    const codigo = this.getCodigoAsiento(asiento);

    if (!codigo || !this.primerSegmentoId) {
      return false;
    }

    return this.pasajerosReserva.some((p) => {
      if (p.uid === uid) {
        return false;
      }

      const asientoId = Number(p.asientoUnicoId);

      if (!asientoId) {
        return false;
      }

      const asientoActual = (this.asientosPorSegmento[this.primerSegmentoId] ?? [])
        .find((a) => Number(a.id) === asientoId);

      return this.getCodigoAsiento(asientoActual) === codigo;
    });
  }

  private obtenerBoletosParaCheckin(): any[] {
    if (this.reserva?.boletos?.length) {
      return this.reserva.boletos.filter((b: any) => !!Number(b.boletoId));
    }

    if (this.reserva?.boletoId) {
      return [{ boletoId: this.reserva.boletoId }];
    }

    return [];
  }

  private limpiarDestinoYVuelo(): void {
    this.busquedaDestino = '';
    this.destinosUbicaciones = [];
    this.destinoUbicacionSeleccionada = null;
    this.aeropuertosDestino = [];
    this.aeropuertoDestinoSeleccionado = null;
    this.fechasDisponibles = [];
    this.fechaSalida = '';
    this.limpiarVueloYReserva();
  }

  private limpiarVueloYReserva(): void {
    this.vuelosDisponibles = [];
    this.vueloSeleccionado = null;
    this.asientosPorSegmento = {};
    this.limpiarAsientosPasajeros();
    this.reserva = null;
    this.pago = null;
    this.checkins = [];
  }

  private limpiarAsientosPasajeros(): void {
    this.pasajerosReserva.forEach((p) => {
      p.asientoUnicoId = '';
      p.asientoSeleccionadoPorSegmento = {};
    });
  }

  private normalizarTexto(value: any): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  private obtenerFechaMinima(): string {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  }

  private valorOpcional(value: any): string | null {
    const text = String(value ?? '').trim();
    return text || null;
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  private safeName(value: any): string {
    const text = String(value ?? '').trim();

    if (!text) {
      return 'documento';
    }

    return text.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
