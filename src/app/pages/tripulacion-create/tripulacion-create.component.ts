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
      next: (data: any[]) => {
        this.aerolineas = data || [];
      },
      error: (_e: any) => {
        this.catalogo.aerolinea().subscribe({
          next: (data: any[]) => {
            this.aerolineas = data || [];
          },
          error: (_e2: any) => {
            alert('Error al cargar aerolíneas');
          }
        });
      }
    });

    this.catalogo.tiposEmpleado().subscribe({
      next: (data: any[]) => {
        this.setTiposEmpleado(data || []);
      },
      error: (_e: any) => {
        this.catalogo.tipoEmpleado().subscribe({
          next: (data: any[]) => {
            this.setTiposEmpleado(data || []);
          },
          error: (_e2: any) => {
            alert('Error al cargar tipos de empleado');
          }
        });
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

    this.cargando = true;

    this.empleadosService
      .getDisponiblesTripulacion(Number(this.form.aerolineaId))
      .subscribe({
        next: (data: any[]) => {
          this.cargando = false;
          this.empleados = data || [];
          this.empleadosDisponibles = this.empleados;
        },
        error: (e: any) => {
          this.cargando = false;
          const message = e?.error?.message || 'Error al cargar empleados disponibles';
          alert(message);
          this.empleados = [];
          this.empleadosDisponibles = [];
        }
      });
  }

  guardar() {
    const mensajeValidacion = this.validar();

    if (mensajeValidacion) {
      alert(mensajeValidacion);
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

    this.tripulacionService.crear(payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Se creó con éxito la tripulación');
        this.router.navigate(['/menu/aerolinea/tripulacion']);
      },
      error: (e: any) => {
        this.cargando = false;
        const message = e?.error?.message || 'Error al crear tripulación';
        alert(message);
      }
    });
  }

  validar(): string {
    if (
      !this.form.aerolineaId ||
      !this.form.pilotoId ||
      !this.form.copilotoId ||
      !this.form.ingenieroId ||
      !this.form.cabina1Id ||
      !this.form.cabina2Id ||
      !this.form.cabina3Id
    ) {
      return 'Debe ingresar los campos obligatorios';
    }

    const ids = [
      Number(this.form.pilotoId),
      Number(this.form.copilotoId),
      Number(this.form.ingenieroId),
      Number(this.form.cabina1Id),
      Number(this.form.cabina2Id),
      Number(this.form.cabina3Id)
    ];

    const idsUnicos = new Set(ids);

    if (idsUnicos.size !== ids.length) {
      return 'No puede seleccionar el mismo empleado más de una vez';
    }

    return '';
  }

  getPilotos() {
    return this.getOpcionesPorTipo('PILOTO', [
      this.form.copilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getCopilotos() {
    return this.getOpcionesPorTipo('COPILOTO', [
      this.form.pilotoId,
      this.form.ingenieroId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getIngenieros() {
    return this.getOpcionesPorTipo('INGENIERO_VUELO', [
      this.form.pilotoId,
      this.form.copilotoId,
      this.form.cabina1Id,
      this.form.cabina2Id,
      this.form.cabina3Id
    ]);
  }

  getCabina(campoActual: string) {
    return this.getOpcionesPorTipo('CABINA', [
      this.form.pilotoId,
      this.form.copilotoId,
      this.form.ingenieroId,
      campoActual !== 'cabina1Id' ? this.form.cabina1Id : '',
      campoActual !== 'cabina2Id' ? this.form.cabina2Id : '',
      campoActual !== 'cabina3Id' ? this.form.cabina3Id : ''
    ]);
  }

  private getOpcionesPorTipo(tipoNombre: string, idsExcluidos: any[]) {
    const excluidos = new Set(
      (idsExcluidos || [])
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => Number(id))
    );

    return (this.empleadosDisponibles || []).filter((empleado: any) => {
      const empleadoId = Number(empleado.id);
      const nombreTipoEmpleado = this.normalizar(
        empleado.tipoEmpleadoNombre || this.obtenerNombreTipoPorId(empleado.tipoEmpleadoId)
      );

      return nombreTipoEmpleado === this.normalizar(tipoNombre)
        && !excluidos.has(empleadoId);
    });
  }

  private obtenerNombreTipoPorId(tipoEmpleadoId: any): string {
    const id = Number(tipoEmpleadoId);

    const tipo = (this.tipoEmpleado || []).find((item: any) =>
      Number(item.id) === id
    );

    return tipo?.nombre || '';
  }

  private setTiposEmpleado(data: any[]) {
    this.tipoEmpleado = data || [];

    this.tipoEmpleadoIds = {
      piloto: this.findTipoId('PILOTO'),
      copiloto: this.findTipoId('COPILOTO'),
      ingeniero: this.findTipoId('INGENIERO_VUELO'),
      cabina: this.findTipoId('CABINA')
    };
  }

  private findTipoId(nombre: string): number | null {
    const target = this.normalizar(nombre);

    const tipo = (this.tipoEmpleado || []).find((t: any) =>
      this.normalizar(t.nombre || t.descripcion || t.label) === target
    );

    return tipo ? Number(tipo.id) : null;
  }

  private normalizar(value: any): string {
    return (value || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
  }

  getEmpleadoLabel(empleado: any): string {
    if (!empleado) {
      return '';
    }

    const codigo = empleado.codigoEmpleado || empleado.id;
    const nombre = empleado.nombreCompleto || empleado.nombre || 'Sin nombre';
    const tipo = empleado.tipoEmpleadoNombre || this.obtenerNombreTipoPorId(empleado.tipoEmpleadoId);

    return `${codigo} - ${nombre}${tipo ? ' (' + tipo + ')' : ''}`;
  }

  resetSeleccion() {
    this.form.pilotoId = '';
    this.form.copilotoId = '';
    this.form.ingenieroId = '';
    this.form.cabina1Id = '';
    this.form.cabina2Id = '';
    this.form.cabina3Id = '';
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/tripulacion']);
  }
}