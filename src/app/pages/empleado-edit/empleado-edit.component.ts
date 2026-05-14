import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogoService } from '../../services/catalogo.service';
import { EmpleadoService } from '../../services/empleado.service';

@Component({
  selector: 'app-empleado-edit',
  templateUrl: './empleado-edit.component.html',
  styleUrl: './empleado-edit.component.css'
})
export class EmpleadoEditComponent implements OnInit {
  form: any = this.getEmptyForm();
  empleadoId: number | null = null;
  codigoEmpleado: string | null = null;

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
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCatalogos();

    const idParam = this.route.snapshot.paramMap.get('id');
    this.empleadoId = idParam ? Number(idParam) : null;

    if (this.empleadoId === null || Number.isNaN(this.empleadoId)) {
      alert('Empleado no encontrado');
      this.router.navigate(['/menu/aerolinea/empleados']);
      return;
    }

    this.service.getEmpleado(this.empleadoId).subscribe({
      next: (data) => {
        this.codigoEmpleado = data.codigoEmpleado || null;
        this.form = {
          username: data.username,
          email: data.email,
          password: '',
          tipoEmpleadoId: data.tipoEmpleadoId,
          aerolineaId: data.aerolineaId,
          nombreCompleto: data.nombreCompleto,
          fechaIngreso: data.fechaIngreso,
          fechaSalida: data.fechaSalida || '',
          turnoId: data.turnoId,
          nivelAccesoId: data.nivelAccesoId,
          rolId: data.rolId,
          areaId: data.areaId,
          licenciaId: data.licenciaId,
          fechaVencimientoLicencia: data.fechaVencimientoLicencia
        };
      },
      error: (e) => {
        const message = e.error?.message || 'Empleado no encontrado';
        alert(message);
        this.router.navigate(['/menu/aerolinea/empleados']);
      }
    });
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
      fechaSalida: '',
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
    { key: 'tipoEmpleadoId', label: 'Tipo Empleado' },
    { key: 'aerolineaId', label: 'Aerolínea' },
    { key: 'nombreCompleto', label: 'Nombre Completo' },
    { key: 'fechaIngreso', label: 'Fecha Ingreso' },
    { key: 'turnoId', label: 'Turno' },
    { key: 'nivelAccesoId', label: 'Nivel Acceso' },
    { key: 'rolId', label: 'Rol' },
    { key: 'areaId', label: 'Área' }
  ];

  const faltante = requiredFields.find(field => {
    const value = this.form[field.key];
    return value === null || value === undefined || value === '';
  });

  if (faltante) {
    alert(`Campo requerido: ${faltante.label}`);
    return;
  }

  if (this.form.password && this.form.password.length < 8) {
    alert('Password mínimo 8 caracteres');
    return;
  }

  if (this.empleadoId === null) {
    alert('Empleado no encontrado');
    return;
  }

  const payload = {
    ...this.form,
    fechaSalida: this.form.fechaSalida || null,
    licenciaId: this.form.licenciaId || null,
    fechaVencimientoLicencia: this.form.fechaVencimientoLicencia || null
  };

  if (!payload.password) {
    delete payload.password;
  }

  this.service.actualizarEmpleado(this.empleadoId, payload).subscribe({
    next: () => {
      alert('Empleado actualizado');
      this.router.navigate(['/menu/aerolinea/empleados']);
    },
    error: (e) => {
      const message = e.error?.message || 'Error al actualizar empleado';
      alert(message);
    }
  });
}

  regresar() {
    this.router.navigate(['/menu/aerolinea/empleados']);
  }
}
