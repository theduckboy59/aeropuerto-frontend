import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  SegmentoOperado,
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
  selector: 'app-vuelo-operado-edit',
  templateUrl: './vuelo-operado-edit.component.html',
  styleUrl: './vuelo-operado-edit.component.css'
})
export class VueloOperadoEditComponent implements OnInit {

  id: number | null = null;
  vueloOperado: VueloOperado | null = null;

  estadosVuelo: any[] = [];
  tiposSegmentoVuelo: any[] = [];
  vuelosProgramados: any[] = [];
  aeropuertos: any[] = [];
  avionesDisponibles: any[] = [];
  tripulacionesDisponibles: any[] = [];

  segmentos: SegmentoForm[] = [];

  form = {
    vueloProgramadoId: '',
    tipoSegmentoVueloId: '',
    cantidadSegmentos: '1',
    estadoVueloId: ''
  };

  cargando = false;
  guardandoDatos = false;
  guardandoEstado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: VueloOperadoService
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
    this.cargar(id);
  }

  cargar(id: number): void {
    this.cargando = true;

    forkJoin({
      vuelo: this.service.obtener(id),
      estados: this.service.listarEstadosVuelo(),
      tipos: this.service.listarTiposSegmentoVuelo(),
      vuelosProgramados: this.service.listarVuelosProgramadosActivos(),
      aeropuertos: this.service.listarAeropuertos()
    }).subscribe({
      next: ({ vuelo, estados, tipos, vuelosProgramados, aeropuertos }) => {
        this.vueloOperado = vuelo;
        this.estadosVuelo = estados ?? [];
        this.tiposSegmentoVuelo = tipos ?? [];
        this.vuelosProgramados = vuelosProgramados ?? [];
        this.aeropuertos = aeropuertos ?? [];

        this.agregarVueloActualSiNoExiste(vuelo);
        this.cargarForm(vuelo);
        this.cargarSegmentosDesdeVuelo(vuelo);
        this.cargarRecursos(vuelo);

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando vuelo operado'));
        this.regresar();
      }
    });
  }

  cargarForm(vuelo: VueloOperado): void {
    this.form = {
      vueloProgramadoId: vuelo?.vueloProgramadoId ? String(vuelo.vueloProgramadoId) : '',
      tipoSegmentoVueloId: vuelo?.tipoSegmentoVueloId ? String(vuelo.tipoSegmentoVueloId) : '',
      cantidadSegmentos: vuelo?.cantidadSegmentos ? String(vuelo.cantidadSegmentos) : '1',
      estadoVueloId: vuelo?.estadoVueloId ? String(vuelo.estadoVueloId) : ''
    };
  }

  cargarSegmentosDesdeVuelo(vuelo: VueloOperado): void {
    const segmentos = [...(vuelo.segmentos ?? [])]
      .sort((a, b) => Number(a.ordenSegmento || 0) - Number(b.ordenSegmento || 0));

    this.segmentos = segmentos.map((s: SegmentoOperado) => ({
      ordenSegmento: Number(s.ordenSegmento),
      aeropuertoSalidaId: this.toText(s.aeropuertoSalidaId),
      aeropuertoLlegadaId: this.toText(s.aeropuertoLlegadaId),
      fechaSalida: this.toText(s.fechaSalida),
      horaSalida: this.toTime(s.horaSalida),
      fechaLlegada: this.toText(s.fechaLlegada),
      horaLlegada: this.toTime(s.horaLlegada),
      avionId: this.toText(s.avionId),
      tripulacionId: this.toText(s.tripulacionId)
    }));

    if (!this.segmentos.length) {
      this.reconstruirSegmentos(true);
    }
  }

  cargarRecursos(vuelo: VueloOperado): void {
    if (!vuelo?.aerolineaId) {
      return;
    }

    forkJoin({
      aviones: this.service.listarAvionesDisponibles(Number(vuelo.aerolineaId)),
      tripulaciones: this.service.listarTripulacionesDisponibles(Number(vuelo.aerolineaId))
    }).subscribe({
      next: ({ aviones, tripulaciones }) => {
        this.avionesDisponibles = aviones ?? [];
        this.tripulacionesDisponibles = tripulaciones ?? [];

        this.agregarRecursosActuales(vuelo);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error cargando avión y tripulación'));
      }
    });
  }

  onVueloProgramadoChange(): void {
    this.reconstruirSegmentos(true);

    const vuelo = this.getVueloSeleccionado();

    if (!vuelo?.aerolineaId) return;

    forkJoin({
      aviones: this.service.listarAvionesDisponibles(Number(vuelo.aerolineaId)),
      tripulaciones: this.service.listarTripulacionesDisponibles(Number(vuelo.aerolineaId))
    }).subscribe({
      next: ({ aviones, tripulaciones }) => {
        this.avionesDisponibles = aviones ?? [];
        this.tripulacionesDisponibles = tripulaciones ?? [];
      },
      error: (err) => {
        console.error(err);
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

  guardarDatos(): void {
    if (!this.id) return;

    if (!this.puedeEditarDatos()) {
      alert('Solo se puede editar un vuelo operado en estado PROGRAMADO o CANCELADO');
      return;
    }

    const msg = this.validarDatos();

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

    this.guardandoDatos = true;

    this.service.actualizar(this.id, payload).subscribe({
      next: () => {
        this.guardandoDatos = false;
        alert('Datos actualizados correctamente');
        this.cargar(this.id!);
      },
      error: (err) => {
        console.error(err);
        this.guardandoDatos = false;
        alert(getApiErrorMessage(err, 'Error al actualizar datos'));
      }
    });
  }

  guardarEstado(): void {
    if (!this.id) return;

    const nuevoEstado = Number(this.form.estadoVueloId);

    if (!nuevoEstado) {
      alert('Debe seleccionar un estado');
      return;
    }

    if (!confirm(`¿Cambiar estado a ${this.getEstadoVueloNombre(nuevoEstado)}?`)) {
      return;
    }

    this.guardandoEstado = true;

    this.service.cambiarEstado(this.id, nuevoEstado).subscribe({
      next: () => {
        this.guardandoEstado = false;
        alert('Estado actualizado correctamente');
        this.cargar(this.id!);
      },
      error: (err) => {
        console.error(err);
        this.guardandoEstado = false;
        alert(getApiErrorMessage(err, 'Error al cambiar estado'));
      }
    });
  }

  validarDatos(): string {
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

  getEstadosPermitidos(): any[] {
    if (!this.vueloOperado) return [];

    const actual = this.normalize(this.vueloOperado.estadoVueloNombre);
    let nombresPermitidos: string[] = [];

    if (actual === 'PROGRAMADO') {
      nombresPermitidos = ['ABORDANDO', 'RETRASADO', 'CANCELADO'];
    }

    if (actual === 'ABORDANDO') {
      nombresPermitidos = ['EN_VUELO', 'RETRASADO', 'CANCELADO'];
    }

    if (actual === 'RETRASADO') {
      nombresPermitidos = ['PROGRAMADO', 'ABORDANDO', 'EN_VUELO', 'CANCELADO'];
    }

    if (actual === 'EN_VUELO') {
      nombresPermitidos = ['ATERRIZADO'];
    }

    if (actual === 'EN_ESCALA') {
      const tipo = this.normalize(this.vueloOperado.tipoSegmentoVueloNombre);

      if (tipo === 'TECNICO') {
        nombresPermitidos = ['EN_VUELO'];
      }

      if (tipo === 'CAMBIO_AVION') {
        nombresPermitidos = ['ABORDANDO'];
      }
    }

    if (actual === 'ATERRIZADO' && this.vueloOperado.puedeFinalizar) {
      nombresPermitidos = ['FINALIZADO'];
    }

    if (actual === 'CANCELADO') {
      nombresPermitidos = ['PROGRAMADO'];
    }

    return this.estadosVuelo.filter((e) =>
      nombresPermitidos.includes(this.normalize(e?.nombre))
    );
  }

  puedeEditarDatos(): boolean {
    if (this.vueloOperado?.puedeEditarDatos !== null && this.vueloOperado?.puedeEditarDatos !== undefined) {
      return Boolean(this.vueloOperado.puedeEditarDatos);
    }

    const estado = this.normalize(this.vueloOperado?.estadoVueloNombre);
    return estado === 'PROGRAMADO' || estado === 'CANCELADO';
  }

  estaCerrado(): boolean {
    const estado = this.normalize(this.vueloOperado?.estadoVueloNombre);
    return estado === 'FINALIZADO';
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
        avionId: previo?.avionId || '',
        tripulacionId: previo?.tripulacionId || ''
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

  getEstadoVueloNombre(id: number): string {
    const estado = this.estadosVuelo.find((e) => Number(e.id) === Number(id));
    return estado?.nombre ?? String(id);
  }

  getVueloSeleccionado(): any {
    const id = Number(this.form.vueloProgramadoId);

    return (this.vuelosProgramados ?? [])
      .find((v: any) => Number(v.vueloProgramadoId) === id);
  }

  getVueloLabel(vuelo: any): string {
    if (!vuelo) return '-';

    const codigo = vuelo.codigoVuelo || `VP-${vuelo.vueloProgramadoId}`;
    const salida = vuelo.aeropuertoSalidaNombre || vuelo.aeropuertoSalidaCodigoIata || '-';
    const llegada = vuelo.aeropuertoLlegadaNombre || vuelo.aeropuertoLlegadaCodigoIata || '-';
    const fecha = vuelo.fechaSalida || vuelo.fechaSalidaProgramada || '-';
    const hora = vuelo.horaSalida || vuelo.horaSalidaProgramada || '-';

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

  private agregarVueloActualSiNoExiste(vuelo: VueloOperado): void {
    const existe = this.vuelosProgramados.some((v: any) =>
      Number(v.vueloProgramadoId) === Number(vuelo.vueloProgramadoId)
    );

    if (existe) return;

    this.vuelosProgramados.unshift({
      vueloProgramadoId: vuelo.vueloProgramadoId,
      codigoVuelo: vuelo.codigoVuelo,
      aerolineaId: vuelo.aerolineaId,
      aeropuertoSalidaId: vuelo.aeropuertoSalidaId,
      aeropuertoSalidaNombre: vuelo.aeropuertoSalidaNombre,
      aeropuertoSalidaCodigoIata: vuelo.aeropuertoSalidaCodigoIata,
      aeropuertoLlegadaId: vuelo.aeropuertoLlegadaId,
      aeropuertoLlegadaNombre: vuelo.aeropuertoLlegadaNombre,
      aeropuertoLlegadaCodigoIata: vuelo.aeropuertoLlegadaCodigoIata,
      fechaSalida: vuelo.fechaSalidaProgramada,
      horaSalida: vuelo.horaSalidaProgramada,
      fechaLlegada: vuelo.fechaLlegadaProgramada,
      horaLlegada: vuelo.horaLlegadaProgramada
    });
  }

  private agregarRecursosActuales(vuelo: VueloOperado): void {
    (vuelo.segmentos ?? []).forEach((s) => {
      if (s.avionId && !this.avionesDisponibles.some((a) => Number(a.id) === Number(s.avionId))) {
        this.avionesDisponibles.unshift({
          id: s.avionId,
          codigoAvion: s.codigoAvion
        });
      }

      if (s.tripulacionId && !this.tripulacionesDisponibles.some((t) => Number(t.id) === Number(s.tripulacionId))) {
        this.tripulacionesDisponibles.unshift({
          id: s.tripulacionId,
          codigo: s.codigoTripulacion,
          aerolineaNombre: vuelo.aerolineaNombre
        });
      }
    });
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