import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  VueloOperado,
  VueloOperadoRequest,
  VueloOperadoService
} from '../../services/vuelo-operado.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

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
  avionesDisponibles: any[] = [];
  tripulacionesDisponibles: any[] = [];

  form = {
    vueloProgramadoId: '',
    avionId: '',
    tripulacionId: '',
    tipoSegmentoVueloId: '',
    cantidadTramos: '',
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
      vuelosProgramados: this.service.listarVuelosProgramadosActivos()
    }).subscribe({
      next: ({ vuelo, estados, tipos, vuelosProgramados }) => {
        this.vueloOperado = vuelo;
        this.estadosVuelo = estados ?? [];
        this.tiposSegmentoVuelo = tipos ?? [];
        this.vuelosProgramados = vuelosProgramados ?? [];

        this.agregarVueloActualSiNoExiste(vuelo);
        this.cargarForm(vuelo);
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
      avionId: vuelo?.avionId ? String(vuelo.avionId) : '',
      tripulacionId: vuelo?.tripulacionId ? String(vuelo.tripulacionId) : '',
      tipoSegmentoVueloId: vuelo?.tipoSegmentoVueloId ? String(vuelo.tipoSegmentoVueloId) : '',
      cantidadTramos: vuelo?.cantidadTramos ? String(vuelo.cantidadTramos) : '1',
      estadoVueloId: vuelo?.estadoVueloId ? String(vuelo.estadoVueloId) : ''
    };
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

        this.agregarAvionActualSiNoExiste(vuelo);
        this.agregarTripulacionActualSiNoExiste(vuelo);
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error cargando avión y tripulación'));
      }
    });
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

    const payload: VueloOperadoRequest = {
      vueloProgramadoId: Number(this.form.vueloProgramadoId),
      avionId: Number(this.form.avionId),
      tripulacionId: Number(this.form.tripulacionId),
      tipoSegmentoVueloId: Number(this.form.tipoSegmentoVueloId),
      cantidadTramos: Number(this.form.cantidadTramos)
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
        this.router.navigate(['/menu/aerolinea/vuelos-operados']);
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
    if (!this.form.avionId) return 'Debe seleccionar un avión';
    if (!this.form.tripulacionId) return 'Debe seleccionar una tripulación';
    if (!this.form.tipoSegmentoVueloId) return 'Debe seleccionar el tipo de vuelo';

    const cantidad = Number(this.form.cantidadTramos);

    if (this.esDirecto() && cantidad !== 1) {
      return 'Un vuelo directo solo puede tener 1 tramo';
    }

    if (!this.esDirecto() && (cantidad < 2 || cantidad > 3)) {
      return 'Los vuelos con escala deben tener entre 2 y 3 tramos';
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

  onTipoSegmentoChange(): void {
    if (this.esDirecto()) {
      this.form.cantidadTramos = '1';
      return;
    }

    if (!this.form.cantidadTramos || Number(this.form.cantidadTramos) < 2) {
      this.form.cantidadTramos = '2';
    }
  }

  esDirecto(): boolean {
    const tipo = this.tiposSegmentoVuelo.find((t) =>
      Number(t.id) === Number(this.form.tipoSegmentoVueloId)
    );

    return this.normalize(tipo?.nombre) === 'DIRECTO';
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/vuelos-operados']);
  }

  getEstadoVueloNombre(id: number): string {
    const estado = this.estadosVuelo.find((e) => Number(e.id) === Number(id));
    return estado?.nombre ?? String(id);
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

  private agregarVueloActualSiNoExiste(vuelo: VueloOperado): void {
    const existe = this.vuelosProgramados.some((v: any) =>
      Number(v.vueloProgramadoId) === Number(vuelo.vueloProgramadoId)
    );

    if (existe) return;

    this.vuelosProgramados.unshift({
      vueloProgramadoId: vuelo.vueloProgramadoId,
      codigoVuelo: vuelo.codigoVuelo,
      aerolineaId: vuelo.aerolineaId,
      aeropuertoSalidaNombre: vuelo.aeropuertoSalidaNombre,
      aeropuertoLlegadaNombre: vuelo.aeropuertoLlegadaNombre,
      fechaSalida: vuelo.fechaSalidaProgramada,
      horaSalida: vuelo.horaSalidaProgramada
    });
  }

  private agregarAvionActualSiNoExiste(vuelo: VueloOperado): void {
    const existe = this.avionesDisponibles.some((a) =>
      Number(a.id) === Number(vuelo.avionId)
    );

    if (existe) return;

    this.avionesDisponibles.unshift({
      id: vuelo.avionId,
      codigoAvion: vuelo.codigoAvion
    });
  }

  private agregarTripulacionActualSiNoExiste(vuelo: VueloOperado): void {
    const existe = this.tripulacionesDisponibles.some((t) =>
      Number(t.id) === Number(vuelo.tripulacionId)
    );

    if (existe) return;

    this.tripulacionesDisponibles.unshift({
      id: vuelo.tripulacionId,
      codigo: vuelo.codigoTripulacion,
      aerolineaNombre: vuelo.aerolineaNombre
    });
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