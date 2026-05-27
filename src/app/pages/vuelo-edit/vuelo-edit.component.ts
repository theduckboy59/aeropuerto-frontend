import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CatalogoService } from '../../services/catalogo.service';
import { DestinoAutorizado, DestinosAutorizadosService } from '../../services/destinos-autorizados.service';
import { Vuelo, VueloRequest, VueloService } from '../../services/vuelo.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-vuelo-edit',
  templateUrl: './vuelo-edit.component.html',
  styleUrl: './vuelo-edit.component.css'
})
export class VueloEditComponent implements OnInit {

  private readonly ESTADO_ACTIVO_ID = 1;

  readonly fechaMinima = this.obtenerFechaMinima();

  id: number | null = null;

  aerolineas: any[] = [];
  aeropuertos: any[] = [];
  destinosAutorizados: DestinoAutorizado[] = [];
  aeropuertosAutorizados: any[] = [];

  form: any = this.getEmptyForm();

  codigoVuelo = '';

  cargando = false;
  cargandoDestinos = false;
  guardando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogo: CatalogoService,
    private destinosService: DestinosAutorizadosService,
    private vueloService: VueloService
  ) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? Number(raw) : NaN;

    if (!id || Number.isNaN(id)) {
      alert('ID inválido');
      this.regresar();
      return;
    }

    this.id = id;
    this.cargarTodo(id);
  }

  cargarTodo(id: number): void {
    this.cargando = true;

    forkJoin({
      aerolineas: this.catalogo.aerolineas(),
      aeropuertos: this.catalogo.aeropuertos(),
      vuelo: this.vueloService.obtener(id)
    }).subscribe({
      next: ({ aerolineas, aeropuertos, vuelo }) => {
        this.aerolineas = aerolineas ?? [];
        this.aeropuertos = aeropuertos ?? [];

        this.setForm(vuelo);

        const aerolineaId = this.toNumberOrNull(this.form.aerolineaId);

        if (aerolineaId) {
          this.cargarDestinosAutorizados(aerolineaId, false);
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando vuelo'));
        this.regresar();
      }
    });
  }

  setForm(vuelo: Vuelo): void {
    this.codigoVuelo = vuelo.codigoVuelo ?? '';

    this.form = {
      aerolineaId: vuelo.aerolineaId ?? '',
      aeropuertoSalidaId: vuelo.aeropuertoSalidaId ?? '',
      aeropuertoLlegadaId: vuelo.aeropuertoLlegadaId ?? '',
      puertaEmbarqueSalida: vuelo.puertaEmbarqueSalida ?? '',
      puertaEmbarqueLlegada: vuelo.puertaEmbarqueLlegada ?? '',
      fechaSalida: vuelo.fechaSalida ?? '',
      horaSalida: this.toInputTime(vuelo.horaSalida),
      fechaLlegada: vuelo.fechaLlegada ?? '',
      horaLlegada: this.toInputTime(vuelo.horaLlegada),
      precioEconomica: vuelo.precioEconomica ?? '',
      precioEjecutiva: vuelo.precioEjecutiva ?? ''
    };
  }

  onAerolineaChange(): void {
    this.form.aeropuertoSalidaId = '';
    this.form.aeropuertoLlegadaId = '';
    this.form.puertaEmbarqueSalida = '';
    this.form.puertaEmbarqueLlegada = '';

    this.destinosAutorizados = [];
    this.aeropuertosAutorizados = [];

    const aerolineaId = this.toNumberOrNull(this.form.aerolineaId);

    if (!aerolineaId) {
      return;
    }

    this.cargarDestinosAutorizados(aerolineaId, true);
  }

  cargarDestinosAutorizados(
    aerolineaId: number,
    limpiarAeropuertos: boolean
  ): void {
    this.cargandoDestinos = true;

    this.destinosService.listar({
      aerolineaId,
      estadoId: this.ESTADO_ACTIVO_ID
    }).subscribe({
      next: (destinos) => {
        this.destinosAutorizados = destinos ?? [];

        const idsAutorizados = new Set(
          this.destinosAutorizados.map((d) => Number(d.aeropuertoId))
        );

        this.aeropuertosAutorizados = this.aeropuertos
          .filter((a) => idsAutorizados.has(Number(a.id)));

        if (limpiarAeropuertos) {
          this.form.aeropuertoSalidaId = '';
          this.form.aeropuertoLlegadaId = '';
          this.form.puertaEmbarqueSalida = '';
          this.form.puertaEmbarqueLlegada = '';
        }

        this.cargandoDestinos = false;
      },
      error: (err) => {
        console.error(err);
        this.destinosAutorizados = [];
        this.aeropuertosAutorizados = [];
        this.cargandoDestinos = false;
        alert(getApiErrorMessage(err, 'Error cargando destinos autorizados'));
      }
    });
  }

  onAeropuertoSalidaChange(): void {
    this.form.puertaEmbarqueSalida = '';
  }

  onAeropuertoLlegadaChange(): void {
    this.form.puertaEmbarqueLlegada = '';
  }

  guardar(): void {
    if (!this.id) {
      alert('ID inválido');
      return;
    }

    const msg = this.validar();

    if (msg) {
      alert(msg);
      return;
    }

    const payload: VueloRequest = {
      aerolineaId: Number(this.form.aerolineaId),
      aeropuertoSalidaId: Number(this.form.aeropuertoSalidaId),
      aeropuertoLlegadaId: Number(this.form.aeropuertoLlegadaId),
      puertaEmbarqueSalida: this.cleanText(this.form.puertaEmbarqueSalida),
      puertaEmbarqueLlegada: this.cleanText(this.form.puertaEmbarqueLlegada),
      fechaSalida: this.form.fechaSalida,
      horaSalida: this.normalizarHora(this.form.horaSalida),
      fechaLlegada: this.form.fechaLlegada,
      horaLlegada: this.normalizarHora(this.form.horaLlegada),
      precioEconomica: Number(this.form.precioEconomica),
      precioEjecutiva: Number(this.form.precioEjecutiva)
    };

    this.guardando = true;

    this.vueloService.actualizar(this.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Vuelo actualizado correctamente');
        this.router.navigate(['/menu/aerolinea/vuelos']);
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        alert(getApiErrorMessage(err, 'Error al actualizar vuelo'));
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/vuelos']);
  }

  getPuertasSalida(): any[] {
    const aeropuerto = this.getAeropuertoById(this.form.aeropuertoSalidaId);

    return this.getPuertasActivas(aeropuerto);
  }

  getPuertasLlegada(): any[] {
    const aeropuerto = this.getAeropuertoById(this.form.aeropuertoLlegadaId);

    return this.getPuertasActivas(aeropuerto);
  }

  getAeropuertoLabel(aeropuerto: any): string {
    if (!aeropuerto) {
      return '-';
    }

    const codigoIata = aeropuerto.codigoIata ? ` (${aeropuerto.codigoIata})` : '';
    const codigoIcao = aeropuerto.codigoIcao ? ` / ${aeropuerto.codigoIcao}` : '';

    return `${aeropuerto.nombre ?? aeropuerto.aeropuertoNombre ?? aeropuerto.id}${codigoIata}${codigoIcao}`;
  }

  getPuertaLabel(puerta: any): string {
    return puerta?.codigo ?? String(puerta ?? '-');
  }

  private obtenerFechaMinima(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private validar(): string {
    if (!this.form.aerolineaId) {
      return 'Aerolínea obligatoria';
    }

    if (!this.form.aeropuertoSalidaId) {
      return 'Aeropuerto de salida obligatorio';
    }

    if (!this.form.aeropuertoLlegadaId) {
      return 'Aeropuerto de llegada obligatorio';
    }

    if (Number(this.form.aeropuertoSalidaId) === Number(this.form.aeropuertoLlegadaId)) {
      return 'No se puede seleccionar el mismo aeropuerto de salida y llegada.';
    }

    if (!this.cleanText(this.form.puertaEmbarqueSalida)) {
      return 'Puerta de embarque de salida obligatoria';
    }

    if (!this.cleanText(this.form.puertaEmbarqueLlegada)) {
      return 'Puerta de embarque de llegada obligatoria';
    }

    if (!this.form.fechaSalida) {
      return 'Fecha de salida obligatoria';
    }

    if (!this.form.horaSalida) {
      return 'Hora de salida obligatoria';
    }

    if (!this.form.fechaLlegada) {
      return 'Fecha de llegada obligatoria';
    }

    if (!this.form.horaLlegada) {
      return 'Hora de llegada obligatoria';
    }

    if (!this.form.precioEconomica) {
      return 'Precio de clase económica obligatorio';
    }

    if (!this.form.precioEjecutiva) {
      return 'Precio de clase ejecutiva obligatorio';
    }

    const precioEconomica = Number(this.form.precioEconomica);
    const precioEjecutiva = Number(this.form.precioEjecutiva);

    if (Number.isNaN(precioEconomica) || precioEconomica <= 0) {
      return 'El precio de clase económica debe ser mayor a 0';
    }

    if (Number.isNaN(precioEjecutiva) || precioEjecutiva <= 0) {
      return 'El precio de clase ejecutiva debe ser mayor a 0';
    }

    const salida = new Date(`${this.form.fechaSalida}T${this.normalizarHora(this.form.horaSalida)}`);
    const llegada = new Date(`${this.form.fechaLlegada}T${this.normalizarHora(this.form.horaLlegada)}`);

    if (Number.isNaN(salida.getTime()) || Number.isNaN(llegada.getTime())) {
      return 'Fecha u hora inválida';
    }

    if (llegada <= salida) {
      return 'La fecha y hora de llegada debe ser mayor a la fecha y hora de salida.';
    }

    const minimo = new Date();
    minimo.setHours(minimo.getHours() + 5);

    if (salida < minimo) {
      return 'Tiempo mínimo para la preparación 5 horas a partir de la hora actual.';
    }

    return '';
  }

  private getEmptyForm() {
    return {
      aerolineaId: '',
      aeropuertoSalidaId: '',
      aeropuertoLlegadaId: '',
      puertaEmbarqueSalida: '',
      puertaEmbarqueLlegada: '',
      fechaSalida: '',
      horaSalida: '',
      fechaLlegada: '',
      horaLlegada: '',
      precioEconomica: '',
      precioEjecutiva: ''
    };
  }

  private getAeropuertoById(id: any): any | null {
    const n = this.toNumberOrNull(id);

    if (!n) {
      return null;
    }

    return this.aeropuertos.find((a) => Number(a.id) === n) ?? null;
  }

  private getPuertasActivas(aeropuerto: any): any[] {
    const puertas = aeropuerto?.puertas ?? [];

    if (!Array.isArray(puertas)) {
      return [];
    }

    return puertas.filter((p) => {
      if (p?.estadoId === null || p?.estadoId === undefined) {
        return true;
      }

      return Number(p.estadoId) === this.ESTADO_ACTIVO_ID;
    });
  }

  private toInputTime(value: string | null | undefined): string {
    const hora = (value ?? '').toString().trim();

    if (!hora) {
      return '';
    }

    return hora.substring(0, 5);
  }

  private toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const n = Number(value);

    return Number.isNaN(n) ? null : n;
  }

  private cleanText(value: any): string {
    return (value ?? '').toString().trim().toUpperCase();
  }

  private normalizarHora(value: any): string {
    const hora = (value ?? '').toString().trim();

    if (!hora) {
      return '';
    }

    if (hora.length === 5) {
      return `${hora}:00`;
    }

    return hora;
  }
}