import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Avion, AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ConfigClaseFilasAvion, ConfigClaseFilasAvionService } from '../../services/config-clase-filas-avion.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-config-clase-filas-avion-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './config-clase-filas-avion-edit.component.html',
  styleUrl: './config-clase-filas-avion-edit.component.css'
})
export class ConfigClaseFilasAvionEditComponent implements OnInit {
  id: number | null = null;

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
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;
    if (this.id === null || Number.isNaN(this.id)) {
      alert('Configuración no encontrada');
      this.regresar();
      return;
    }

    this.cargarTodo(this.id);
  }

  private getEmptyForm() {
    return {
      avionId: '',
      claseVueloId: '',
      filaDesde: '',
      filaHasta: '',
      activo: true
    };
  }

  private cargarTodo(id: number): void {
    this.cargando = true;
    forkJoin({
      aviones: this.avionService.getAviones({ size: 100 }),
      clases: this.catalogo.claseVuelo(),
      config: this.configService.getById(id)
    }).subscribe({
      next: ({ aviones, clases, config }) => {
        this.aviones = aviones ?? [];
        this.clasesVuelo = clases ?? [];

        this.form = {
          avionId: config.avionId,
          claseVueloId: config.claseVueloId,
          filaDesde: config.filaDesde,
          filaHasta: config.filaHasta,
          activo: config.activo
        };

        this.onAvionChange(false);
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(getApiErrorMessage(err, 'Error cargando configuración'));
        this.regresar();
      }
    });
  }

  onAvionChange(resetFilas = true): void {
    const avionId = Number(this.form.avionId);
    this.avionSeleccionado = this.aviones.find((a) => Number(a.id) === avionId) ?? null;

    if (resetFilas) {
      this.form.filaDesde = '';
      this.form.filaHasta = '';
    }

    this.configsActivasAvion = [];
    if (!this.avionSeleccionado || this.id == null) return;

    this.configService.listar({ avionId, activo: true, page: 0, size: 100 }).subscribe({
      next: (page) => {
        const content: ConfigClaseFilasAvion[] = page?.content ?? [];
        this.configsActivasAvion = content.filter((c) => Number(c.id) !== Number(this.id));
      },
      error: (err) => {
        console.error(err);
        alert(getApiErrorMessage(err, 'Error cargando configuraciones del avión'));
      }
    });
  }

  guardar(): void {
    if (this.id === null) {
      alert('Configuración no encontrada');
      return;
    }

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
    const activo = !!this.form.activo;

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

    if (activo) {
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
    }

    this.configService
      .actualizar(this.id, {
        avionId: Number(this.form.avionId),
        claseVueloId,
        filaDesde,
        filaHasta,
        activo
      })
      .subscribe({
        next: () => {
          alert('Configuración actualizada correctamente.');
          this.regresar();
        },
        error: (err) => {
          console.error(err);
          alert(getApiErrorMessage(err, 'Error al actualizar'));
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
