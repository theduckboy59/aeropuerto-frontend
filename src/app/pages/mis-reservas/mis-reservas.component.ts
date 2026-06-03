import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import {
  ReservaResponse,
  ReservaService
} from '../../services/reserva.service';

import { PasajeroService } from '../../services/pasajero.service';
import { PagoService } from '../../services/pago.service';
import { DocumentosService } from '../../services/documentos.service';
import { CatalogoService } from '../../services/catalogo.service';
import { CheckInService } from '../../services/checkin.service';

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.css'
})
export class MisReservasComponent implements OnInit {
  cargando = false;
  cargandoDetalle = false;
  cargandoPago = false;
  cargandoCheckinBoletoId: number | null = null;

  error: string | null = null;
  ok: string | null = null;
  aviso: string | null = null;

  pasajero: any | null = null;

  reservas: ReservaResponse[] = [];
  reservaSeleccionada: ReservaResponse | null = null;
  pagosReserva: any[] = [];
  checkinsPorBoleto: Record<number, any> = {};

  metodosPago: any[] = [];
  estadosReserva: any[] = [];
  estadosPago: any[] = [];
  estadosBoleto: any[] = [];

  pagoForm = {
    metodoPagoId: '',
    nit: 'CF',
    nombreCliente: ''
  };

  constructor(
    private pasajerosService: PasajeroService,
    private reservasService: ReservaService,
    private pagosService: PagoService,
    private documentosService: DocumentosService,
    private catalogosService: CatalogoService,
    private checkinService: CheckInService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarReservas();
  }

  get boletos(): any[] {
    return this.reservaSeleccionada?.boletos ?? [];
  }

  get pagoPrincipal(): any | null {
    const pagos = this.pagosReserva ?? [];

    const normal = pagos.find((p) =>
      Number(p?.recargoEquipaje ?? 0) === 0
    );

    if (normal) {
      return normal;
    }

    if (this.reservaSeleccionada?.pagoId) {
      return {
        id: this.reservaSeleccionada.pagoId,
        estadoPago: this.reservaSeleccionada.estadoPago,
        metodoPago: this.reservaSeleccionada.metodoPago,
        monto: this.reservaSeleccionada.montoPago,
        factura: this.reservaSeleccionada.facturaId ? {} : null
      };
    }

    return null;
  }

  get puedePagarSeleccionada(): boolean {
    if (!this.reservaSeleccionada?.reservaId) {
      return false;
    }

    if (this.esCancelada(this.reservaSeleccionada)) {
      return false;
    }

    return !this.esPagada(this.reservaSeleccionada);
  }

  get puedeCancelarSeleccionada(): boolean {
    if (!this.reservaSeleccionada?.reservaId) {
      return false;
    }

    if (this.esCancelada(this.reservaSeleccionada)) {
      return false;
    }

    const boletos = this.reservaSeleccionada.boletos ?? [];

    const tieneAbordado = boletos.some((b) =>
      String(b?.estadoBoleto || '').toUpperCase() === 'ABORDADO' ||
      (b?.segmentos ?? []).some((s: any) =>
        String(s?.estadoBoletoSegmento || '').toUpperCase() === 'ABORDADO'
      )
    );

    return !tieneAbordado;
  }

  cargarCatalogos(): void {
    forkJoin({
      metodosPago: this.catalogosService.metodoPago(),
      estadosReserva: this.catalogosService.estadoReserva(),
      estadosPago: this.catalogosService.estadoPago(),
      estadosBoleto: this.catalogosService.estadoBoleto()
    }).subscribe({
      next: (res) => {
        this.metodosPago = res.metodosPago ?? [];
        this.estadosReserva = res.estadosReserva ?? [];
        this.estadosPago = res.estadosPago ?? [];
        this.estadosBoleto = res.estadosBoleto ?? [];
      },
      error: () => {
        this.metodosPago = [];
        this.estadosReserva = [];
        this.estadosPago = [];
        this.estadosBoleto = [];
      }
    });
  }

  cargarReservas(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    this.reservas = [];
    this.reservaSeleccionada = null;
    this.pagosReserva = [];
    this.checkinsPorBoleto = {};

    this.cargando = true;

    this.pasajerosService.obtenerActual().subscribe({
      next: (pasajero) => {
        this.pasajero = pasajero;
        this.pagoForm.nombreCliente = pasajero?.nombreCompleto || '';

        const pasajeroId = Number(pasajero?.id || pasajero?.pasajeroId);

        if (!pasajeroId) {
          this.error = 'No se pudo identificar el pasajero actual.';
          this.cargando = false;
          return;
        }

        this.reservasService.listarPorPasajero(pasajeroId).subscribe({
          next: (res) => {
            this.reservas = res ?? [];
            this.cargando = false;

            if (!this.reservas.length) {
              this.aviso = 'No tienes reservas registradas.';
            }
          },
          error: (err) => {
            this.error = err?.error?.message || 'No se pudieron cargar tus reservas.';
            this.cargando = false;
          }
        });
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil del pasajero.';
        this.cargando = false;
      }
    });
  }

  seleccionarReserva(reserva: ReservaResponse): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    const reservaId = Number(reserva?.reservaId);

    if (!reservaId) {
      this.error = 'Reserva invalida.';
      return;
    }

    this.cargandoDetalle = true;
    this.reservaSeleccionada = null;
    this.pagosReserva = [];
    this.checkinsPorBoleto = {};

    forkJoin({
      reserva: this.reservasService.obtenerPorId(reservaId),
      pagos: this.pagosService.listarPorReserva(reservaId)
    }).subscribe({
      next: (res) => {
        this.reservaSeleccionada = res.reserva;
        this.pagosReserva = res.pagos ?? [];
        this.checkinsPorBoleto = {};
        this.cargarCheckinsBoletos(this.reservaSeleccionada?.boletos ?? []);

        if (!this.pagoForm.nombreCliente) {
          this.pagoForm.nombreCliente = this.pasajero?.nombreCompleto || '';
        }

        this.cargandoDetalle = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar el detalle de la reserva.';
        this.cargandoDetalle = false;
      }
    });
  }

  pagarReserva(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    const reserva = this.reservaSeleccionada;
    const reservaId = Number(reserva?.reservaId);
    const metodoPagoId = Number(this.pagoForm.metodoPagoId);

    if (!reservaId) {
      this.error = 'Selecciona una reserva.';
      return;
    }

    if (!metodoPagoId) {
      this.error = 'Selecciona metodo de pago.';
      return;
    }

    const nit = this.pagoForm.nit?.trim() || 'CF';
    const nombreCliente =
      this.pagoForm.nombreCliente?.trim() ||
      this.pasajero?.nombreCompleto ||
      'Consumidor Final';

    const pago = this.pagoPrincipal;
    const pagoPendienteId = this.esPagoPendiente(pago) ? Number(pago?.id) : 0;

    this.cargandoPago = true;

    const observable = pagoPendienteId
      ? this.pagosService.confirmarPagoPendiente(pagoPendienteId, {
          metodoPagoId,
          nit,
          nombreCliente
        })
      : this.pagosService.pagar({
          reservaId,
          metodoPagoId,
          monto: Number(reserva?.total ?? 0),
          nit,
          nombreCliente,
          tipoPago: 'NORMAL'
        });

    observable.subscribe({
      next: () => {
        this.ok = 'Pago confirmado correctamente.';
        this.cargandoPago = false;
        this.recargarReservaSeleccionada();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo confirmar el pago.';
        this.cargandoPago = false;
      }
    });
  }

  cancelarReserva(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    const reservaId = Number(this.reservaSeleccionada?.reservaId);

    if (!reservaId) {
      this.error = 'Selecciona una reserva.';
      return;
    }

    if (!confirm('Seguro que deseas cancelar esta reserva? Los asientos volveran a estar disponibles.')) {
      return;
    }

    this.cargandoDetalle = true;

    this.reservasService.cancelar(reservaId).subscribe({
      next: (res) => {
        this.ok = res?.mensaje || 'Reserva cancelada correctamente.';
        this.cargandoDetalle = false;
        this.cargarReservas();
        this.seleccionarReserva(res);
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cancelar la reserva.';
        this.cargandoDetalle = false;
      }
    });
  }

  recargarReservaSeleccionada(): void {
    const id = Number(this.reservaSeleccionada?.reservaId);

    if (!id) {
      return;
    }

    forkJoin({
      reserva: this.reservasService.obtenerPorId(id),
      pagos: this.pagosService.listarPorReserva(id)
    }).subscribe({
      next: (res) => {
        this.reservaSeleccionada = res.reserva;
        this.pagosReserva = res.pagos ?? [];
        this.checkinsPorBoleto = {};
        this.cargarCheckinsBoletos(this.reservaSeleccionada?.boletos ?? []);

        const index = this.reservas.findIndex((r) => Number(r.reservaId) === id);

        if (index >= 0) {
          this.reservas[index] = res.reserva;
        }
      },
      error: () => {}
    });
  }

  descargarReservaPdf(reserva?: ReservaResponse | null): void {
    const item = reserva || this.reservaSeleccionada;
    const id = Number(item?.reservaId);

    if (!id) {
      return;
    }

    this.documentosService.reservaPdf(id).subscribe({
      next: (blob) => this.saveBlob(
        blob,
        `reserva_${this.safeName(item?.codigoReserva || id)}.pdf`
      ),
      error: () => {
        this.error = 'No se pudo descargar el PDF de la reserva.';
      }
    });
  }

  descargarBoletoPdf(boleto: any): void {
    const id = Number(boleto?.boletoId);

    if (!id) {
      return;
    }

    this.documentosService.boletoPdf(id).subscribe({
      next: (blob) => this.saveBlob(
        blob,
        `boleto_${this.safeName(boleto?.codigoBoleto || id)}.pdf`
      ),
      error: () => {
        this.error = 'No se pudo descargar el boleto.';
      }
    });
  }

  descargarFacturaPdf(): void {
    const pago = this.pagoPrincipal;
    const id = Number(pago?.id || this.reservaSeleccionada?.pagoId);

    if (!id) {
      this.error = 'No hay factura disponible para esta reserva.';
      return;
    }

    if (!this.esPagada(this.reservaSeleccionada) && !this.esPagoPagado(pago)) {
      this.error = 'La factura solo esta disponible cuando el pago esta confirmado.';
      return;
    }

    this.documentosService.facturaPorPagoPdf(id).subscribe({
      next: (blob) => this.saveBlob(
        blob,
        `factura_${this.safeName(this.reservaSeleccionada?.codigoReserva || id)}.pdf`
      ),
      error: () => {
        this.error = 'No se pudo descargar la factura.';
      }
    });
  }

  esPagada(reserva: any): boolean {
    return reserva?.pagada === true ||
      String(reserva?.estadoPago || '').toUpperCase() === 'PAGADO';
  }

  esCancelada(reserva: any): boolean {
    return String(reserva?.estadoReserva || '').toUpperCase() === 'CANCELADA';
  }

  esPagoPendiente(pago: any): boolean {
    return String(pago?.estadoPago || '').toUpperCase() === 'PENDIENTE';
  }

  esPagoPagado(pago: any): boolean {
    return String(pago?.estadoPago || '').toUpperCase() === 'PAGADO';
  }

  getEstadoReservaClass(reserva: any): string {
    const estado = String(reserva?.estadoReserva || '').toUpperCase();

    if (estado === 'CONFIRMADA') return 'state-ok';
    if (estado === 'CANCELADA') return 'state-danger';
    if (estado === 'CREADA') return 'state-open';

    return 'state-info';
  }

  getEstadoPagoClass(reserva: any): string {
    const estado = String(reserva?.estadoPago || '').toUpperCase();

    if (estado === 'PAGADO') return 'state-ok';
    if (estado === 'PENDIENTE') return 'state-open';
    if (estado === 'ANULADO' || estado === 'RECHAZADO') return 'state-danger';

    return 'state-info';
  }

  hacerCheckin(boleto: any): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    const boletoId = Number(boleto?.boletoId);

    if (!boletoId) {
      this.error = 'No se pudo identificar el boleto.';
      return;
    }

    if (!this.esPagada(this.reservaSeleccionada)) {
      this.error = 'Debe pagar la reserva antes de hacer check-in.';
      return;
    }

    if (this.boletoTieneCheckin(boleto)) {
      this.aviso = 'Este boleto ya tiene check-in realizado.';
      return;
    }

    this.cargandoCheckinBoletoId = boletoId;

    this.checkinService.realizar({
      boletoId,
      tipoCheckin: 'WEB'
    }).subscribe({
      next: (res) => {
        this.checkinsPorBoleto[boletoId] = res;
        this.ok = res?.mensaje || 'Check-in realizado correctamente.';
        this.cargandoCheckinBoletoId = null;
        this.recargarReservaSeleccionada();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo realizar el check-in.';
        this.cargandoCheckinBoletoId = null;
      }
    });
  }

  private cargarCheckinsBoletos(boletos: any[]): void {
    const ids = (boletos ?? [])
      .map((b) => Number(b?.boletoId))
      .filter((id) => !!id);

    if (!ids.length) {
      return;
    }

    forkJoin(
      ids.map((id) => this.checkinService.consultarPorBoleto(id))
    ).subscribe({
      next: (res: any[]) => {
        res.forEach((item) => {
          const boletoId = Number(item?.boletoId);

          if (boletoId) {
            this.checkinsPorBoleto[boletoId] = item;
          }
        });
      },
      error: () => {
        // No bloquea la pantalla. Si falla la consulta, el usuario aun puede intentar hacer check-in.
      }
    });
  }

  puedeHacerCheckin(boleto: any): boolean {
    if (!this.reservaSeleccionada) {
      return false;
    }

    if (!this.esPagada(this.reservaSeleccionada)) {
      return false;
    }

    if (this.esCancelada(this.reservaSeleccionada)) {
      return false;
    }

    const estadoBoleto = String(boleto?.estadoBoleto || '').toUpperCase();

    if (estadoBoleto === 'CANCELADO' || estadoBoleto === 'ABORDADO') {
      return false;
    }

    return !this.boletoTieneCheckin(boleto);
  }

  boletoTieneCheckin(boleto: any): boolean {
    const boletoId = Number(boleto?.boletoId);

    if (!boletoId) {
      return false;
    }

    const checkin = this.checkinsPorBoleto[boletoId];
    const segmentos = checkin?.segmentos ?? [];

    if (!segmentos.length) {
      return false;
    }

    return segmentos.every((s: any) =>
      String(s?.estadoCheckin || '').toUpperCase() === 'REALIZADO'
    );
  }

  getEstadoCheckinTexto(boleto: any): string {
    if (!this.esPagada(this.reservaSeleccionada)) {
      return 'PAGO PENDIENTE';
    }

    if (this.boletoTieneCheckin(boleto)) {
      return 'REALIZADO';
    }

    return 'PENDIENTE';
  }

  getEstadoCheckinClass(boleto: any): string {
    if (!this.esPagada(this.reservaSeleccionada)) {
      return 'state-open';
    }

    if (this.boletoTieneCheckin(boleto)) {
      return 'state-ok';
    }

    return 'state-info';
  }

  toNumber(value: any): number {
    return Number(value || 0);
  }

  getCodigoVueloReserva(reserva: any): string {
    return reserva?.codigoVuelo ||
      reserva?.boletos?.[0]?.codigoVuelo ||
      '-';
  }

  getRutaReserva(reserva: any): string {
    return reserva?.ruta ||
      reserva?.boletos?.[0]?.ruta ||
      '-';
  }

  getSalidaReserva(reserva: any): string {
    const fecha = reserva?.fechaSalida || reserva?.boletos?.[0]?.fechaSalida || '';
    const hora = reserva?.horaSalida || reserva?.boletos?.[0]?.horaSalida || '';
    const texto = `${fecha} ${hora}`.trim();

    return texto || '-';
  }

  getCodigoVueloBoleto(boleto: any): string {
    return boleto?.codigoVuelo ||
      this.reservaSeleccionada?.codigoVuelo ||
      '-';
  }

  getRutaBoleto(boleto: any): string {
    return boleto?.ruta ||
      this.reservaSeleccionada?.ruta ||
      '-';
  }

  getSalidaBoleto(boleto: any): string {
    const fecha = boleto?.fechaSalida || this.reservaSeleccionada?.fechaSalida || '';
    const hora = boleto?.horaSalida || this.reservaSeleccionada?.horaSalida || '';
    const texto = `${fecha} ${hora}`.trim();

    return texto || '-';
  }

  formatMoney(value: any): string {
    const amount = Number(value ?? 0);

    return amount.toLocaleString('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  private safeName(value: any): string {
    return String(value || 'documento')
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
