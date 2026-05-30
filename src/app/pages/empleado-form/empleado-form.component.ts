import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoService } from '../../services/catalogo.service';
import { EmpleadoService } from '../../services/empleado.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-empleado-form',
  templateUrl: './empleado-form.component.html',
  styleUrl: './empleado-form.component.css'
})
export class EmpleadoFormComponent implements OnInit {
  readonly fechaMinima = this.obtenerFechaMinima();

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
      fechaSalida: '',              // OPCIONAL
      turnoId: '',
      nivelAccesoId: '',
      rolId: '',
      areaId: '',
      licenciaId: '',               // OPCIONAL
      fechaVencimientoLicencia: ''  // OPCIONAL
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
    // CAMPOS OBLIGATORIOS
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
      { key: 'areaId', label: 'Área' }
    ];

    // Validar obligatorios
    const faltante = requiredFields.find(field => {
      const value = this.form[field.key];
      return value === null || value === undefined || value === '';
    });

    if (faltante) {
      alert(`Campo requerido: ${faltante.label}`);
      return;
    }

    // PREPARAR DATOS: solo enviar campos con valor
    const datosAEnviar = this.prepararDatos();

    console.log('JSON a enviar:', datosAEnviar);

    this.service.crearEmpleado(datosAEnviar).subscribe({
      next: () => {
        alert('Empleado creado exitosamente');
        this.router.navigate(['/menu/aerolinea/empleados']);
      },
      error: (e) => {
        const message = getApiErrorMessage(e, 'Error inesperado');
        alert(message);
      }
    });
  }

  /**
   * Prepara los datos para enviar al backend
   * Solo incluye campos opcionales si tienen valor
   */
  private prepararDatos(): any {
    const datos: any = { ...this.form };

    // Si no tiene valor, no enviar campos opcionales
    if (!datos.fechaSalida) {
      delete datos.fechaSalida;
    }

    if (!datos.licenciaId || datos.licenciaId === '') {
      delete datos.licenciaId;
    }

    if (!datos.fechaVencimientoLicencia) {
      delete datos.fechaVencimientoLicencia;
    }

    return datos;
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/empleados']);
  }

  private obtenerFechaMinima(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
