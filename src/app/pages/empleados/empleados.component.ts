import { Component, OnInit } from '@angular/core';
import { EmpleadoService } from '../../services/empleado.service';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit {

  empleados: any[] = [];

  filtros: any = {
    tipoEmpleadoId: '',
    aerolineaId: '',
    fechaIngreso: '',
    fechaSalida: '',
    turnoId: '',
    rolId: '',
    nivelAccesoId: '',
    areaId: ''
  };

  tipoEmpleado: any[] = [];
  aerolinea: any[] = [];
  turno: any[] = [];
  nivelAcceso: any[] = [];
  rol: any[] = [];
  area: any[] = [];
  licencia: any[] = [];

  tipoEmpleadoMap: Record<string, string> = {};
  aerolineaMap: Record<string, string> = {};
  turnoMap: Record<string, string> = {};
  nivelAccesoMap: Record<string, string> = {};
  rolMap: Record<string, string> = {};
  areaMap: Record<string, string> = {};

  constructor(
    private service: EmpleadoService,
    private catalogo: CatalogoService
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarCatalogos();
  }

  cargar() {
    this.service.getEmpleados(this.filtros).subscribe({
      next: (data) => {
        this.empleados = data;
      },
      error: (e) => {
        const message = e.error?.message || 'Error al listar empleados';
        alert(message);
      }
    });
  }

  cargarCatalogos() {
    this.catalogo.tipoEmpleado().subscribe(d => {
      this.tipoEmpleado = d;
      this.tipoEmpleadoMap = this.buildMap(d);
    });
    this.catalogo.aerolinea().subscribe(d => {
      this.aerolinea = d;
      this.aerolineaMap = this.buildMap(d);
    });
    this.catalogo.turno().subscribe(d => {
      this.turno = d;
      this.turnoMap = this.buildMap(d);
    });
    this.catalogo.nivelAcceso().subscribe(d => {
      this.nivelAcceso = d;
      this.nivelAccesoMap = this.buildMap(d);
    });
    this.catalogo.rol().subscribe(d => {
      this.rol = d;
      this.rolMap = this.buildMap(d);
    });
    this.catalogo.area().subscribe(d => {
      this.area = d;
      this.areaMap = this.buildMap(d);
    });
    this.catalogo.licencia().subscribe(d => this.licencia = d);
  }

  private buildMap(items: any[]) {
    return (items || []).reduce((acc: Record<string, string>, item: any) => {
      const label = this.getCatalogoLabel(item);
      if (label) {
        acc[String(item.id)] = label;
      }
      return acc;
    }, {});
  }

  getCatalogoLabel(item: any) {
    return item?.nombre || item?.descripcion || item?.label || '';
  }

  eliminar(id: number) {
    if (confirm('¿Eliminar empleado?')) {
      this.service.eliminarEmpleado(id).subscribe({
        next: () => {
          this.cargar();
        },
        error: (e) => {
          const message = e.error?.message || 'Error al eliminar empleado';
          alert(message);
        }
      });
    }
  }

  aplicarFiltros() {
    this.cargar();
  }

  limpiarFiltros() {
    this.filtros = {
      tipoEmpleadoId: '',
      aerolineaId: '',
      fechaIngreso: '',
      fechaSalida: '',
      turnoId: '',
      rolId: '',
      nivelAccesoId: '',
      areaId: ''
    };

    this.cargar();
  }
}
