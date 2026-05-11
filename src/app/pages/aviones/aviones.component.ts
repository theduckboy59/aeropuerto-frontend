import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Avion, AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ModeloAvion, ModeloAvionService } from '../../services/modelo-avion.service';

@Component({
  selector: 'app-aviones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aviones.component.html',
  styleUrl: './aviones.component.css'
})
export class AvionesComponent implements OnInit {
  aerolineas: any[] = [];
  estadosAvion: any[] = [];
  modelosAvion: ModeloAvion[] = [];

  aviones: Avion[] = [];

  filtros: any = {
    q: '',
    aerolineaId: '',
    estadoAvionId: '',
    modeloAvionId: '',
    estadoId: '',
    anio: ''
  };

  aerolineaMap: Record<number, string> = {};
  estadoAvionMap: Record<number, string> = {};
  modeloAvionMap: Record<number, string> = {};

  cargandoCatalogos = false;
  cargandoAviones = false;

  constructor(
    private catalogo: CatalogoService,
    private modeloService: ModeloAvionService,
    private avionService: AvionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogosYAviones();
  }

  cargarCatalogosYAviones(): void {
    this.cargandoCatalogos = true;

    forkJoin({
      aerolineas: this.catalogo.aerolinea(),
      estadosAvion: this.catalogo.estadoAvion(),
      modelosAvion: this.modeloService.getModelos({ size: 100 })
    }).subscribe({
      next: ({ aerolineas, estadosAvion, modelosAvion }) => {
        this.aerolineas = aerolineas ?? [];
        this.estadosAvion = estadosAvion ?? [];
        this.modelosAvion = modelosAvion ?? [];

        this.aerolineaMap = Object.fromEntries(this.aerolineas.map((a: any) => [Number(a.id), a.nombre ?? a.descripcion ?? a.label ?? String(a.id)]));
        this.estadoAvionMap = Object.fromEntries(this.estadosAvion.map((e: any) => [Number(e.id), e.nombre ?? e.codigo ?? e.label ?? String(e.id)]));
        this.modeloAvionMap = Object.fromEntries(this.modelosAvion.map((m) => [Number(m.id), `${m.fabricante} ${m.nombre}`.trim()]));

        this.cargandoCatalogos = false;
        this.cargarAviones();
      },
      error: (err) => {
        console.error(err);
        this.cargandoCatalogos = false;
        alert('Error cargando catálogos');
      }
    });
  }

  cargarAviones(extraFilters: Record<string, any> = {}): void {
    this.cargandoAviones = true;
    const filters = { page: 0, size: 100, ...this.filtros, ...extraFilters };

    this.avionService.getAviones(filters).subscribe({
      next: (data) => {
        this.aviones = data ?? [];
        this.cargandoAviones = false;
      },
      error: (err) => {
        console.error(err);
        this.cargandoAviones = false;
        alert('Error cargando aviones');
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarAviones();
  }

  limpiarFiltros(): void {
    this.filtros = { q: '', aerolineaId: '', estadoAvionId: '', modeloAvionId: '', estadoId: '', anio: '' };
    this.cargarAviones();
  }

  eliminar(avion: Avion): void {
    if (!confirm(`¿Eliminar avión ${avion.codigoAvion}?`)) return;
    this.avionService.eliminarAvion(avion.id).subscribe({
      next: () => {
        alert('Avión eliminado');
        this.cargarAviones();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Error al eliminar avión');
      }
    });
  }

  irNuevo(): void {
    this.router.navigate(['/menu/aerolinea/aviones/nuevo']);
  }

  irEditar(id: number): void {
    this.router.navigate(['/menu/aerolinea/aviones/editar', id]);
  }

  irMenu(): void {
    this.router.navigate(['/menu']);
  }

}
