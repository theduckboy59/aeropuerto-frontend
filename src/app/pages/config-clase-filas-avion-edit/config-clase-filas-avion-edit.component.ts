import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Avion, AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import {
  ConfigClaseFilasAvion,
  ConfigClaseFilasAvionCompleta,
  ConfigClaseFilasAvionRequest,
  ConfigClaseFilasAvionService
} from '../../services/config-clase-filas-avion.service';
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
  configsCompletas: ConfigClaseFilasAvionCompleta[] = [];
  configsActivasAvion: ConfigClaseFilasAvion[] = [];

  form: any = this.getEmptyForm();

  avionSeleccionado: Avion | null = null;
  configActual: ConfigClaseFilasAvion | null = null;

  cargando = false;
  guardando = false;

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

    this.cargarTodo();
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

  private cargarTodo(): void {
    this.cargando = true;

    forkJoin({
      aviones: this.avionService.getAviones({ size: 100 }),
      clases: this.catalogo.claseVuelo(),
      configs: this.configService.listarAvionesActivosCompletos()
    }).subscribe({
      next: ({ aviones, clases, configs }) => {
        this.aviones = aviones ?? [];
        this.clasesVuelo = this.filtrarClasesVendibles(clases ?? []);
        this.configsCompletas = configs ?? [];

        const encontrado = this.buscarRangoPorId(Number(this.id));

        if (!encontrado) {
          this.cargando = false;
          alert('No se encontró el rango seleccionado.');
          this.regresar();
          return;
        }

        this.configActual = encontrado.rango;

        this.form = {
          avionId: encontrado.rango.avionId,
          claseVueloId: encontrado.rango.claseVueloId,
          filaDesde: encontrado.rango.filaDesde,
          filaHasta: encontrado.rango.filaHasta,
          activo: encontrado.rango.activo
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

  onAvionChange(limpiarFilas = true): void {
    const avionId = Number(this.form.avionId);

    this.avionSeleccionado =
      this.aviones.find((a) => Number(a.id) === avionId) ?? null;

    if (limpiarFilas) {
      this.form.filaDesde = '';
      this.form.filaHasta = '';
    }

    this.configsActivasAvion = [];

    const completa = this.configsCompletas.find(
      (c) => Number(c.avionId) === avionId
    );

    if (!completa) {
      return;
    }

    this.configsActivasAvion = (completa.configuraciones ?? [])
      .filter((c) => c.id !== null)
      .filter((c) => Number(c.id) !== Number(this.id))
      .filter((c) => c.activo !== false);
  }

  guardar(): void {
    if (this.id === null) {
      alert('Configuración no encontrada');
      return;
    }

    const validacion = this.validar();

    if (validacion) {
      alert(validacion);
      return;
    }

    const payload: ConfigClaseFilasAvionRequest = {
      avionId: Number(this.form.avionId),
      claseVueloId: Number(this.form.claseVueloId),
      filaDesde: Number(this.form.filaDesde),
      filaHasta: Number(this.form.filaHasta),
      activo: Boolean(this.form.activo)
    };

    this.guardando = true;

    this.configService.actualizarRango(this.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Rango actualizado correctamente');
        this.regresar();
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        alert(getApiErrorMessage(err, 'Error actualizando rango'));
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/config-clase-filas-avion']);
  }

  getClaseNombre(id: any): string {
    const clase = this.clasesVuelo.find((c: any) => Number(c.id) === Number(id));

    return clase
      ? clase.nombre || clase.descripcion || clase.label || String(id)
      : String(id || '');
  }

  private validar(): string {
    if (!this.form.avionId) {
      return 'Seleccione un avión.';
    }

    if (!this.avionSeleccionado) {
      return 'Seleccione un avión válido.';
    }

    if (!this.form.claseVueloId) {
      return 'Seleccione una clase.';
    }

    if (this.form.filaDesde === '' || this.form.filaHasta === '') {
      return 'Ingrese fila desde y fila hasta.';
    }

    const desde = Number(this.form.filaDesde);
    const hasta = Number(this.form.filaHasta);
    const filasMax = Number(this.avionSeleccionado.filasConfiguradas);

    if (Number.isNaN(desde) || desde <= 0) {
      return 'La fila desde debe ser mayor a 0.';
    }

    if (Number.isNaN(hasta) || hasta < desde) {
      return 'La fila hasta no puede ser menor que la fila desde.';
    }

    if (hasta > filasMax) {
      return `La fila hasta no puede superar las ${filasMax} filas configuradas del avión.`;
    }

    return '';
  }

  private buscarRangoPorId(rangoId: number): {
    completa: ConfigClaseFilasAvionCompleta;
    rango: ConfigClaseFilasAvion;
  } | null {
    for (const completa of this.configsCompletas) {
      const rango = (completa.configuraciones ?? []).find(
        (r) => Number(r.id) === rangoId
      );

      if (rango) {
        return {
          completa,
          rango
        };
      }
    }

    return null;
  }

  private filtrarClasesVendibles(clases: any[]): any[] {
    return clases.filter((clase: any) => {
      const nombre = this.normalizar(
        clase.nombre ?? clase.descripcion ?? clase.label ?? ''
      );

      return nombre === 'ECONOMICA' || nombre === 'EJECUTIVA';
    });
  }

  private normalizar(valor: string): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }
}