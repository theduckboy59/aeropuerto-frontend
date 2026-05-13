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
  selector: 'app-config-clase-filas-avion-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './config-clase-filas-avion-create.component.html',
  styleUrl: './config-clase-filas-avion-create.component.css'
})
export class ConfigClaseFilasAvionCreateComponent implements OnInit {
  aviones: Avion[] = [];
  clasesVuelo: any[] = [];

  form: any = this.getEmptyForm();
  avionSeleccionado: Avion | null = null;
  configsActivasAvion: ConfigClaseFilasAvion[] = [];

  cargando = false;

  constructor(
    private avionService: AvionService,
    private catalogo: CatalogoService,
    private configService: ConfigClaseFilasAvionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  private getEmptyForm() {
    return {
      avionId: '',
      claseVueloId: '',
      filaDesde: '',
      filaHasta: ''
    };
  }

  cargarCatalogos(): void {
    this.cargando = true;
    forkJoin({
      aviones: this.avionService.getAviones({ size: 100 }),
      clases: this.catalogo.claseVuelo()
    }).subscribe({
      next: ({ aviones, clases }) => {
        this.aviones = aviones ?? [];
        this.clasesVuelo = clases ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando catálogos'));
      }
    });
  }

  onAvionChange(): void {
    const avionId = Number(this.form.avionId);
    this.avionSeleccionado = this.aviones.find((a) => Number(a.id) === avionId) ?? null;
    this.form.filaDesde = '';
    this.form.filaHasta = '';
    this.configsActivasAvion = [];

    if (!this.avionSeleccionado) return;

    this.configService.listar({ avionId, activo: true, page: 0, size: 100 }).subscribe({
      next: (page) => {
        this.configsActivasAvion = page?.content ?? [];
        this.autosugerirRango();
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error cargando configuraciones del avión'));
      }
    });
  }

  onClaseChange(): void {
    this.autosugerirRango();
  }

  private autosugerirRango(): void {
    if (!this.avionSeleccionado) return;
    if (!this.form.claseVueloId) return;

    const maxHasta = this.configsActivasAvion.reduce((acc, c) => Math.max(acc, Number(c.filaHasta) || 0), 0);
    const sugeridaDesde = maxHasta > 0 ? maxHasta + 1 : 1;
    const sugeridaHasta = Number(this.avionSeleccionado.filasConfiguradas);

    if (!this.form.filaDesde) this.form.filaDesde = sugeridaDesde;
    if (!this.form.filaHasta) this.form.filaHasta = sugeridaHasta;
  }

  guardar(): void {
    const requiredFields = [
      { key: 'avionId', label: 'Avión' },
      { key: 'claseVueloId', label: 'Clase de vuelo' },
      { key: 'filaDesde', label: 'Fila desde' },
      { key: 'filaHasta', label: 'Fila hasta' }
    ];

    const faltante = requiredFields.find((f) => {
      const v = this.form[f.key];
      return v === null || v === undefined || v === '';
    });
    if (faltante) {
      alert(`Campo requerido: ${faltante.label}`);
      return;
    }

    if (!this.avionSeleccionado) {
      alert('Seleccione un avión');
      return;
    }

    const filaDesde = Number(this.form.filaDesde);
    const filaHasta = Number(this.form.filaHasta);
    const claseVueloId = Number(this.form.claseVueloId);

    if (Number.isNaN(filaDesde) || filaDesde <= 0) {
      alert('La fila inicial debe ser mayor a 0.');
      return;
    }
    if (Number.isNaN(filaHasta) || filaHasta < filaDesde) {
      alert('La fila final no puede ser menor que la fila inicial.');
      return;
    }
    if (filaHasta > Number(this.avionSeleccionado.filasConfiguradas)) {
      alert('La fila final no puede ser mayor a las filas configuradas del avión.');
      return;
    }

    const claseYaExiste = this.configsActivasAvion.some((c) => Number(c.claseVueloId) === claseVueloId);
    if (claseYaExiste) {
      alert('El avión ya tiene una configuración activa para esa clase de vuelo.');
      return;
    }

    const cruce = this.configsActivasAvion.some((c) => filaDesde <= Number(c.filaHasta) && filaHasta >= Number(c.filaDesde));
    if (cruce) {
      alert('El rango de filas se cruza con otra clase ya configurada para este avión.');
      return;
    }

    this.configService
      .crear({
        avionId: Number(this.form.avionId),
        claseVueloId,
        filaDesde,
        filaHasta
      })
      .subscribe({
        next: () => {
          alert('Configuración creada correctamente.');
          this.router.navigate(['/menu/aerolinea/config-clase-filas-avion']);
        },
        error: (err) => {
          console.error(err);
          alert(getApiErrorMessage(err, 'Error al crear configuración'));
        }
      });
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/config-clase-filas-avion']);
  }

  getClaseNombre(id: any): string {
    const c = this.clasesVuelo.find((x: any) => String(x?.id) === String(id));
    return c?.nombre || c?.descripcion || c?.label || String(id || '');
  }

}
