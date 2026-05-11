import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Avion, AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ModeloAvion, ModeloAvionService } from '../../services/modelo-avion.service';

@Component({
  selector: 'app-avion-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './avion-edit.component.html',
  styleUrl: './avion-edit.component.css'
})
export class AvionEditComponent implements OnInit {
  avionId: number | null = null;
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
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.avionId = idParam ? Number(idParam) : null;

    if (this.avionId === null || Number.isNaN(this.avionId)) {
      alert('Avión no encontrado');
      this.router.navigate(['/menu/aerolinea/aviones']);
      return;
    }

    this.cargarTodo(this.avionId);
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

  private cargarTodo(id: number): void {
    this.cargando = true;
    forkJoin({
      aerolineas: this.catalogo.aerolinea(),
      estadosAvion: this.catalogo.estadoAvion(),
      modelosAvion: this.modeloService.getModelos({ size: 100 }),
      avion: this.avionService.getAvion(id)
    }).subscribe({
      next: ({ aerolineas, estadosAvion, modelosAvion, avion }) => {
        this.aerolineas = aerolineas ?? [];
        this.estadosAvion = estadosAvion ?? [];
        this.modelosAvion = modelosAvion ?? [];

        this.setFormFromAvion(avion);
        this.onModeloChange();

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert(err.error?.message || 'Error cargando datos del avión');
        this.router.navigate(['/menu/aerolinea/aviones']);
      }
    });
  }

  private setFormFromAvion(avion: Avion): void {
    this.form = {
      aerolineaId: avion.aerolineaId,
      estadoAvionId: avion.estadoAvionId,
      modeloAvionId: avion.modeloAvionId,
      codigoAvion: avion.codigoAvion,
      numeroSerie: avion.numeroSerie ?? '',
      anio: avion.anio,
      filasConfiguradas: avion.filasConfiguradas,
      estadoId: avion.estadoId ?? 1
    };
  }

  onModeloChange(): void {
    const modeloAvionId = Number(this.form.modeloAvionId);
    this.modeloSeleccionado = this.modelosAvion.find((m) => m.id === modeloAvionId) ?? null;
  }

  guardar(): void {
    if (this.avionId === null) {
      alert('Avión no encontrado');
      return;
    }

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

    this.avionService.actualizarAvion(this.avionId, payload as any).subscribe({
      next: () => {
        alert('Avión actualizado');
        this.router.navigate(['/menu/aerolinea/aviones']);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Error al actualizar avión');
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/menu/aerolinea/aviones']);
  }
}
