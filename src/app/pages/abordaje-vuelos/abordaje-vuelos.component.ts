import { Component, OnInit } from '@angular/core';

import {
  AbordajeEquipajeRequest,
  AbordajeResponse,
  AbordajeService,
  AbordajeVueloPendienteResponse,
  FinalizarAbordajeResponse
} from '../../services/abordaje.service';

import { CatalogoService } from '../../services/catalogo.service';
import { PagoService } from '../../services/pago.service';

@Component({
  selector: 'app-abordaje-vuelos',
  templateUrl: './abordaje-vuelos.component.html',
  styleUrl: './abordaje-vuelos.component.css'
})
export class AbordajeVuelosComponent implements OnInit {

  cargando = false;
  cargandoPago = false;

  error: string | null = null;
  ok: string | null = null;
  aviso: string | null = null;

  aerolineas: any[] = [];
  metodosPago: any[] = [];

  aerolineaId = '';

  vuelos: AbordajeVueloPendienteResponse[] = [];
  vueloSeleccionado: AbordajeVueloPendienteResponse | null = null;

  pasaporte = '';
  maletasPresentadas = 0;

  equipajes: AbordajeEquipajeRequest[] = [];

  consulta: AbordajeResponse | null = null;
  resultadoFinalizacion: FinalizarAbordajeResponse | null = null;

  pagoRecargoForm = {
    metodoPagoId: '',
    nit: 'CF',
    nombreCliente: ''
  };

  constructor(
    private abordaje: AbordajeService,
    private catalogos: CatalogoService,
    private pagos: PagoService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  get puedeListar(): boolean {
    return !!Number(this.aerolineaId);
  }

  get puedeBuscar(): boolean {
    return !!Number(this.vueloSeleccionado?.vueloOperadoId) &&
      !!Number(this.vueloSeleccionado?.segmentoOperadoId) &&
      !!this.pasaporte.trim();
  }

  get requierePagoRecargo(): boolean {
    return this.consulta?.requierePagoRecargo === true &&
      !!Number(this.consulta?.pagoRecargoId);
  }

  get puedeRegistrar(): boolean {
    return this.puedeBuscar &&
      Number(this.maletasPresentadas ?? 0) >= 0 &&
      this.equipajesValidos() &&
      !this.requierePagoRecargo;
  }

  get puedeConfirmarRecargo(): boolean {
    return this.requierePagoRecargo &&
      !!Number(this.pagoRecargoForm.metodoPagoId);
  }

  get puedeFinalizar(): boolean {
    return !!Number(this.vueloSeleccionado?.vueloOperadoId) &&
      !!Number(this.vueloSeleccionado?.segmentoOperadoId);
  }

  get codigoVueloSeleccionado(): string {
    return this.vueloSeleccionado?.codigoVuelo ||
      String(this.vueloSeleccionado?.vueloOperadoId || '-');
  }

  get segmentoTextoSeleccionado(): string {
    if (!this.vueloSeleccionado) {
      return '-';
    }

    return `Segmento ${this.vueloSeleccionado.ordenSegmento || '-'}/${this.vueloSeleccionado.cantidadSegmentos || '-'}`;
  }

  cargarCatalogos(): void {
    this.cargarAerolineas();

    this.catalogos.metodoPago().subscribe({
      next: (r: any[]) => {
        this.metodosPago = r ?? [];
      },
      error: () => {
        this.metodosPago = [];
      }
    });
  }

  cargarAerolineas(): void {
    const catalogosAny = this.catalogos as any;
    const fn = catalogosAny.aerolineas;

    if (typeof fn !== 'function') {
      this.aerolineas = [];
      this.aviso = 'No se pudo cargar catálogo de aerolíneas. Ingresa el ID de aerolínea manualmente.';
      return;
    }

    fn.call(this.catalogos).subscribe({
      next: (r: any[]) => {
        this.aerolineas = r ?? [];
      },
      error: () => {
        this.aerolineas = [];
        this.aviso = 'No se pudo cargar catálogo de aerolíneas. Ingresa el ID de aerolínea manualmente.';
      }
    });
  }

  listar(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    this.vuelos = [];
    this.nuevoVuelo();

    const id = Number(this.aerolineaId);

    if (!id) {
      this.error = 'Selecciona o ingresa la aerolínea.';
      return;
    }

    this.cargando = true;

    this.abordaje.listarVuelosPendientes(id).subscribe({
      next: (res) => {
        this.vuelos = res ?? [];
        this.cargando = false;

        if (!this.vuelos.length) {
          this.aviso = 'No hay vuelos disponibles para abordaje.';
        }
      },
      error: (err: any) => {
        this.vuelos = [];
        this.cargando = false;
        this.error = err?.error?.message || 'No se pudieron cargar vuelos para abordaje.';
      }
    });
  }

  seleccionarVuelo(
    vuelo: AbordajeVueloPendienteResponse
  ): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    this.vueloSeleccionado = vuelo;

    this.pasaporte = '';
    this.maletasPresentadas = 0;
    this.equipajes = [];
    this.consulta = null;
    this.resultadoFinalizacion = null;

    this.pagoRecargoForm = {
      metodoPagoId: '',
      nit: 'CF',
      nombreCliente: ''
    };

    this.aviso = `Vuelo ${vuelo.codigoVuelo || vuelo.vueloOperadoId} seleccionado. ${this.getSegmentoTexto(vuelo)}.`;
  }

  nuevoVuelo(): void {
    this.vueloSeleccionado = null;
    this.consulta = null;
    this.resultadoFinalizacion = null;

    this.pasaporte = '';
    this.maletasPresentadas = 0;
    this.equipajes = [];

    this.pagoRecargoForm = {
      metodoPagoId: '',
      nit: 'CF',
      nombreCliente: ''
    };
  }

  buscarPasajero(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.consulta = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.vueloOperadoId);
    const segmentoOperadoId = Number(this.vueloSeleccionado?.segmentoOperadoId);
    const pasaporte = this.pasaporte.trim();

    if (!vueloOperadoId || !segmentoOperadoId) {
      this.error = 'Selecciona un vuelo y segmento de abordaje.';
      return;
    }

    if (!pasaporte) {
      this.error = 'Debe ingresar los campos obligatorios.';
      return;
    }

    this.cargando = true;

    this.abordaje.buscar({
      vueloOperadoId,
      segmentoOperadoId,
      pasaporte
    }).subscribe({
      next: (res: AbordajeResponse) => {
        this.consulta = res;
        this.maletasPresentadas = Number(res?.cantidadMaletasRegistradas ?? 0);
        this.sincronizarEquipajes();

        this.pagoRecargoForm.nombreCliente = res?.nombrePasajero || '';
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = this.apiError(
          err,
          'El pasajero no se encuentra registrado en el vuelo, no tiene check-in o la reserva no esta pagada.'
        );
        this.cargando = false;
      }
    });
  }

  onMaletasChange(): void {
    const cantidad = Number(this.maletasPresentadas ?? 0);

    if (cantidad < 0) {
      this.maletasPresentadas = 0;
    }

    this.sincronizarEquipajes();
  }

  sincronizarEquipajes(): void {
    const cantidad = Math.max(Number(this.maletasPresentadas ?? 0), 0);
    const actual = [...this.equipajes];

    while (actual.length < cantidad) {
      actual.push({
        numeroMaleta: actual.length + 1,
        peso: null
      });
    }

    while (actual.length > cantidad) {
      actual.pop();
    }

    this.equipajes = actual.map((e, index) => ({
      numeroMaleta: index + 1,
      peso: e.peso ?? null
    }));
  }

  registrarAbordaje(): void {
    this.registrarAbordajeInterno(false);
  }

  confirmarPagoRecargo(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    const pagoRecargoId = Number(this.consulta?.pagoRecargoId);
    const metodoPagoId = Number(this.pagoRecargoForm.metodoPagoId);

    if (!pagoRecargoId) {
      this.error = 'No existe pago de recargo pendiente.';
      return;
    }

    if (!metodoPagoId) {
      this.error = 'Selecciona método de pago para confirmar el recargo.';
      return;
    }

    this.cargandoPago = true;

    this.pagos
      .confirmarPagoPendiente(pagoRecargoId, {
        metodoPagoId,
        nit: this.pagoRecargoForm.nit?.trim() || 'CF',
        nombreCliente:
          this.pagoRecargoForm.nombreCliente?.trim() ||
          this.consulta?.nombrePasajero ||
          'Consumidor Final'
      })
      .subscribe({
        next: () => {
          this.cargandoPago = false;
          this.ok = 'Pago de recargo confirmado. Registrando abordaje...';
          this.registrarAbordajeInterno(true);
        },
        error: (err: any) => {
          this.error = this.apiError(
            err,
            'No se pudo confirmar el pago del recargo.'
          );
          this.cargandoPago = false;
        }
      });
  }

  finalizar(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.resultadoFinalizacion = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.vueloOperadoId);
    const segmentoOperadoId = Number(this.vueloSeleccionado?.segmentoOperadoId);

    if (!vueloOperadoId || !segmentoOperadoId) {
      this.error = 'Selecciona un vuelo y segmento.';
      return;
    }

    if (!confirm('¿Finalizar abordaje del segmento actual? Los boletos pendientes del segmento se cancelarán.')) {
      return;
    }

    this.cargando = true;

    this.abordaje.finalizar(
      vueloOperadoId,
      segmentoOperadoId
    ).subscribe({
      next: (res: FinalizarAbordajeResponse) => {
        this.resultadoFinalizacion = res;
        this.ok = res?.mensaje || 'Se completó el abordaje del segmento actual.';
        this.cargando = false;

        this.listar();
      },
      error: (err: any) => {
        this.error = this.apiError(
          err,
          'No se pudo finalizar el abordaje.'
        );
        this.cargando = false;
      }
    });
  }

  private registrarAbordajeInterno(
    desdePagoRecargo: boolean
  ): void {
    this.error = null;
    this.aviso = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.vueloOperadoId);
    const segmentoOperadoId = Number(this.vueloSeleccionado?.segmentoOperadoId);
    const pasaporte = this.pasaporte.trim();
    const cantidadMaletasPresentadas = Number(this.maletasPresentadas ?? 0);

    if (!vueloOperadoId || !segmentoOperadoId) {
      this.error = 'Selecciona un vuelo y segmento.';
      return;
    }

    if (!pasaporte) {
      this.error = 'Debe ingresar los campos obligatorios.';
      return;
    }

    if (cantidadMaletasPresentadas < 0) {
      this.error = 'La cantidad de maletas no puede ser negativa.';
      return;
    }

    this.sincronizarEquipajes();

    if (!this.equipajesValidos()) {
      this.error = 'Debe ingresar el peso de todas las maletas presentadas.';
      return;
    }

    this.cargando = true;

    this.abordaje
      .registrar({
        vueloOperadoId,
        segmentoOperadoId,
        pasaporte,
        cantidadMaletasPresentadas,
        equipajes: this.equipajes.map((e, index) => ({
          numeroMaleta: index + 1,
          peso: Number(e.peso)
        })),
        tipoAbordaje: 'MANUAL'
      })
      .subscribe({
        next: (res: AbordajeResponse) => {
          this.consulta = res;
          this.cargando = false;

          if (res?.requierePagoRecargo) {
            this.ok = null;
            this.aviso =
              res?.mensaje ||
              `Se generó recargo de equipaje por ${this.formatMoney(
                res?.recargoEquipaje
              )}. Confirma el pago para completar el abordaje.`;

            this.pagoRecargoForm.nombreCliente = res?.nombrePasajero || '';
            return;
          }

          this.ok =
            res?.mensaje ||
            (desdePagoRecargo
              ? 'Pago confirmado y abordaje registrado.'
              : 'Abordaje registrado correctamente.');
        },
        error: (err: any) => {
          this.error = this.apiError(
            err,
            'No se pudo registrar el abordaje. Verifica pago, check-in y estado del boleto.'
          );
          this.cargando = false;
        }
      });
  }

  private apiError(
    err: any,
    fallback: string
  ): string {
    return err?.error?.message ||
      err?.error?.error ||
      err?.error ||
      fallback;
  }

  private equipajesValidos(): boolean {
    const cantidad = Number(this.maletasPresentadas ?? 0);

    if (cantidad <= 0) {
      return true;
    }

    if (!this.equipajes || this.equipajes.length !== cantidad) {
      return false;
    }

    return this.equipajes.every((e) => {
      const peso = Number(e.peso);
      return !!peso && peso > 0;
    });
  }

  getRutaTexto(
    vuelo: AbordajeVueloPendienteResponse | null
  ): string {
    if (!vuelo) {
      return '-';
    }

    const salida = vuelo.aeropuertoSalidaCodigoIata || vuelo.aeropuertoSalidaNombre || '-';
    const llegada = vuelo.aeropuertoLlegadaCodigoIata || vuelo.aeropuertoLlegadaNombre || '-';

    return `${salida} → ${llegada}`;
  }

  getSegmentoTexto(
    vuelo: AbordajeVueloPendienteResponse | null
  ): string {
    if (!vuelo) {
      return '-';
    }

    return `Segmento ${vuelo.ordenSegmento || '-'} de ${vuelo.cantidadSegmentos || '-'}`;
  }

  getTipoTexto(
    vuelo: AbordajeVueloPendienteResponse | null
  ): string {
    return String(vuelo?.tipoSegmentoVuelo || 'DIRECTO').replace(/_/g, ' ');
  }

  formatMoney(
    value: any
  ): string {
    const amount = Number(value ?? 0);

    return amount.toLocaleString('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    });
  }
}
