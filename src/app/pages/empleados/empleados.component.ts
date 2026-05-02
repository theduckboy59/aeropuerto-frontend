import { Component, OnInit } from '@angular/core';
import { EmpleadoService } from '../../services/empleado.service';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html'
})
export class EmpleadosComponent implements OnInit {

  empleados: any[] = [];

  form: any = {};

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
    this.service.crearEmpleado(this.form).subscribe(() => {
      alert('Empleado creado');
      this.form = {};
      this.cargar();
    });
  }
}