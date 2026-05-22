import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CatalogoService } from '../../services/catalogo.service';
import { EmpleadoService } from '../../services/empleado.service';
import { TripulacionService } from '../../services/tripulacion.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-tripulacion-edit',
  templateUrl: './tripulacion-edit.component.html',
  styleUrl: './tripulacion-edit.component.css'
})
export class TripulacionEditComponent implements OnInit {
  id: number | null = null;

  detalle: any = null;

  aerolineas: any[] = [];
  empleados: any[] = [];
  empleadosDisponibles: any[] = [];
  tiposEmpleado: any[] = [];
  estadosTripulacion: any[] = [];

  tipoEmpleadoIds: {
    piloto: number | null;
    copiloto: number | null;
    ingeniero: number | null;
    cabina: number | null;
  } = {
    piloto: null,
    copiloto: null,
    ingeniero: null,
    cabina: null
  };

  estadoTripulacionMap: Record<string, string> = {};

  empleadosActualesIds = new Set<string>();

  form = {
    aerolineaId: '',
    pilotoId: '',
    copilotoId: '',
    ingenieroId: '',
    cabina1Id: '',
    cabina2Id: '',
    cabina3Id: ''
  };

  cargando = false;
  guardando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogo: CatalogoService,
    private empleadosService: EmpleadoService,
    private tripulacionService: TripulacionService
  ) {}

  ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? Number(raw) : NaN;

    if (!id || Number.isNaN(id)) {
      alert('ID inválido');
      this.regresar();
      return;
    }

    this.id = id;
    this.cargarInicial();
  }

  cargarInicial() {
    if (!this.id) return;

    this.cargando = true;

    forkJoin({
      aerolineas: this.catalogo.aerolinea(),
      tiposEmpleado: this.catalogo.tipoEmpleado(),
      estadosTripulacion: this.catalogo.estadoTripulacion(),
      detalle: this.tripulacionService.getTripulacion(this.id)
    }).subscribe({
      next: ({ aerolineas, tiposEmpleado, estadosTripulacion, detalle }) => {
        this.aerolineas = aerolineas || [];
        this.tiposEmpleado = tiposEmpleado || [];
        this.estadosTripulacion = estadosTripulacion || [];
        this.estadoTripulacionMap = this.buildMap(this.estadosTripulacion);

        this.setTiposEmpleado(this.tiposEmpleado);

        this.detalle = detalle;
        this.cargarFormularioDesdeDetalle(detalle);

        if (!this.esDisponible()) {
          this.cargando = false;
          alert('Esta tripulación no está DISPONIBLE. No se puede editar.');
          this.regresar();
          return;
        }

        this.cargarEmpleados();
      },
      error: (e) => {
        this.cargando = false;
        const message = getApiErrorMessage(e, 'Error al cargar tripulación');
        alert(message);
        this.regresar();
      }
    });
  }

  cargarFormularioDesdeDetalle(detalle: any) {
    const empleados = detalle?.empleados || [];

    const piloto = this.buscarEmpleadoPorTipo(empleados, 'PILOTO');
    const copiloto = this.buscarEmpleadoPorTipo(empleados, 'COPILOTO');
    const ingeniero = this.buscarEmpleadoPorTipo(empleados, 'INGENIERO');
    const cabina = empleados.filter((e: any) =>
      this.tipoEmpleadoTexto(e).includes('CABINA')
    );

    const empleadoIds = empleados
      .map((e: any) => this.getEmpleadoId(e))
      .filter(Boolean)
      .map((id: any) => String(id));

    this.empleadosActualesIds = new Set(empleadoIds);

    this.form = {
      aerolineaId: detalle?.aerolineaId ? String(detalle.aerolineaId) : '',
      pilotoId: piloto ? String(this.getEmpleadoId(piloto)) : '',
      copilotoId: copiloto ? String(this.getEmpleadoId(copiloto)) : '',
      ingenieroId: ingeniero ? String(this.getEmpleadoId(ingeniero)) : '',
      cabina1Id: cabina[0] ? String(this.getEmpleadoId(cabina[0])) : '',
      cabina2Id: cabina[1] ? String(this.getEmpleadoId(cabina[1])) : '',
      cabina3Id: cabina[2] ? String(this.getEmpleadoId(cabina[2])) : ''
    };
  }

  cargarEmpleados() {
    if (!this.form.aerolineaId) {
      this.empleados = [];
      this.empleadosDisponibles = [];
      this.cargando = false;
      return;
    }

    this.empleadosService.getEmpleados({
      aerolineaId: Number(this.form.aerolineaId),
      estadoId: 1
    }).subscribe({
      next: (data) => {
        this.empleados = data || [];
        this.empleadosDisponibles = this.empleados.filter(e => this.filtraEmpleado(e));
        this.cargando = false;
      },
      error: (e) => {
        this.cargando = false;
        const message = getApiErrorMessage(e, 'Error al cargar empleados');
        alert(message);
      }
    });
  }

  onAerolineaChange() {
    this.resetSeleccion();
    this.empleadosActualesIds.clear();
    this.cargarEmpleados();
  }

  guardar() {
    if (!this.id) return;

    const msg = this.validar();
    if (msg) {
      alert(msg);
      return;
    }

    if (!this.esDisponible()) {
      alert('Solo se pueden editar tripulaciones DISPONIBLES');
      return;
    }

    const payload = {
      aerolineaId: Number(this.form.aerolineaId),
      pilotoId: Number(this.form.pilotoId),
      copilotoId: Number(this.form.copilotoId),
      ingenieroId: Number(this.form.ingenieroId),
      tripulantesCabinaIds: [
        Number(this.form.cabina1Id),
        Number(this.form.cabina2Id),
        Number(this.form.cabina3Id)
      ]
    };

    this.guardando = true;

    this.tripulacionService.actualizarTripulacion(this.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Tripulación actualizada correctamente');
        this.regresar();
      },
      error: (e) => {
        this.guardando = false;
        const message = getApiErrorMessage(e, 'Error al actualizar tripulación');
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/tripulacion']);
  }

  esDisponible() {
    const estado = this.getEstadoLabel(this.detalle?.estadoTripulacionId);
    return this.normalizarTexto(estado) === 'DISPONIBLE';
  }

  getPilotos() {
    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.piloto, [
      this.form.copilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getCopilotos() {
    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.copiloto, [
      this.form.pilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getIngenieros() {
    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.ingeniero, [
      this.form.pilotoId,
      this.form.copilotoId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getCabina(slot: 'cabina1Id' | 'cabina2Id' | 'cabina3Id') {
    const excluir = [
      this.form.pilotoId,
      this.form.copilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ].filter(id => id && id !== this.form[slot]);

    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.cabina, excluir);
  }

  getEmpleadoLabel(empleado: any) {
    const codigo = empleado?.codigoEmpleado || empleado?.codigo || empleado?.id || '';
    const nombre = empleado?.nombreCompleto || empleado?.nombre || empleado?.username || empleado?.email || 'Empleado';
    return `${codigo} - ${nombre}`.trim();
  }

  getEstadoLabel(id: any) {
    return this.estadoTripulacionMap[String(id)] || '-';
  }

  private getOpcionesPorTipo(tipoId: number | null, excluirIds: Array<string | number>) {
    if (!tipoId) return [];

    const base = this.empleadosDisponibles.filter(e =>
      String(e?.tipoEmpleadoId) === String(tipoId)
    );

    const excluir = new Set(
      excluirIds
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => String(id))
    );

    return base.filter(e => !excluir.has(String(e?.id)));
  }

  private validar() {
    if (!this.form.aerolineaId) return 'Seleccione una aerolínea';
    if (!this.form.pilotoId) return 'Seleccione un piloto';
    if (!this.form.copilotoId) return 'Seleccione un copiloto';
    if (!this.form.ingenieroId) return 'Seleccione un ingeniero';

    if (!this.form.cabina1Id || !this.form.cabina2Id || !this.form.cabina3Id) {
      return 'Seleccione exactamente 3 tripulantes de cabina';
    }

    const seleccionados = [
      this.form.pilotoId,
      this.form.copilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ].map(id => String(id));

    const unicos = new Set(seleccionados);

    if (unicos.size !== seleccionados.length) {
      return 'No se permiten empleados repetidos';
    }

    return '';
  }

  private resetSeleccion() {
    this.form.pilotoId = '';
    this.form.copilotoId = '';
    this.form.ingenieroId = '';
    this.form.cabina1Id = '';
    this.form.cabina2Id = '';
    this.form.cabina3Id = '';
  }

  private filtraEmpleado(empleado: any) {
    const empleadoAerolineaId =
      empleado?.aerolineaId ??
      empleado?.aerolinea?.id ??
      empleado?.aerolinea?.aerolineaId;

    const mismaAerolinea = String(empleadoAerolineaId) === String(this.form.aerolineaId);

    if (!mismaAerolinea) return false;

    const estadoId = empleado?.estadoId ?? empleado?.estado?.id;

    if (estadoId !== undefined && estadoId !== null && String(estadoId) !== '1') {
      return false;
    }

    if (this.empleadosActualesIds.has(String(empleado?.id))) {
      return true;
    }

    const disponible = empleado?.disponible;

    if (disponible !== undefined && disponible !== null) {
      return Boolean(disponible);
    }

    return true;
  }

  private buscarEmpleadoPorTipo(empleados: any[], tipo: string) {
    const tipoNormalizado = this.normalizarTextoSimple(tipo);

    return empleados.find((e: any) =>
      this.tipoEmpleadoTexto(e).includes(tipoNormalizado)
    );
  }

  private tipoEmpleadoTexto(empleado: any) {
    const tipoId = empleado?.tipoEmpleadoId;
    const tipo = this.tiposEmpleado.find(t => String(t?.id) === String(tipoId));
    const label = tipo?.nombre || tipo?.descripcion || tipo?.label || '';
    return this.normalizarTextoSimple(label);
  }

  private getEmpleadoId(empleado: any) {
    return empleado?.empleadoId ?? empleado?.id;
  }

  private setTiposEmpleado(data: any[]) {
    this.tiposEmpleado = data || [];

    this.tipoEmpleadoIds = {
      piloto: this.findTipoId('PILOTO'),
      copiloto: this.findTipoId('COPILOTO'),
      ingeniero: this.findTipoId('INGENIERO'),
      cabina: this.findTipoId('CABINA')
    };
  }

  private findTipoId(keyword: string) {
    const key = this.normalizarTextoSimple(keyword);

    const match = (this.tiposEmpleado || []).find((item: any) => {
      const label = this.normalizarTextoSimple(
        item?.nombre || item?.descripcion || item?.label || ''
      );

      return label.includes(key);
    });

    return match ? Number(match.id) : null;
  }

  private buildMap(data: any[]) {
    const map: Record<string, string> = {};

    (data || []).forEach(item => {
      const label = item?.nombre || item?.descripcion || item?.label || item?.name || '';
      if (item?.id !== undefined && item?.id !== null) {
        map[String(item.id)] = label;
      }
    });

    return map;
  }

  private normalizarTexto(value: any) {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/-/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }

  private normalizarTextoSimple(value: any) {
    return this.normalizarTexto(value).replace(/_/g, '');
  }
}