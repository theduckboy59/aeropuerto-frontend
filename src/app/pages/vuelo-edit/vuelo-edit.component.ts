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

  id: number | null = null;

  aerolineas: any[] = [];
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
      vuelo: this.vueloService.obtener(id)
    }).subscribe({
      next: ({ aerolineas, vuelo }) => {
        this.aerolineas = aerolineas ?? [];
        this.setForm(vuelo);

        this.cargando = false;

        const aerolineaId = this.toNumberOrNull(this.form.aerolineaId);

        if (aerolineaId) {
          this.cargarDestinosAutorizados(aerolineaId, false);
        }
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando vuelo'));
        this.regresar();
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

    this.cargarDestinosAutorizados(aerolineaId, true);
  }

  cargarDestinosAutorizados(
    aerolineaId: number,
    limpiarSiNoExisten: boolean
  ): void {
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

          if (limpiarSiNoExisten) {
            this.form.aeropuertoSalidaId = '';
            this.form.aeropuertoLlegadaId = '';
          }

          return;
        }

        if (!limpiarSiNoExisten) {
          this.incluirAeropuertosActualesSiFaltan();
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
    if (!this.id) {
      return;
    }

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

    this.vueloService.editar(this.id, payload).subscribe({
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

  private setForm(vuelo: Vuelo): void {
    this.codigoVuelo = vuelo?.codigoVuelo ?? '';

    this.form = {
      aerolineaId: vuelo?.aerolineaId ?? '',
      aeropuertoSalidaId: vuelo?.aeropuertoSalidaId ?? '',
      aeropuertoLlegadaId: vuelo?.aeropuertoLlegadaId ?? '',
      fechaSalida: vuelo?.fechaSalida ?? '',
      horaSalida: this.normalizarHora(vuelo?.horaSalida),
      fechaLlegada: vuelo?.fechaLlegada ?? '',
      horaLlegada: this.normalizarHora(vuelo?.horaLlegada),

      aeropuertoSalidaNombre: vuelo?.aeropuertoSalidaNombre ?? '',
      aeropuertoSalidaCodigoIata: vuelo?.aeropuertoSalidaCodigoIata ?? '',
      aeropuertoSalidaCodigoIcao: vuelo?.aeropuertoSalidaCodigoIcao ?? '',

      aeropuertoLlegadaNombre: vuelo?.aeropuertoLlegadaNombre ?? '',
      aeropuertoLlegadaCodigoIata: vuelo?.aeropuertoLlegadaCodigoIata ?? '',
      aeropuertoLlegadaCodigoIcao: vuelo?.aeropuertoLlegadaCodigoIcao ?? ''
    };
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

  private incluirAeropuertosActualesSiFaltan(): void {
    const salidaId = this.toNumberOrNull(this.form.aeropuertoSalidaId);
    const llegadaId = this.toNumberOrNull(this.form.aeropuertoLlegadaId);

    if (salidaId && !this.aeropuertosAutorizados.some((a) => Number(a.id) === salidaId)) {
      this.aeropuertosAutorizados.push({
        id: salidaId,
        nombre: this.form.aeropuertoSalidaNombre || `Aeropuerto ${salidaId}`,
        codigoIata: this.form.aeropuertoSalidaCodigoIata || '',
        codigoIcao: this.form.aeropuertoSalidaCodigoIcao || ''
      });
    }

    if (llegadaId && !this.aeropuertosAutorizados.some((a) => Number(a.id) === llegadaId)) {
      this.aeropuertosAutorizados.push({
        id: llegadaId,
        nombre: this.form.aeropuertoLlegadaNombre || `Aeropuerto ${llegadaId}`,
        codigoIata: this.form.aeropuertoLlegadaCodigoIata || '',
        codigoIcao: this.form.aeropuertoLlegadaCodigoIcao || ''
      });
    }

    this.aeropuertosAutorizados = [...this.aeropuertosAutorizados].sort((a, b) =>
      this.getAeropuertoLabel(a).localeCompare(this.getAeropuertoLabel(b))
    );
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

  private normalizarHora(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.length >= 5 ? value.substring(0, 5) : value;
  }
}