import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Vuelo } from '../../services/vuelo.service';
import {
  VueloOperado,
  VueloOperadoRequest,
  VueloOperadoSegmentoRequest,
  VueloOperadoService
} from '../../services/vuelo-operado.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

interface SegmentoForm {
  ordenSegmento: number;
  aeropuertoSalidaId: string;
  aeropuertoLlegadaId: string;
  fechaSalida: string;
  horaSalida: string;
  fechaLlegada: string;
  horaLlegada: string;
  avionId: string;
  tripulacionId: string;
}

@Component({
  selector: 'app-vuelo-operado-create',
  templateUrl: './vuelo-operado-create.component.html',
  styleUrl: './vuelo-operado-create.component.css'
})
export class VueloOperadoCreateComponent implements OnInit {

  readonly fechaMinima = this.obtenerFechaMinima();

  vuelosProgramados: Vuelo[] = [];
  vuelosProgramadosDisponibles: Vuelo[] = [];
  vuelosOperados: VueloOperado[] = [];

  aeropuertos: any[] = [];
  avionesDisponibles: any[] = [];
  tripulacionesDisponibles: any[] = [];
  tiposSegmentoVuelo: any[] = [];

  segmentos: SegmentoForm[] = [];

  form = {
    vueloProgramadoId: '',
    tipoSegmentoVueloId: '',
    cantidadSegmentos: '1'
  };

  cargando = false;
  guardando = false;

  constructor(
    private service: VueloOperadoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarInicial();
  }

  cargarInicial(): void {
    this.cargando = true;

    forkJoin({
      operados: this.service.listar({ page: 0, size: 1000 }),
      vuelos: this.service.listarVuelosProgramadosActivos(),
      tipos: this.service.listarTiposSegmentoVuelo(),
      aeropuertos: this.service.listarAeropuertos()
    }).subscribe({
      next: ({ operados, vuelos, tipos, aeropuertos }) => {
        this.vuelosOperados = operados?.content ?? [];
        this.vuelosProgramados = vuelos ?? [];
        this.tiposSegmentoVuelo = tipos ?? [];
        this.aeropuertos = aeropuertos ?? [];

        this.setTipoDirectoPorDefecto();
        this.filtrarVuelosDisponibles();
        this.reconstruirSegmentos();

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando datos'));
      }
    });
  }

  filtrarVuelosDisponibles(): void {
    const usados = new Set(
      (this.vuelosOperados ?? [])
        .map((v) => Number(v.vueloProgramadoId))
        .filter(Boolean)
    );

    this.vuelosProgramadosDisponibles = (this.vuelosProgramados ?? [])
      .filter((v: any) => !usados.has(Number(v.vueloProgramadoId)));
  }

  onVueloProgramadoChange(): void {
    this.avionesDisponibles = [];
    this.tripulacionesDisponibles = [];
    this.reconstruirSegmentos(true);

    const vuelo = this.getVueloSeleccionado();

    if (!vuelo?.aerolineaId) {
      return;
    }

    this.cargando = true;

    forkJoin({
      aviones: this.service.listarAvionesDisponibles(Number(vuelo.aerolineaId)),
      tripulaciones: this.service.listarTripulacionesDisponibles(Number(vuelo.aerolineaId))
    }).subscribe({
      next: ({ aviones, tripulaciones }) => {
        this.avionesDisponibles = aviones ?? [];
        this.tripulacionesDisponibles = tripulaciones ?? [];
        this.reconstruirSegmentos(true);
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando avión y tripulación'));
      }
    });
  }

  onTipoSegmentoChange(): void {
    if (this.esDirecto()) {
      this.form.cantidadSegmentos = '1';
    } else if (!this.form.cantidadSegmentos || Number(this.form.cantidadSegmentos) < 2) {
      this.form.cantidadSegmentos = '2';
    }

    this.reconstruirSegmentos();
  }

  onCantidadSegmentosChange(): void {
    this.reconstruirSegmentos();
  }

  onLlegadaSegmentoChange(index: number): void {
    const actual = this.segmentos[index];
    const siguiente = this.segmentos[index + 1];

    if (actual && siguiente) {
      siguiente.aeropuertoSalidaId = actual.aeropuertoLlegadaId;
    }
  }

  onRecursoBaseChange(): void {
    if (this.esDirecto() || this.esTecnico()) {
      this.sincronizarRecursosBase();
    }
  }

  private obtenerFechaMinima(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  guardar(): void {
    const msg = this.validar();

    if (msg) {
      alert(msg);
      return;
    }

    this.sincronizarRecursosBase();

    const payload: VueloOperadoRequest = {
      vueloProgramadoId: Number(this.form.vueloProgramadoId),
      tipoSegmentoVueloId: Number(this.form.tipoSegmentoVueloId),
      cantidadSegmentos: Number(this.form.cantidadSegmentos),
      segmentos: this.segmentos.map((s): VueloOperadoSegmentoRequest => ({
        ordenSegmento: Number(s.ordenSegmento),
        aeropuertoSalidaId: Number(s.aeropuertoSalidaId),
        aeropuertoLlegadaId: Number(s.aeropuertoLlegadaId),
        fechaSalida: s.fechaSalida,
        horaSalida: s.horaSalida,
        fechaLlegada: s.fechaLlegada,
        horaLlegada: s.horaLlegada,
        avionId: Number(s.avionId),
        tripulacionId: Number(s.tripulacionId)
      }))
    };

    this.guardando = true;

    this.service.crear(payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Vuelo operado creado correctamente');
        this.router.navigate(['/menu/aerolinea/vuelos-operados']);
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        alert(getApiErrorMessage(err, 'Error al crear vuelo operado'));
      }
    });
  }

  validar(): string {
    if (!this.form.vueloProgramadoId) return 'Debe seleccionar un vuelo programado';
    if (!this.form.tipoSegmentoVueloId) return 'Debe seleccionar el tipo de vuelo';

    const cantidad = Number(this.form.cantidadSegmentos);

    if (this.esDirecto() && cantidad !== 1) {
      return 'Un vuelo directo solo puede tener 1 segmento';
    }

    if (!this.esDirecto() && (cantidad < 2 || cantidad > 3)) {
      return 'Los vuelos con escala deben tener entre 2 y 3 segmentos';
    }

    if (this.segmentos.length !== cantidad) {
      return 'La cantidad de segmentos no coincide con el detalle ingresado';
    }

    for (const s of this.segmentos) {
      if (
        !s.aeropuertoSalidaId ||
        !s.aeropuertoLlegadaId ||
        !s.fechaSalida ||
        !s.horaSalida ||
        !s.fechaLlegada ||
        !s.horaLlegada ||
        !s.avionId ||
        !s.tripulacionId
      ) {
        return `Debe completar todos los datos del segmento ${s.ordenSegmento}`;
      }

      if (Number(s.aeropuertoSalidaId) === Number(s.aeropuertoLlegadaId)) {
        return `El segmento ${s.ordenSegmento} no puede tener el mismo aeropuerto de salida y llegada`;
      }
    }

    for (let i = 0; i < this.segmentos.length - 1; i++) {
      if (Number(this.segmentos[i].aeropuertoLlegadaId) !== Number(this.segmentos[i + 1].aeropuertoSalidaId)) {
        return 'Los segmentos deben estar conectados por aeropuerto';
      }
    }

    if (this.esTecnico()) {
      const avionBase = this.segmentos[0]?.avionId;
      const tripulacionBase = this.segmentos[0]?.tripulacionId;

      if (this.segmentos.some((s) => s.avionId !== avionBase)) {
        return 'Una escala técnica debe usar el mismo avión en todos los segmentos';
      }

      if (this.segmentos.some((s) => s.tripulacionId !== tripulacionBase)) {
        return 'Una escala técnica debe usar la misma tripulación en todos los segmentos';
      }
    }

    if (this.esCambioAvion()) {
      const avionBase = this.segmentos[0]?.avionId;
      const hayCambio = this.segmentos.some((s) => s.avionId && s.avionId !== avionBase);

      if (!hayCambio) {
        return 'Un vuelo con cambio de avión debe tener al menos un segmento con avión distinto';
      }
    }

    return '';
  }

  reconstruirSegmentos(reset = false): void {
    const vuelo = this.getVueloSeleccionado();
    const cantidad = Number(this.form.cantidadSegmentos || 1);
    const nuevos: SegmentoForm[] = [];

    for (let i = 0; i < cantidad; i++) {
      const previo = reset ? null : this.segmentos[i];
      const anterior = nuevos[i - 1];

      const salida = i === 0
        ? vuelo?.aeropuertoSalidaId
        : anterior?.aeropuertoLlegadaId;

      const llegada = i === cantidad - 1
        ? vuelo?.aeropuertoLlegadaId
        : previo?.aeropuertoLlegadaId;

      nuevos.push({
        ordenSegmento: i + 1,
        aeropuertoSalidaId: this.toText(salida),
        aeropuertoLlegadaId: this.toText(llegada),
        fechaSalida: previo?.fechaSalida || (i === 0 ? this.toText(vuelo?.fechaSalida) : ''),
        horaSalida: previo?.horaSalida || (i === 0 ? this.toTime(vuelo?.horaSalida) : ''),
        fechaLlegada: previo?.fechaLlegada || (i === cantidad - 1 ? this.toText(vuelo?.fechaLlegada) : ''),
        horaLlegada: previo?.horaLlegada || (i === cantidad - 1 ? this.toTime(vuelo?.horaLlegada) : ''),
        avionId: previo?.avionId || this.getAvionDefault(i),
        tripulacionId: previo?.tripulacionId || this.getTripulacionDefault(i)
      });
    }

    this.segmentos = nuevos;
    this.sincronizarRecursosBase();
  }

  sincronizarRecursosBase(): void {
    if (!this.segmentos.length) return;

    if (!this.esDirecto() && !this.esTecnico()) {
      return;
    }

    const avionBase = this.segmentos[0].avionId;
    const tripulacionBase = this.segmentos[0].tripulacionId;

    this.segmentos.forEach((s) => {
      s.avionId = avionBase;
      s.tripulacionId = tripulacionBase;
    });
  }

  isSalidaFija(_index: number): boolean {
    return true;
  }

  isLlegadaFija(index: number): boolean {
    return index === this.segmentos.length - 1;
  }

  recursoBloqueado(index: number): boolean {
    return index > 0 && (this.esDirecto() || this.esTecnico());
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/vuelos-operados']);
  }

  getVueloSeleccionado(): any {
    const id = Number(this.form.vueloProgramadoId);

    return (this.vuelosProgramadosDisponibles ?? [])
      .find((v: any) => Number(v.vueloProgramadoId) === id);
  }

  getTipoSeleccionado(): any {
    const id = Number(this.form.tipoSegmentoVueloId);

    return (this.tiposSegmentoVuelo ?? [])
      .find((t: any) => Number(t.id) === id);
  }

  esDirecto(): boolean {
    return this.normalize(this.getTipoSeleccionado()?.nombre) === 'DIRECTO';
  }

  esTecnico(): boolean {
    return this.normalize(this.getTipoSeleccionado()?.nombre) === 'TECNICO';
  }

  esCambioAvion(): boolean {
    return this.normalize(this.getTipoSeleccionado()?.nombre) === 'CAMBIO_AVION';
  }

  setTipoDirectoPorDefecto(): void {
    const directo = (this.tiposSegmentoVuelo ?? [])
      .find((t: any) => this.normalize(t?.nombre) === 'DIRECTO');

    if (directo?.id) {
      this.form.tipoSegmentoVueloId = String(directo.id);
      this.form.cantidadSegmentos = '1';
    }
  }

  getVueloLabel(vuelo: any): string {
    if (!vuelo) return '-';

    const codigo = vuelo.codigoVuelo || `VP-${vuelo.vueloProgramadoId}`;
    const salida = vuelo.aeropuertoSalidaNombre || vuelo.aeropuertoSalidaCodigoIata || '-';
    const llegada = vuelo.aeropuertoLlegadaNombre || vuelo.aeropuertoLlegadaCodigoIata || '-';
    const fecha = vuelo.fechaSalida || '-';
    const hora = vuelo.horaSalida || '-';

    return `${codigo} | ${salida} → ${llegada} | ${fecha} ${hora}`;
  }

  getAeropuertoLabel(aeropuerto: any): string {
    if (!aeropuerto) return '-';

    const codigo = aeropuerto.codigoIata || aeropuerto.codigoIcao || aeropuerto.id;
    const nombre = aeropuerto.nombre || '';

    return `${codigo} - ${nombre}`;
  }

  getAvionLabel(avion: any): string {
    if (!avion) return '-';

    return `${avion.codigoAvion || avion.id} - ${avion.modeloNombre || avion.modeloCodigo || ''}`;
  }

  getTripulacionLabel(tripulacion: any): string {
    if (!tripulacion) return '-';

    return `${tripulacion.codigo || tripulacion.id} - ${tripulacion.aerolineaNombre || ''}`;
  }

  getTipoLabel(tipo: any): string {
    const nombre = tipo?.nombre || '-';

    if (this.normalize(nombre) === 'DIRECTO') return 'DIRECTO - sin escala';
    if (this.normalize(nombre) === 'TECNICO') return 'TÉCNICO - escala técnica';
    if (this.normalize(nombre) === 'CAMBIO_AVION') return 'CAMBIO AVIÓN - requiere nuevo asiento';

    return nombre;
  }

  private getAvionDefault(index: number): string {
    if (index > 0 && (this.esDirecto() || this.esTecnico())) {
      return this.segmentos[0]?.avionId || '';
    }

    return '';
  }

  private getTripulacionDefault(index: number): string {
    if (index > 0 && (this.esDirecto() || this.esTecnico())) {
      return this.segmentos[0]?.tripulacionId || '';
    }

    return '';
  }

  private toText(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  private toTime(value: any): string {
    const text = this.toText(value);
    return text.length >= 5 ? text.substring(0, 5) : text;
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