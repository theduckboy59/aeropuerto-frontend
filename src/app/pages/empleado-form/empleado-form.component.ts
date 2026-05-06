import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoService } from '../../services/catalogo.service';
import { EmpleadoService } from '../../services/empleado.service';

@Component({
  selector: 'app-empleado-form',
  templateUrl: './empleado-form.component.html',
  styleUrl: './empleado-form.component.css'
})
export class EmpleadoFormComponent implements OnInit {
  form: any = this.getEmptyForm();

  tipoEmpleado: any[] = [];
  aerolinea: any[] = [];
  turno: any[] = [];
  nivelAcceso: any[] = [];
  rol: any[] = [];
  area: any[] = [];
  licencia: any[] = [];

  constructor(
    private service: EmpleadoService,
    private catalogo: CatalogoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCatalogos();
  }

  private getEmptyForm() {
    return {
      username: '',
      email: '',
      password: '',
      tipoEmpleadoId: '',
      aerolineaId: '',
      nombreCompleto: '',
      fechaIngreso: '',
      turnoId: '',
      nivelAccesoId: '',
      rolId: '',
      areaId: '',
      licenciaId: '',
      fechaVencimientoLicencia: ''
    };
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
    const requiredFields = [
      { key: 'username', label: 'Usuario' },
      { key: 'email', label: 'Email' },
      { key: 'password', label: 'Password' },
      { key: 'tipoEmpleadoId', label: 'Tipo Empleado' },
      { key: 'aerolineaId', label: 'Aerolínea' },
      { key: 'nombreCompleto', label: 'Nombre Completo' },
      { key: 'fechaIngreso', label: 'Fecha Ingreso' },
      { key: 'turnoId', label: 'Turno' },
      { key: 'nivelAccesoId', label: 'Nivel Acceso' },
      { key: 'rolId', label: 'Rol' },
      { key: 'areaId', label: 'Área' },
      { key: 'licenciaId', label: 'Licencia' },
      { key: 'fechaVencimientoLicencia', label: 'Fecha Vencimiento Licencia' }
    ];

    const faltante = requiredFields.find(field => {
      const value = this.form[field.key];
      return value === null || value === undefined || value === '';
    });

    if (faltante) {
      alert(`Campo requerido: ${faltante.label}`);
      return;
    }

    this.service.crearEmpleado(this.form).subscribe({
      next: () => {
        alert('Empleado creado');
        this.router.navigate(['/menu/aerolinea/empleados']);
      },
      error: (e) => {
        const message = e.error?.message || 'Error inesperado';
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/empleados']);
  }
}
