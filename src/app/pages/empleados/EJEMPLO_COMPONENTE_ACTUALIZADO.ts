// EJEMPLO: Componente actualizado con roles y JWT
// Este archivo muestra cómo estructurar un componente nuevo o actualizado

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmpleadoService } from '../../services/empleado.service';
import { CatalogoService } from '../../services/catalogo.service';

/**
 * Componente de ejemplo para listar empleados
 * Incluye:
 * - Verificación de roles
 * - Manejo de errores
 * - Integración con catálogos
 * - Estados de carga
 */
@Component({
  selector: 'app-empleados-actualizado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosActualizadoComponent implements OnInit {

  // Datos
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

  // Catálogos
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

  // Estados UI
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Control de permisos
  userRole: string | null = null;
  canCreate = false;
  canEdit = false;
  canDelete = false;

  constructor(
    private empleadoService: EmpleadoService,
    private catalogoService: CatalogoService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 1. Verificar autenticación
    if (!this.authService.isLogged()) {
      this.router.navigate(['/login']);
      return;
    }

    // 2. Obtener rol actual
    this.userRole = this.authService.getRole();

    // 3. Determinar permisos
    this.canCreate = this.authService.hasAnyRole(['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA']);
    this.canEdit = this.authService.hasAnyRole(['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA']);
    this.canDelete = this.authService.hasRole('ROLE_ADMIN_SISTEMA');

    // 4. Cargar catálogos
    this.cargarCatalogos();

    // 5. Cargar datos
    this.cargarEmpleados();

    // 6. Subscribirse a cambios de rol
    this.authService.userRole$.subscribe(role => {
      this.userRole = role;
    });
  }

  /**
   * Carga los catálogos necesarios
   */
  private cargarCatalogos(): void {
    this.catalogoService.tipoEmpleado().subscribe((data: any[]) => {
      this.tipoEmpleado = data;
      this.tipoEmpleadoMap = this.buildMap(data);
    });
    this.catalogoService.aerolinea().subscribe((data: any[]) => {
      this.aerolinea = data;
      this.aerolineaMap = this.buildMap(data);
    });
    this.catalogoService.turno().subscribe((data: any[]) => {
      this.turno = data;
      this.turnoMap = this.buildMap(data);
    });
    this.catalogoService.nivelAcceso().subscribe((data: any[]) => {
      this.nivelAcceso = data;
      this.nivelAccesoMap = this.buildMap(data);
    });
    this.catalogoService.rol().subscribe((data: any[]) => {
      this.rol = data;
      this.rolMap = this.buildMap(data);
    });
    this.catalogoService.area().subscribe((data: any[]) => {
      this.area = data;
      this.areaMap = this.buildMap(data);
    });
    this.catalogoService.licencia().subscribe((data: any[]) => {
      this.licencia = data;
    });
  }

  /**
   * Carga la lista de empleados
   */
  cargarEmpleados(): void {
    this.loading = true;
    this.errorMessage = '';

    this.empleadoService.getEmpleados(this.filtros).subscribe({
      next: (data: any[]) => {
        this.empleados = data;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al cargar empleados';
        console.error('Error:', error);
      }
    });
  }

  /**
   * Navega a crear nuevo empleado
   */
  crearEmpleado(): void {
    if (!this.canCreate) {
      this.errorMessage = 'No tiene permisos para crear empleados';
      return;
    }
    this.router.navigate(['/menu/aerolinea/empleados/nuevo']);
  }

  /**
   * Navega a editar un empleado
   */
  editarEmpleado(id: number): void {
    if (!this.canEdit) {
      this.errorMessage = 'No tiene permisos para editar empleados';
      return;
    }
    this.router.navigate(['/menu/aerolinea/empleados/editar', id]);
  }

  /**
   * Elimina un empleado
   */
  eliminarEmpleado(id: number): void {
    if (!this.canDelete) {
      this.errorMessage = 'No tiene permisos para eliminar empleados';
      return;
    }

    if (!confirm('¿Está seguro de que desea eliminar este empleado?')) {
      return;
    }

    this.loading = true;
    this.empleadoService.eliminarEmpleado(id).subscribe(
      () => {
        this.loading = false;
        this.successMessage = 'Empleado eliminado exitosamente';
        this.cargarEmpleados();
      },
      (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al eliminar empleado';
      }
    );
  }

  /**
   * Aplica filtros y recarga la lista
   */
  aplicarFiltros(): void {
    this.cargarEmpleados();
  }

  /**
   * Limpia los filtros
   */
  limpiarFiltros(): void {
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
    this.cargarEmpleados();
  }

  /**
   * Obtiene una etiqueta legible del catálogo
   */
  getCatalogoLabel(item: any): string {
    return item?.nombre || item?.descripcion || item?.label || 'N/A';
  }

  /**
   * Construye un mapa id -> etiqueta para mostrar en la tabla
   */
  private buildMap(items: any[]): Record<string, string> {
    return (items || []).reduce((acc: Record<string, string>, item: any) => {
      const label = this.getCatalogoLabel(item);
      if (label) {
        acc[String(item.id)] = label;
      }
      return acc;
    }, {});
  }

  /**
   * Elimina/inactiva un empleado
   */
  eliminar(id: number): void {
    if (!confirm('¿Eliminar empleado?')) {
      return;
    }

    this.empleadoService.eliminarEmpleado(id).subscribe({
      next: () => this.cargarEmpleados(),
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Error al eliminar empleado';
      }
    });
  }
}
