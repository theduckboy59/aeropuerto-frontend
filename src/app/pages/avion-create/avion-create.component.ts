import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ModeloAvion, ModeloAvionService } from '../../services/modelo-avion.service';

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

  private getEmptyForm() {
    return {
      aerolineaId: '',
      estadoAvionId: '',
      modeloAvionId: '',
      codigoAvion: '',
      numeroSerie: '',
      anio: '',
      filasConfiguradas: '',
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

        const activo = this.estadosAvion.find((e: any) => (e.nombre ?? e.codigo) === 'ACTIVO');
        if (activo?.id != null) this.form.estadoAvionId = Number(activo.id);

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
    this.modeloSeleccionado = this.modelosAvion.find((m) => m.id === modeloAvionId) ?? null;
    this.form.filasConfiguradas = '';
  }

  guardar(): void {
    const requiredFields = [
      { key: 'aerolineaId', label: 'Aerolínea' },
      { key: 'estadoAvionId', label: 'Estado operativo' },
      { key: 'modeloAvionId', label: 'Modelo' },
      { key: 'codigoAvion', label: 'Código avión' },
      { key: 'anio', label: 'Año' },
      { key: 'filasConfiguradas', label: 'Filas configuradas' }
    ];

    const faltante = requiredFields.find((f) => {
      const v = this.form[f.key];
      return v === null || v === undefined || v === '';
    });

    if (faltante) {
      alert(`Campo requerido: ${faltante.label}`);
      return;
    }

    const anio = Number(this.form.anio);
    if (Number.isNaN(anio) || anio < 1950) {
      alert('Año inválido (mínimo 1950)');
      return;
    }

    if (!this.modeloSeleccionado) {
      alert('Seleccione un modelo de avión');
      return;
    }

    const filas = Number(this.form.filasConfiguradas);
    if (Number.isNaN(filas) || filas < this.modeloSeleccionado.filasMin || filas > this.modeloSeleccionado.filasMax) {
      alert(`Filas inválidas: debe estar entre ${this.modeloSeleccionado.filasMin} y ${this.modeloSeleccionado.filasMax}`);
      return;
    }

    const payload = {
      aerolineaId: Number(this.form.aerolineaId),
      estadoAvionId: Number(this.form.estadoAvionId),
      modeloAvionId: Number(this.form.modeloAvionId),
      codigoAvion: String(this.form.codigoAvion).trim(),
      numeroSerie: this.form.numeroSerie ? String(this.form.numeroSerie).trim() : undefined,
      anio,
      filasConfiguradas: filas,
      estadoId: Number(this.form.estadoId ?? 1)
    };

    this.avionService.crearAvion(payload as any).subscribe({
      next: () => {
        alert('Avión creado correctamente');
        this.router.navigate(['/menu/aerolinea/aviones']);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Error al crear avión');
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/aviones']);
  }
}
