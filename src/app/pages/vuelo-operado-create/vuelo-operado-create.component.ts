import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Vuelo } from '../../services/vuelo.service';
import {
  VueloOperado,
  VueloOperadoRequest,
  VueloOperadoService
} from '../../services/vuelo-operado.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-vuelo-operado-create',
  templateUrl: './vuelo-operado-create.component.html',
  styleUrl: './vuelo-operado-create.component.css'
})
export class VueloOperadoCreateComponent implements OnInit {

  vuelosProgramados: Vuelo[] = [];
  vuelosProgramadosDisponibles: Vuelo[] = [];
  vuelosOperados: VueloOperado[] = [];

  avionesDisponibles: any[] = [];
  tripulacionesDisponibles: any[] = [];
  tiposSegmentoVuelo: any[] = [];

  form = {
    vueloProgramadoId: '',
    avionId: '',
    tripulacionId: '',
    tipoSegmentoVueloId: '',
    cantidadTramos: '1'
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
      tipos: this.service.listarTiposSegmentoVuelo()
    }).subscribe({
      next: ({ operados, vuelos, tipos }) => {
        this.vuelosOperados = operados?.content ?? [];
        this.vuelosProgramados = vuelos ?? [];
        this.tiposSegmentoVuelo = tipos ?? [];

        this.setTipoDirectoPorDefecto();
        this.filtrarVuelosDisponibles();

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
    this.form.avionId = '';
    this.form.tripulacionId = '';
    this.avionesDisponibles = [];
    this.tripulacionesDisponibles = [];

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
      this.form.cantidadTramos = '1';
      return;
    }

    if (!this.form.cantidadTramos || Number(this.form.cantidadTramos) < 2) {
      this.form.cantidadTramos = '2';
    }
  }

  guardar(): void {
    const msg = this.validar();

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

  setTipoDirectoPorDefecto(): void {
    const directo = (this.tiposSegmentoVuelo ?? [])
      .find((t: any) => this.normalize(t?.nombre) === 'DIRECTO');

    if (directo?.id) {
      this.form.tipoSegmentoVueloId = String(directo.id);
      this.form.cantidadTramos = '1';
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

  private normalize(value: any): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }
}