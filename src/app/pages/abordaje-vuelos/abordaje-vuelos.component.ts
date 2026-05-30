import { Component, OnInit } from '@angular/core';

import {
  AbordajeResponse,
  AbordajeService,
  FinalizarAbordajeResponse
} from '../../services/abordaje.service';

import { CatalogoService } from '../../services/catalogo.service';
import { PagoService } from '../../services/pago.service';
import { VueloOperado, VueloOperadoService } from '../../services/vuelo-operado.service';

@Component({
  selector: 'app-abordaje-vuelos',
  templateUrl: './abordaje-vuelos.component.html',
  styleUrl: './abordaje-vuelos.component.css'
})
export class AbordajeVuelosComponent implements OnInit {
  cargando = false;
  cargandoPago = false;
  iniciandoAbordaje = false;

  error: string | null = null;
  ok: string | null = null;
  aviso: string | null = null;

  estados: any[] = [];
  metodosPago: any[] = [];

  estadoVueloId = '';

  vuelos: VueloOperado[] = [];
  vueloSeleccionado: VueloOperado | null = null;

  pasaporte = '';
  maletasPresentadas = 0;

  consulta: AbordajeResponse | null = null;
  resultadoFinalizacion: FinalizarAbordajeResponse | null = null;

  pagoRecargoForm = {
    metodoPagoId: '',
    nit: 'CF',
    nombreCliente: ''
  };

  constructor(
    private vuelosOperados: VueloOperadoService,
    private abordaje: AbordajeService,
    private catalogos: CatalogoService,
    private pagos: PagoService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.listar();
  }

  get puedeBuscar(): boolean {
    return !!Number(this.vueloSeleccionado?.id) && !!this.pasaporte.trim();
  }

  get puedeRegistrar(): boolean {
    return this.puedeBuscar && Number(this.maletasPresentadas) >= 0 && !this.requierePagoRecargo;
  }

  get requierePagoRecargo(): boolean {
    return this.consulta?.requierePagoRecargo === true && !!Number(this.consulta?.pagoRecargoId);
  }

  get puedeConfirmarRecargo(): boolean {
    return this.requierePagoRecargo && !!Number(this.pagoRecargoForm.metodoPagoId);
  }

  get maletasExtra(): number {
    const presentadas = Number(this.consulta?.cantidadMaletasPresentadas ?? this.maletasPresentadas ?? 0);
    const registradas = Number(this.consulta?.cantidadMaletasRegistradas ?? 0);

    return Math.max(presentadas - registradas, 0);
  }

  cargarCatalogos(): void {
    this.vuelosOperados.listarEstadosVuelo().subscribe({
      next: (r: any[]) => {
        this.estados = r ?? [];

        /*
         * Para abordaje conviene iniciar viendo PROGRAMADO.
         * Al seleccionar, el front cambia el vuelo automáticamente a ABORDANDO.
         */
        this.estadoVueloId = this.obtenerEstadoIdTexto('PROGRAMADO') || '';
      },
      error: () => {
        this.estados = [];
      }
    });

    this.catalogos.metodoPago().subscribe({
      next: (r: any[]) => {
        this.metodosPago = r ?? [];
      },
      error: () => {
        this.metodosPago = [];
      }
    });
  }

  listar(): void {
    this.cargando = true;
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.resultadoFinalizacion = null;

    this.vueloSeleccionado = null;
    this.consulta = null;

    const filtros: any = {
      page: 0,
      size: 50
    };

    const estadoId = Number(this.estadoVueloId);

    if (estadoId) {
      filtros.estadoVueloId = estadoId;
    }

    this.vuelosOperados.listar(filtros).subscribe({
      next: (page: any) => {
        this.vuelos = page?.content ?? [];

        if (!this.vuelos.length) {
          this.aviso = 'No hay vuelos disponibles para abordaje.';
        }

        this.cargando = false;
      },
      error: (err: any) => {
        this.vuelos = [];
        this.error = err?.error?.message || 'No se pudieron cargar vuelos para abordaje.';
        this.cargando = false;
      }
    });
  }

  seleccionar(vuelo: VueloOperado): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.consulta = null;
    this.resultadoFinalizacion = null;

    this.pasaporte = '';
    this.maletasPresentadas = 0;

    this.pagoRecargoForm = {
      metodoPagoId: '',
      nit: 'CF',
      nombreCliente: ''
    };

    const vueloOperadoId = Number(vuelo?.id);

    if (!vueloOperadoId) {
      this.error = 'Vuelo operado inválido.';
      return;
    }

    const estadoActual = this.normalizar(this.getEstado(vuelo));

    if (estadoActual === 'ABORDANDO') {
      this.vueloSeleccionado = vuelo;
      this.ok = 'Vuelo listo para abordaje.';
      return;
    }

    if (
      estadoActual === 'EN_VUELO' ||
      estadoActual === 'ATERRIZADO' ||
      estadoActual === 'FINALIZADO' ||
      estadoActual === 'CANCELADO'
    ) {
      this.error = 'Este vuelo ya no puede iniciar abordaje.';
      return;
    }

    this.iniciarAbordaje(vuelo);
  }

  nuevoVuelo(): void {
    this.vueloSeleccionado = null;
    this.consulta = null;
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.resultadoFinalizacion = null;
    this.pasaporte = '';
    this.maletasPresentadas = 0;
  }

  buscarPasajero(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.consulta = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.id);
    const pasaporte = this.pasaporte.trim();

    if (!vueloOperadoId) {
      this.error = 'Selecciona un vuelo operado.';
      return;
    }

    if (!pasaporte) {
      this.error = 'Debe ingresar los campos obligatorios.';
      return;
    }

    this.cargando = true;

    this.abordaje.buscar({ vueloOperadoId, pasaporte }).subscribe({
      next: (res: AbordajeResponse) => {
        this.consulta = res;
        this.maletasPresentadas = Number(res?.cantidadMaletasRegistradas ?? 0);
        this.pagoRecargoForm.nombreCliente = res?.nombrePasajero || '';
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'El pasajero no se encuentra registrado en el vuelo.';
        this.cargando = false;
      }
    });
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
          this.error = err?.error?.message || 'No se pudo confirmar el pago del recargo.';
          this.cargandoPago = false;
        }
      });
  }

  finalizar(): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.resultadoFinalizacion = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.id);

    if (!vueloOperadoId) {
      this.error = 'Selecciona un vuelo.';
      return;
    }

    if (!confirm('¿Finalizar abordaje? Los boletos no abordados serán cancelados.')) {
      return;
    }

    this.cargando = true;

    this.abordaje.finalizar(vueloOperadoId).subscribe({
      next: (res: FinalizarAbordajeResponse) => {
        this.resultadoFinalizacion = res;
        this.ok = res?.mensaje || 'Se completó el abordaje.';
        this.cargando = false;
        this.vueloSeleccionado = null;
        this.consulta = null;
        this.listar();
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'No se pudo finalizar el abordaje.';
        this.cargando = false;
      }
    });
  }

  getRuta(vuelo: VueloOperado | null): string {
    if (!vuelo) {
      return '-';
    }

    const anyVuelo: any = vuelo;

    const salida =
      anyVuelo.aeropuertoSalidaCodigoIata ||
      anyVuelo.aeropuertoSalidaNombre ||
      '-';

    const llegada =
      anyVuelo.aeropuertoLlegadaCodigoIata ||
      anyVuelo.aeropuertoLlegadaNombre ||
      '-';

    return `${salida} → ${llegada}`;
  }

  getSalida(vuelo: VueloOperado | null): string {
    if (!vuelo) {
      return '-';
    }

    const anyVuelo: any = vuelo;
    const segmentoActual = this.getSegmentoActual(vuelo);

    const fecha =
      anyVuelo.fechaSalidaProgramada ||
      anyVuelo.fechaSalida ||
      segmentoActual?.fechaSalida ||
      '-';

    const hora =
      anyVuelo.horaSalidaProgramada ||
      anyVuelo.horaSalida ||
      segmentoActual?.horaSalida ||
      '';

    return `${fecha} ${hora}`.trim();
  }

  getEstado(vuelo: VueloOperado | null): string {
    if (!vuelo) {
      return '-';
    }

    const anyVuelo: any = vuelo;

    return anyVuelo.estadoVueloNombre || String(anyVuelo.estadoVueloId || '-');
  }

  getTipoVuelo(vuelo: VueloOperado | null): string {
    if (!vuelo) {
      return '-';
    }

    const anyVuelo: any = vuelo;

    return anyVuelo.tipoSegmentoVueloNombre || '-';
  }

  getSegmentoActual(vuelo: VueloOperado | null): any | null {
    const anyVuelo: any = vuelo;
    const segmentos = [...(anyVuelo?.segmentos ?? [])].sort(
      (a: any, b: any) => Number(a?.ordenSegmento ?? 0) - Number(b?.ordenSegmento ?? 0)
    );

    if (!segmentos.length) {
      return null;
    }

    const ordenActual = Number(anyVuelo?.segmentoActualOrden ?? 1);

    return segmentos.find((s: any) => Number(s?.ordenSegmento) === ordenActual) || segmentos[0];
  }

  getBadgeEstado(vuelo: VueloOperado | null): string {
    const estado = this.normalizar(this.getEstado(vuelo));

    if (estado.includes('ABORDANDO') || estado.includes('PENDIENTE')) {
      return 'state-pill state-open';
    }

    if (estado.includes('PROGRAMADO')) {
      return 'state-pill state-info';
    }

    if (estado.includes('EN_VUELO')) {
      return 'state-pill state-info';
    }

    if (estado.includes('CANCELADO')) {
      return 'state-pill state-danger';
    }

    if (estado.includes('FINALIZADO') || estado.includes('ATERRIZADO') || estado.includes('ABORDADO')) {
      return 'state-pill state-ok';
    }

    return 'state-pill';
  }

  formatMoney(value: any): string {
    const n = Number(value ?? 0);

    return `Q ${n.toFixed(2)}`;
  }

  private iniciarAbordaje(vuelo: VueloOperado): void {
    const vueloOperadoId = Number(vuelo?.id);

    if (!vueloOperadoId) {
      this.error = 'Vuelo operado inválido.';
      return;
    }

    const abordandoId = this.obtenerEstadoIdTexto('ABORDANDO');

    if (!abordandoId) {
      this.cargarEstadosEIniciarAbordaje(vuelo);
      return;
    }

    this.iniciandoAbordaje = true;
    this.cargando = true;

    this.vuelosOperados.cambiarEstado(vueloOperadoId, Number(abordandoId)).subscribe({
      next: (actualizado: VueloOperado) => {
        this.vueloSeleccionado = actualizado || {
          ...(vuelo as any),
          estadoVueloId: Number(abordandoId),
          estadoVueloNombre: 'ABORDANDO'
        };

        this.actualizarVueloEnListado(this.vueloSeleccionado);

        this.ok = 'Vuelo cambiado a ABORDANDO. Ya puedes buscar pasajeros.';
        this.iniciandoAbordaje = false;
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'No se pudo iniciar el abordaje del vuelo.';
        this.iniciandoAbordaje = false;
        this.cargando = false;
      }
    });
  }

  private cargarEstadosEIniciarAbordaje(vuelo: VueloOperado): void {
    this.cargando = true;

    this.vuelosOperados.listarEstadosVuelo().subscribe({
      next: (estados: any[]) => {
        this.estados = estados ?? [];
        this.cargando = false;

        const abordandoId = this.obtenerEstadoIdTexto('ABORDANDO');

        if (!abordandoId) {
          this.error = 'No existe el estado ABORDANDO en catálogo.';
          return;
        }

        this.iniciarAbordaje(vuelo);
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudo cargar el catálogo de estados de vuelo.';
      }
    });
  }

  private actualizarVueloEnListado(vueloActualizado: VueloOperado | null): void {
    if (!vueloActualizado?.id) {
      return;
    }

    this.vuelos = this.vuelos.map((v) => {
      if (Number(v.id) === Number(vueloActualizado.id)) {
        return vueloActualizado;
      }

      return v;
    });
  }

  private registrarAbordajeInterno(desdePagoRecargo: boolean): void {
    this.error = null;
    this.aviso = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.id);
    const pasaporte = this.pasaporte.trim();
    const cantidadMaletasPresentadas = Number(this.maletasPresentadas ?? 0);

    if (!vueloOperadoId) {
      this.error = 'Selecciona un vuelo operado.';
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

    this.cargando = true;

    this.abordaje
      .registrar({
        vueloOperadoId,
        pasaporte,
        cantidadMaletasPresentadas,
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

            return;
          }

          this.ok =
            res?.mensaje ||
            (desdePagoRecargo
              ? 'Pago confirmado y abordaje registrado.'
              : 'Abordaje registrado correctamente.');
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'No se pudo registrar el abordaje.';
          this.cargando = false;
        }
      });
  }

  private obtenerEstadoIdTexto(nombre: string): string {
    const buscado = this.normalizar(nombre);

    const estado = this.estados.find((e: any) => this.normalizar(e?.nombre) === buscado);

    return estado?.id ? String(estado.id) : '';
  }

  private normalizar(value: any): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }
}