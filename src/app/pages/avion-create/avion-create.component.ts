import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import {
  ModeloAvion,
  ModeloAvionRequest,
  ModeloAvionService
} from '../../services/modelo-avion.service';

@Component({
  selector: 'app-avion-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './avion-create.component.html',
  styleUrl: './avion-create.component.css'
})
export class AvionCreateComponent implements OnInit {
  form: any = this.getEmptyForm();

  aerolineas: any[] = [];
  estadosAvion: any[] = [];
  modelosAvion: ModeloAvion[] = [];

  modeloSeleccionado: ModeloAvion | null = null;

  modeloPersonalizado = false;
  modeloPersonalizadoForm: ModeloAvionRequest = this.getEmptyModeloPersonalizadoForm();

  cargando = false;

  constructor(
    private avionService: AvionService,
    private catalogo: CatalogoService,
    private modeloService: ModeloAvionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  private getEmptyForm(): any {
    return {
      aerolineaId: '',
      estadoAvionId: '',
      modeloAvionId: '',
      numeroSerie: '',
      anio: '',
      filasConfiguradas: ''
    };
  }

  private getEmptyModeloPersonalizadoForm(): ModeloAvionRequest {
    return {
      fabricante: 'Personalizado',
      codigoModelo: `CUSTOM-${Date.now()}`,
      nombre: 'Modelo personalizado 3 asientos',
      niveles: 1,
      pasillos: 0,
      configuracion: '3',
      totalColumnas: 3,
      filasMin: 1,
      filasMax: 1,
      estadoId: 1
    };
  }

  cargarCatalogos(): void {
    this.cargando = true;

    forkJoin({
      aerolineas: this.catalogo.aerolinea(),
      estadosAvion: this.catalogo.estadoAvion(),
      modelosAvion: this.modeloService.getModelos({ size: 100 })
    }).subscribe({
      next: ({ aerolineas, estadosAvion, modelosAvion }) => {
        this.aerolineas = aerolineas ?? [];
        this.estadosAvion = estadosAvion ?? [];
        this.modelosAvion = modelosAvion ?? [];

        const activo = this.estadosAvion.find((e: any) =>
          String(e.nombre ?? e.codigo ?? '').toUpperCase() === 'ACTIVO'
        );

        if (activo?.id != null) {
          this.form.estadoAvionId = Number(activo.id);
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert('Error cargando catálogos');
      }
    });
  }

  onModeloChange(): void {
    const modeloAvionId = Number(this.form.modeloAvionId);

    this.modeloSeleccionado =
      this.modelosAvion.find((m) => Number(m.id) === modeloAvionId) ?? null;

    this.form.filasConfiguradas = '';
  }

  onModeloPersonalizadoChange(): void {
    if (this.modeloPersonalizado) {
      this.form.modeloAvionId = '';
      this.modeloSeleccionado = null;
      this.form.filasConfiguradas = Number(this.modeloPersonalizadoForm.filasMin || 1);
      return;
    }

    this.form.filasConfiguradas = '';
  }

  aplicarModeloTresAsientos(): void {
    this.modeloPersonalizadoForm = this.getEmptyModeloPersonalizadoForm();
    this.form.filasConfiguradas = 1;
  }

  guardar(): void {
    const requiredFields = [
      { key: 'aerolineaId', label: 'Aerolínea' },
      { key: 'estadoAvionId', label: 'Estado operativo' },
      { key: 'anio', label: 'Año' },
      { key: 'filasConfiguradas', label: 'Filas configuradas' }
    ];

    const faltante = requiredFields.find((f) => {
      const value = this.form[f.key];
      return value === null || value === undefined || value === '';
    });

    if (faltante) {
      alert(`Campo requerido: ${faltante.label}`);
      return;
    }

    if (!this.modeloPersonalizado && !this.form.modeloAvionId) {
      alert('Campo requerido: Modelo');
      return;
    }

    const anio = Number(this.form.anio);

    if (Number.isNaN(anio) || anio < 1950) {
      alert('Año inválido (mínimo 1950)');
      return;
    }

    const filas = Number(this.form.filasConfiguradas);

    if (Number.isNaN(filas) || filas < 1) {
      alert('Filas configuradas debe ser un número mayor a 0');
      return;
    }

    if (this.modeloPersonalizado) {
      const mensajeModelo = this.validarModeloPersonalizado();

      if (mensajeModelo) {
        alert(mensajeModelo);
        return;
      }

      const modeloPayload = this.buildModeloPersonalizadoPayload();

      if (filas < modeloPayload.filasMin || filas > modeloPayload.filasMax) {
        alert(
          `Filas inválidas: debe estar entre ${modeloPayload.filasMin} y ${modeloPayload.filasMax}`
        );
        return;
      }

      this.cargando = true;

      this.modeloService.crearModelo(modeloPayload).subscribe({
        next: (modeloCreado: ModeloAvion) => {
          const modeloId = Number(modeloCreado?.id);

          if (!modeloId) {
            this.cargando = false;
            alert('El modelo personalizado fue creado, pero no se recibió su ID.');
            return;
          }

          this.crearAvionConModelo(modeloId, anio, filas);
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
          alert(err.error?.message || 'Error al crear modelo personalizado');
        }
      });

      return;
    }

    if (!this.modeloSeleccionado) {
      alert('Seleccione un modelo de avión');
      return;
    }

    if (
      filas < this.modeloSeleccionado.filasMin ||
      filas > this.modeloSeleccionado.filasMax
    ) {
      alert(
        `Filas inválidas: debe estar entre ${this.modeloSeleccionado.filasMin} y ${this.modeloSeleccionado.filasMax}`
      );
      return;
    }

    this.cargando = true;
    this.crearAvionConModelo(Number(this.form.modeloAvionId), anio, filas);
  }

  private crearAvionConModelo(
    modeloAvionId: number,
    anio: number,
    filasConfiguradas: number
  ): void {
    const payload = {
      aerolineaId: Number(this.form.aerolineaId),
      estadoAvionId: Number(this.form.estadoAvionId),
      modeloAvionId,
      numeroSerie: this.form.numeroSerie
        ? String(this.form.numeroSerie).trim()
        : null,
      anio,
      filasConfiguradas
    };

    this.avionService.crearAvion(payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Avión creado correctamente');
        this.router.navigate(['/menu/aerolinea/aviones']);
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(err.error?.message || 'Error al crear avión');
      }
    });
  }

  private buildModeloPersonalizadoPayload(): ModeloAvionRequest {
    return {
      fabricante: String(this.modeloPersonalizadoForm.fabricante ?? '').trim(),
      codigoModelo: String(this.modeloPersonalizadoForm.codigoModelo ?? '').trim(),
      nombre: String(this.modeloPersonalizadoForm.nombre ?? '').trim(),
      niveles: Number(this.modeloPersonalizadoForm.niveles),
      pasillos: Number(this.modeloPersonalizadoForm.pasillos),
      configuracion: String(this.modeloPersonalizadoForm.configuracion ?? '').trim(),
      totalColumnas: Number(this.modeloPersonalizadoForm.totalColumnas),
      filasMin: Number(this.modeloPersonalizadoForm.filasMin),
      filasMax: Number(this.modeloPersonalizadoForm.filasMax),
      estadoId: Number(this.modeloPersonalizadoForm.estadoId ?? 1)
    };
  }

  private validarModeloPersonalizado(): string {
    const modelo = this.buildModeloPersonalizadoPayload();

    if (!modelo.fabricante) return 'Fabricante del modelo obligatorio';
    if (!modelo.codigoModelo) return 'Código del modelo obligatorio';
    if (!modelo.nombre) return 'Nombre del modelo obligatorio';
    if (!modelo.configuracion) return 'Configuración del modelo obligatoria';

    if (!Number.isInteger(modelo.niveles) || modelo.niveles < 1 || modelo.niveles > 2) {
      return 'Niveles debe ser 1 o 2';
    }

    if (!Number.isInteger(modelo.pasillos) || modelo.pasillos < 0) {
      return 'Pasillos debe ser 0 o mayor';
    }

    if (!Number.isInteger(modelo.totalColumnas) || modelo.totalColumnas < 1) {
      return 'Total columnas debe ser mayor a 0';
    }

    if (!Number.isInteger(modelo.filasMin) || modelo.filasMin < 1) {
      return 'Filas mínimas debe ser mayor a 0';
    }

    if (!Number.isInteger(modelo.filasMax) || modelo.filasMax < 1) {
      return 'Filas máximas debe ser mayor a 0';
    }

    if (modelo.filasMax < modelo.filasMin) {
      return 'Filas máximas debe ser mayor o igual a filas mínimas';
    }

    const regex = /^[0-9]+(-[0-9]+)*$/;

    if (!regex.test(modelo.configuracion)) {
      return 'Configuración inválida. Ejemplos válidos: 3, 1-2, 3-3, 3-4-3';
    }

    const bloques = modelo.configuracion
      .split('-')
      .map((value) => Number.parseInt(value, 10));

    if (bloques.some((value) => Number.isNaN(value) || value <= 0)) {
      return 'Cada bloque de configuración debe ser mayor a 0';
    }

    const totalConfiguracion = bloques.reduce((acc, value) => acc + value, 0);

    if (totalConfiguracion !== modelo.totalColumnas) {
      return `La suma de configuración (${totalConfiguracion}) debe coincidir con total columnas (${modelo.totalColumnas})`;
    }

    const pasillosEsperados = bloques.length - 1;

    if (modelo.pasillos !== pasillosEsperados) {
      return `Pasillos debe ser ${pasillosEsperados} según la configuración ingresada`;
    }

    return '';
  }

  getFilasPlaceholder(): string {
    if (this.modeloPersonalizado) {
      return `${this.modeloPersonalizadoForm.filasMin || 1} a ${this.modeloPersonalizadoForm.filasMax || 1}`;
    }

    return this.modeloSeleccionado
      ? `${this.modeloSeleccionado.filasMin} a ${this.modeloSeleccionado.filasMax}`
      : '';
  }

  getAsientosEstimados(): number {
    const filas = Number(this.form.filasConfiguradas || 0);

    if (!filas || filas <= 0) {
      return 0;
    }

    if (this.modeloPersonalizado) {
      const niveles = Number(this.modeloPersonalizadoForm.niveles || 0);
      const columnas = Number(this.modeloPersonalizadoForm.totalColumnas || 0);

      return niveles * filas * columnas;
    }

    if (!this.modeloSeleccionado) {
      return 0;
    }

    return this.modeloSeleccionado.niveles * filas * this.modeloSeleccionado.totalColumnas;
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/aviones']);
  }
}