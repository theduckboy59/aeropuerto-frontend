import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CatalogoService } from '../../services/catalogo.service';
import { DestinoAutorizado, DestinosAutorizadosService } from '../../services/destinos-autorizados.service';
import { VueloRequest, VueloService } from '../../services/vuelo.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-vuelo-create',
  templateUrl: './vuelo-create.component.html',
  styleUrl: './vuelo-create.component.css'
})
export class VueloCreateComponent implements OnInit {

  private readonly ESTADO_ACTIVO_ID = 1;

  aerolineas: any[] = [];
  destinosAutorizados: DestinoAutorizado[] = [];
  aeropuertosAutorizados: any[] = [];

  form: any = this.getEmptyForm();

  cargando = false;
  cargandoDestinos = false;
  guardando = false;

  constructor(
    private catalogo: CatalogoService,
    private destinosService: DestinosAutorizadosService,
    private vueloService: VueloService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargando = true;

    this.catalogo.aerolineas().subscribe({
      next: (aerolineas) => {
        this.aerolineas = aerolineas ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.aerolineas = [];
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando aerolíneas'));
      }
    });
  }

  onAerolineaChange(): void {
    this.form.aeropuertoSalidaId = '';
    this.form.aeropuertoLlegadaId = '';
    this.destinosAutorizados = [];
    this.aeropuertosAutorizados = [];

    const aerolineaId = this.toNumberOrNull(this.form.aerolineaId);

    if (!aerolineaId) {
      return;
    }

    this.cargarDestinosAutorizados(aerolineaId);
  }

  cargarDestinosAutorizados(aerolineaId: number): void {
    this.cargandoDestinos = true;

    this.destinosService.listar({
      aerolineaId,
      estadoId: this.ESTADO_ACTIVO_ID
    }).subscribe({
      next: (destinos) => {
        this.destinosAutorizados = destinos ?? [];
        this.aeropuertosAutorizados = this.mapDestinosToAeropuertos(this.destinosAutorizados);
        this.cargandoDestinos = false;

        if (!this.aeropuertosAutorizados.length) {
          alert('No se encontraron aeropuertos autorizados para la aerolínea.');
        }
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

  guardar(): void {
    const mensaje = this.validar();

    if (mensaje) {
      alert(mensaje);
      return;
    }

    const payload: VueloRequest = {
      aerolineaId: this.toNumberOrNull(this.form.aerolineaId),
      aeropuertoSalidaId: this.toNumberOrNull(this.form.aeropuertoSalidaId),
      aeropuertoLlegadaId: this.toNumberOrNull(this.form.aeropuertoLlegadaId),
      fechaSalida: this.form.fechaSalida,
      horaSalida: this.form.horaSalida,
      fechaLlegada: this.form.fechaLlegada,
      horaLlegada: this.form.horaLlegada
    };

    this.guardando = true;

    this.vueloService.crear(payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Vuelo creado correctamente');
        this.router.navigate(['/menu/aerolinea/vuelos']);
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        alert(getApiErrorMessage(err, 'Error al crear vuelo'));
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/vuelos']);
  }

  getAeropuertoLabel(aeropuerto: any): string {
    if (!aeropuerto) {
      return '-';
    }

    const nombre = aeropuerto.nombre ?? aeropuerto.aeropuertoNombre ?? aeropuerto.descripcion ?? aeropuerto.label ?? '';
    const codigoIata = aeropuerto.codigoIata ?? aeropuerto.aeropuertoCodigoIata ?? '';
    const codigoIcao = aeropuerto.codigoIcao ?? aeropuerto.aeropuertoCodigoIcao ?? '';
    const pais = aeropuerto.pais ?? '';

    const codigos = [codigoIata, codigoIcao]
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .join('/');

    const base = nombre || `Aeropuerto ${aeropuerto.id ?? ''}`;

    if (codigos && pais) {
      return `${base} (${codigos}) - ${pais}`;
    }

    if (codigos) {
      return `${base} (${codigos})`;
    }

    if (pais) {
      return `${base} - ${pais}`;
    }

    return base;
  }

  private validar(): string {
    if (!this.toNumberOrNull(this.form.aerolineaId)) {
      return 'Debe seleccionar una aerolínea';
    }

    if (!this.aeropuertosAutorizados.length) {
      return 'No se encontraron aeropuertos autorizados para la aerolínea.';
    }

    if (!this.toNumberOrNull(this.form.aeropuertoSalidaId)) {
      return 'Debe seleccionar el aeropuerto de salida';
    }

    if (!this.form.fechaSalida) {
      return 'Debe seleccionar la fecha de salida';
    }

    if (!this.form.horaSalida) {
      return 'Debe seleccionar la hora de salida';
    }

    if (!this.toNumberOrNull(this.form.aeropuertoLlegadaId)) {
      return 'Debe seleccionar el aeropuerto de llegada';
    }

    if (!this.form.fechaLlegada) {
      return 'Debe seleccionar la fecha de llegada';
    }

    if (!this.form.horaLlegada) {
      return 'Debe seleccionar la hora de llegada';
    }

    if (Number(this.form.aeropuertoSalidaId) === Number(this.form.aeropuertoLlegadaId)) {
      return 'No se puede seleccionar el mismo aeropuerto de salida y llegada.';
    }

    const salida = this.buildDateTime(this.form.fechaSalida, this.form.horaSalida);
    const llegada = this.buildDateTime(this.form.fechaLlegada, this.form.horaLlegada);

    if (!salida || !llegada) {
      return 'Debe ingresar fechas y horas válidas';
    }

    if (llegada.getTime() <= salida.getTime()) {
      return 'La fecha y hora de llegada debe ser mayor a la fecha y hora de salida.';
    }

    const minimoPermitido = new Date();
    minimoPermitido.setHours(minimoPermitido.getHours() + 5);

    if (salida.getTime() < minimoPermitido.getTime()) {
      return 'Tiempo mínimo para la preparación 5 horas a partir de la hora actual.';
    }

    return '';
  }

  private mapDestinosToAeropuertos(destinos: DestinoAutorizado[]): any[] {
    const map = new Map<number, any>();

    (destinos ?? []).forEach((d) => {
      const id = Number(d.aeropuertoId);

      if (!id || map.has(id)) {
        return;
      }

      map.set(id, {
        id,
        nombre: d.aeropuertoNombre ?? `Aeropuerto ${id}`,
        pais: d.pais ?? ''
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      this.getAeropuertoLabel(a).localeCompare(this.getAeropuertoLabel(b))
    );
  }

  private getEmptyForm() {
    return {
      aerolineaId: '',
      aeropuertoSalidaId: '',
      aeropuertoLlegadaId: '',
      fechaSalida: '',
      horaSalida: '',
      fechaLlegada: '',
      horaLlegada: ''
    };
  }

  private toNumberOrNull(value: any): number | null {
    const text = String(value ?? '').trim();

    if (!text) {
      return null;
    }

    const number = Number(text);

    return Number.isNaN(number) ? null : number;
  }

  private buildDateTime(fecha: string, hora: string): Date | null {
    if (!fecha || !hora) {
      return null;
    }

    const date = new Date(`${fecha}T${hora}:00`);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}