import { Component, OnInit } from '@angular/core';
import { AsientoVuelo, AsientoVueloService } from '../../services/asiento-vuelo.service';
import { CatalogoService } from '../../services/catalogo.service';
import { CheckInService } from '../../services/checkin.service';
import { DocumentosService } from '../../services/documentos.service';
import { PagoService } from '../../services/pago.service';
import { PasajeroService } from '../../services/pasajero.service';
import { ReservaService } from '../../services/reserva.service';
import { VueloOperado, VueloOperadoService } from '../../services/vuelo-operado.service';

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
  clases: any[] = [];
  metodosPago: any[] = [];

  filtros = {
    aeropuertoSalidaId: '',
    aeropuertoLlegadaId: '',
    fechaSalida: ''
  };

  vuelosOperados: VueloOperado[] = [];
  vueloSeleccionado: VueloOperado | null = null;
  segmentoSeleccionadoId = '';
  claseVueloId = '';

  asientos: AsientoVuelo[] = [];
  asientoVueloId = '';
  cantidadMaletas = 0;

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
    private vuelosOperadosService: VueloOperadoService,
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
        this.error = 'No se pudo cargar el perfil del pasajero. Inicia sesion de nuevo.';
      }
    });

    this.catalogos.aeropuertos().subscribe({ next: (r) => (this.aeropuertos = r ?? []) });
    this.catalogos.claseVuelo().subscribe({ next: (r) => (this.clases = r ?? []) });
    this.catalogos.metodoPago().subscribe({ next: (r) => (this.metodosPago = r ?? []) });

    setTimeout(() => (this.cargando = false), 250);
  }

  get segmentos(): any[] {
    return (this.vueloSeleccionado?.segmentos ?? []) as any[];
  }

  get puedeCargarAsientos(): boolean {
    return !!this.vueloSeleccionado && !!Number(this.segmentoSeleccionadoId) && !!Number(this.claseVueloId);
  }

  get puedeReservar(): boolean {
    return !!this.pasajero?.id && !!this.pasajero?.userId && this.puedeCargarAsientos && !!Number(this.asientoVueloId);
  }

  get puedePagar(): boolean {
    return !!this.reserva?.reservaId;
  }

  get puedeHacerCheckin(): boolean {
    return !!this.reserva?.boletoId && !!this.reserva?.vueloOperadoId;
  }

  buscar(): void {
    this.error = null;
    this.aviso = null;

    this.resetSeleccion();

    const salidaId = Number(this.filtros.aeropuertoSalidaId);
    const llegadaId = Number(this.filtros.aeropuertoLlegadaId);
    const fecha = (this.filtros.fechaSalida || '').trim();

    if (!salidaId || !llegadaId || !fecha) {
      this.error = 'Completa salida, llegada y fecha para buscar vuelos.';
      return;
    }

    if (salidaId === llegadaId) {
      this.error = 'El aeropuerto de salida no puede ser igual al de llegada.';
      return;
    }

    this.cargando = true;
    this.vuelosOperadosService.listar({ page: 0, size: 300 }).subscribe({
      next: (page) => {
        const all = page?.content ?? [];
        this.vuelosOperados = all.filter((v) => {
          const fechaSalida = String((v as any).fechaSalidaProgramada ?? '');
          return (
            Number(v.aeropuertoSalidaId) === salidaId &&
            Number(v.aeropuertoLlegadaId) === llegadaId &&
            fechaSalida.startsWith(fecha)
          );
        });

        if (!this.vuelosOperados.length) {
          this.aviso = 'No hay vuelos operados para esos filtros.';
        }

        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar vuelos operados.';
        this.cargando = false;
      }
    });
  }

  seleccionarVuelo(vuelo: VueloOperado): void {
    this.error = null;
    this.aviso = null;

    this.vueloSeleccionado = null;
    this.segmentoSeleccionadoId = '';
    this.claseVueloId = '';
    this.asientos = [];
    this.asientoVueloId = '';
    this.reserva = null;
    this.pago = null;
    this.checkin = null;

    this.cargando = true;
    this.vuelosOperadosService.obtener(vuelo.id).subscribe({
      next: (detalle) => {
        this.vueloSeleccionado = detalle;

        if (!this.segmentos.length) {
          this.aviso = 'El vuelo seleccionado no tiene segmentos visibles para reservar.';
        } else if (this.segmentos.length === 1) {
          this.segmentoSeleccionadoId = String(this.segmentos[0].id);
        }

        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar el detalle del vuelo seleccionado.';
        this.cargando = false;
      }
    });
  }

  onSegmentoOClaseChange(): void {
    this.error = null;
    this.aviso = null;
    this.asientos = [];
    this.asientoVueloId = '';
  }

  cargarAsientos(): void {
    this.error = null;
    this.aviso = null;
    this.asientos = [];
    this.asientoVueloId = '';

    if (!this.puedeCargarAsientos) {
      this.error = 'Selecciona segmento y clase para cargar asientos.';
      return;
    }

    const segmentoId = Number(this.segmentoSeleccionadoId);
    const claseId = Number(this.claseVueloId);

    this.cargandoAsientos = true;
    this.asientosService.listarDisponiblesPorSegmento(segmentoId, claseId).subscribe({
      next: (res) => {
        this.asientos = res ?? [];
        if (!this.asientos.length) {
          this.aviso = 'No hay asientos disponibles para ese segmento y clase.';
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
      this.error = 'Antes de reservar debes seleccionar segmento, clase y asiento.';
      return;
    }

    this.cargando = true;
    this.reservasService
      .crear({
        userId: this.pasajero.userId,
        vueloOperadoId: Number(this.vueloSeleccionado?.id),
        segmentoOperadoId: Number(this.segmentoSeleccionadoId),
        pasajeros: [
          {
            pasajeroId: this.pasajero.id,
            asientoVueloId: Number(this.asientoVueloId),
            claseVueloId: Number(this.claseVueloId),
            cantidadMaletas: this.cantidadMaletas ?? 0,
            requiereAsiento: true
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

    if (!this.puedePagar) {
      this.error = 'Primero crea la reserva.';
      return;
    }

    const metodoPagoId = Number(this.pagoForm.metodoPagoId);
    if (!metodoPagoId) {
      this.error = 'Selecciona el metodo de pago.';
      return;
    }

    const monto = Number(this.reserva?.total ?? this.reserva?.subtotal ?? 0);
    if (!monto || monto <= 0) {
      this.error = 'Monto invalido para pago.';
      return;
    }

    this.cargando = true;
    this.pagosService
      .pagar({
        reservaId: Number(this.reserva.reservaId),
        metodoPagoId,
        monto,
        nit: (this.pagoForm.nit || '').trim(),
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

    if (!this.puedeHacerCheckin) {
      this.error = 'No hay boleto asociado para check-in.';
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

  descargarReservaPdf(): void {
    const id = Number(this.reserva?.reservaId);
    if (!id) return;
    this.documentos.reservaPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `reserva_${this.reserva?.codigoReserva || id}.pdf`)
    });
  }

  descargarBoletoPdf(): void {
    const id = Number(this.reserva?.boletoId);
    if (!id) return;
    this.documentos.boletoPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `boleto_${this.reserva?.codigoBoleto || id}.pdf`)
    });
  }

  descargarFacturaPdf(): void {
    const id = Number(this.pago?.id);
    if (!id) return;
    this.documentos.facturaPorPagoPdf(id).subscribe({
      next: (blob) => this.saveBlob(blob, `factura_pago_${id}.pdf`)
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private resetSeleccion(): void {
    this.vuelosOperados = [];
    this.vueloSeleccionado = null;
    this.segmentoSeleccionadoId = '';
    this.claseVueloId = '';
    this.asientos = [];
    this.asientoVueloId = '';
    this.reserva = null;
    this.pago = null;
    this.checkin = null;
  }
}

