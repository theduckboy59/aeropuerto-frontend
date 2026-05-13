import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Avion, AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ConfigClaseFilasAvion, ConfigClaseFilasAvionService } from '../../services/config-clase-filas-avion.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-config-clase-filas-avion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './config-clase-filas-avion.component.html',
  styleUrl: './config-clase-filas-avion.component.css'
})
export class ConfigClaseFilasAvionComponent implements OnInit {
  aviones: Avion[] = [];
  clasesVuelo: any[] = [];

  configs: ConfigClaseFilasAvion[] = [];

  filtros: any = {
    avionId: '',
    claseVueloId: '',
    activo: ''
  };

  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  avionMap: Record<number, string> = {};
  claseMap: Record<number, string> = {};

  cargando = false;
  errorMsg: string | null = null;

  constructor(
    private avionService: AvionService,
    private catalogo: CatalogoService,
    private configService: ConfigClaseFilasAvionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarInicial();
  }

  cargarInicial(): void {
    this.cargando = true;
    this.errorMsg = null;
    forkJoin({
      aviones: this.avionService.getAviones({ size: 100 }),
      clases: this.catalogo.claseVuelo()
    }).subscribe({
      next: ({ aviones, clases }) => {
        this.aviones = aviones ?? [];
        this.clasesVuelo = clases ?? [];
        this.avionMap = Object.fromEntries(this.aviones.map((a) => [Number(a.id), `${a.codigoAvion} - ${a.filasConfiguradas} filas`]));
        this.claseMap = Object.fromEntries(this.clasesVuelo.map((c: any) => [Number(c.id), c.nombre ?? c.descripcion ?? c.label ?? String(c.id)]));

        // Carga automática de la tabla usando el mismo flujo que "Buscar"
        this.cargando = false;
        this.buscar();
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        this.errorMsg = getApiErrorMessage(err, 'No se pudo cargar (aviones / clases / configuraciones)');
      }
    });
  }

  private setPage(page: any): void {
    this.configs = page?.content ?? [];
    this.totalElements = Number(page?.totalElements ?? 0);
    this.totalPages = Number(page?.totalPages ?? 0);
    this.page = Number(page?.number ?? 0);
    this.size = Number(page?.size ?? this.size);
  }

  buscar(): void {
    this.page = 0;
    this.consultar();
  }

  limpiar(): void {
    this.filtros = { avionId: '', claseVueloId: '', activo: '' };
    this.page = 0;
    this.consultar();
  }

  nuevo(): void {
    this.router.navigate(['/menu/aerolinea/config-clase-filas-avion/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/menu/aerolinea/config-clase-filas-avion/editar', id]);
  }

  desactivar(item: ConfigClaseFilasAvion): void {
    if (!confirm('¿Está seguro de desactivar esta configuración?')) return;
    this.configService.desactivar(item.id).subscribe({
      next: () => {
        alert('Desactivado correctamente.');
        this.consultar();
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error al desactivar'));
      }
    });
  }

  cambiarPagina(delta: number): void {
    const nextPage = this.page + delta;
    if (nextPage < 0) return;
    if (this.totalPages && nextPage >= this.totalPages) return;
    this.page = nextPage;
    this.consultar();
  }

  private consultar(): void {
    this.cargando = true;
    this.errorMsg = null;
    const activo =
      this.filtros.activo === '' ? null : this.filtros.activo === 'true';

    this.configService
      .listar({
        avionId: this.filtros.avionId || null,
        claseVueloId: this.filtros.claseVueloId || null,
        activo,
        page: this.page,
        size: this.size
      })
      .subscribe({
        next: (page) => {
          this.setPage(page);
          this.cargando = false;
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
          this.errorMsg = getApiErrorMessage(err, 'No se pudo consultar configuraciones');
        }
      });
  }

  getEstadoLabel(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }

  getFechaActualizacion(item: ConfigClaseFilasAvion): string {
    return item.updatedAt || item.createdAt || '';
  }

}
