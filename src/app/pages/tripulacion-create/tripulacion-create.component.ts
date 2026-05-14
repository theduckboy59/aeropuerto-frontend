import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoService } from '../../services/catalogo.service';
import { EmpleadoService } from '../../services/empleado.service';
import { TripulacionService } from '../../services/tripulacion.service';

@Component({
  selector: 'app-tripulacion-create',
  templateUrl: './tripulacion-create.component.html',
  styleUrl: './tripulacion-create.component.css'
})
export class TripulacionCreateComponent implements OnInit {
  aerolineas: any[] = [];
  empleados: any[] = [];
  empleadosDisponibles: any[] = [];
  tipoEmpleado: any[] = [];
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

  constructor(
    private catalogo: CatalogoService,
    private empleadosService: EmpleadoService,
    private tripulacionService: TripulacionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.catalogo.aerolineas().subscribe({
      next: (data) => (this.aerolineas = data || []),
      error: () => {
        this.catalogo.aerolinea().subscribe(d => (this.aerolineas = d || []));
      }
    });

    this.catalogo.tiposEmpleado().subscribe({
      next: (d) => this.setTiposEmpleado(d || []),
      error: () => {
        this.catalogo.tipoEmpleado().subscribe(d => this.setTiposEmpleado(d || []));
      }
    });

  }

  onAerolineaChange() {
    this.resetSeleccion();

    if (!this.form.aerolineaId) {
      this.empleados = [];
      this.empleadosDisponibles = [];
      return;
    }

    this.empleadosService.getEmpleados({
      aerolineaId: Number(this.form.aerolineaId),
      estadoId: 1,
      disponible: true
    }).subscribe({
      next: (data) => {
        this.empleados = data || [];
        this.empleadosDisponibles = this.empleados.filter(e => this.filtraEmpleado(e));
      },
      error: () => {
        this.empleadosService.getEmpleados().subscribe({
          next: (data) => {
            this.empleados = data || [];
            this.empleadosDisponibles = this.empleados.filter(e => this.filtraEmpleado(e));
          },
          error: (e) => {
            const message = e.error?.message || 'Error al cargar empleados';
            alert(message);
          }
        });
      }
    });
  }

  guardar() {
    const faltante = this.validar();
    if (faltante) {
      alert(faltante);
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

    this.cargando = true;
    this.tripulacionService.crearTripulacion(payload).subscribe({
      next: (res: any) => {
        this.cargando = false;
        alert('Tripulacion creada correctamente');
        this.router.navigate(['/menu/aerolinea/tripulacion']);
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al crear tripulacion';
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/tripulacion']);
  }

  getPilotos() {
    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.piloto ?? 1, [
      this.form.copilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getCopilotos() {
    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.copiloto ?? 2, [
      this.form.pilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getIngenieros() {
    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.ingeniero ?? 4, [
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

    return this.getOpcionesPorTipo(this.tipoEmpleadoIds.cabina ?? 3, excluir);
  }

  getEmpleadoLabel(empleado: any) {
    const codigo = empleado?.codigoEmpleado || empleado?.codigo || empleado?.id || '';
    const nombre = empleado?.nombreCompleto || empleado?.nombre || empleado?.username || empleado?.email || 'Empleado';
    return `${codigo} - ${nombre}`.trim();
  }

  private getOpcionesPorTipo(tipoId: number | null, excluirIds: Array<string | number>) {
    const base = !tipoId
      ? this.empleadosDisponibles
      : this.empleadosDisponibles.filter(e => String(e?.tipoEmpleadoId) === String(tipoId));

    const excluir = new Set(excluirIds.map(id => String(id)));
    return base.filter(e => !excluir.has(String(e?.id)));
  }

  private validar() {
    if (!this.form.aerolineaId) return 'Seleccione una aerolinea';
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
    const empleadoAerolineaId = empleado?.aerolineaId ?? empleado?.aerolinea?.id ?? empleado?.aerolinea?.aerolineaId;
    const mismaAerolinea = String(empleadoAerolineaId) === String(this.form.aerolineaId);
    if (!mismaAerolinea) return false;

    const estadoId = empleado?.estadoId ?? empleado?.estado?.id;
    if (estadoId !== undefined && estadoId !== null && String(estadoId) !== '1') {
      return false;
    }

    const disponible = empleado?.disponible;
    if (disponible !== undefined && disponible !== null) {
      return Boolean(disponible);
    }

    const disponibilidad = this.disponibilidadPorEmpleado(empleado?.id);
    return disponibilidad === null ? true : disponibilidad === true;
  }

  private toBool(value: any, fallback: boolean) {
    if (value === undefined || value === null) return fallback;
    return Boolean(value);
  }

  private disponibilidadPorEmpleado(value: any) {
    if (value === undefined || value === null || value === '') return null;
    const empleado = this.empleados.find(item => String(item?.id) === String(value));
    if (!empleado) return null;
    if (empleado?.disponible !== undefined && empleado?.disponible !== null) {
      return Boolean(empleado.disponible);
    }
    return null;
  }

  private setTiposEmpleado(data: any[]) {
    this.tipoEmpleado = data || [];
    this.tipoEmpleadoIds = {
      piloto: this.findTipoId('piloto'),
      copiloto: this.findTipoId('copiloto'),
      ingeniero: this.findTipoId('ingeniero'),
      cabina: this.findTipoId('cabina')
    };
  }


  private findTipoId(keyword: string) {
    const match = (this.tipoEmpleado || []).find((item: any) => {
      const label = String(item?.nombre || item?.descripcion || item?.label || '').toLowerCase();
      return label.includes(keyword);
    });
    return match ? Number(match.id) : null;
  }
}
