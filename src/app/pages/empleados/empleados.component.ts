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

  form: any = {};
  editando = false;

  tipoEmpleado: any[] = [];
  aerolinea: any[] = [];
  turno: any[] = [];
  nivelAcceso: any[] = [];
  rol: any[] = [];
  area: any[] = [];
  licencia: any[] = [];

  constructor(
    private service: EmpleadoService,
    private catalogo: CatalogoService
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarCatalogos();
  }

  cargar() {
    this.service.getEmpleados().subscribe(data => {
      this.empleados = data;
    });
  }

  cargarCatalogos() {
    this.catalogo.tipoEmpleado().subscribe(d => this.tipoEmpleado = d);
    this.catalogo.aerolinea().subscribe(d => this.aerolinea = d);
    this.catalogo.turno().subscribe(d => this.turno = d);
    this.catalogo.nivelAcceso().subscribe(d => this.nivelAcceso = d);
    this.catalogo.rol().subscribe(d => this.rol = d);
    this.catalogo.area().subscribe(d => this.area = d);
    this.catalogo.licencia().subscribe(d => this.licencia = d);
  }

  guardar() {

    if (this.editando) {
      this.service.actualizarEmpleado(this.form.id, this.form).subscribe(() => {
        alert('Empleado actualizado');
        this.reset();
        this.cargar();
      });
    } else {
      this.service.crearEmpleado(this.form).subscribe(() => {
        alert('Empleado creado');
        this.reset();
        this.cargar();
      });
    }
  }

  editar(e: any) {
  this.form = {
    id: e.id,
    username: e.username,
    email: e.email,
    codigoEmpleado: e.codigoEmpleado,
    nombreCompleto: e.nombreCompleto,
    tipoEmpleadoId: e.tipoEmpleadoId,
    aerolineaId: e.aerolineaId,
    turnoId: e.turnoId,
    nivelAccesoId: e.nivelAccesoId,
    rolId: e.rolId,
    areaId: e.areaId,
    licenciaId: e.licenciaId,
    fechaIngreso: e.fechaIngreso,
    fechaVencimientoLicencia: e.fechaVencimientoLicencia
  };

  this.editando = true;
}

  eliminar(id: number) {
    if (confirm('¿Eliminar empleado?')) {
      this.service.eliminarEmpleado(id).subscribe(() => {
        this.cargar();
      });
    }
  }

  reset() {
    this.form = {};
    this.editando = false;
  }
}
