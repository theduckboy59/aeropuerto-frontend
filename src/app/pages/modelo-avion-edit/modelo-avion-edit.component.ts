import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloAvionService, ModeloAvionRequest } from '../../services/modelo-avion.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-modelo-avion-edit',
  templateUrl: './modelo-avion-edit.component.html',
  styleUrl: './modelo-avion-edit.component.css'
})
export class ModeloAvionEditComponent implements OnInit {
  id: number | null = null;

  form: ModeloAvionRequest = {
    fabricante: '',
    codigoModelo: '',
    nombre: '',
    niveles: 1,
    pasillos: 1,
    configuracion: '',
    totalColumnas: 1,
    filasMin: 1,
    filasMax: 1,
    estadoId: 1
  };

  cargando = false;
  cargandoDetalle = false;

  constructor(
    private route: ActivatedRoute,
    private service: ModeloAvionService,
    private router: Router
  ) {}

  ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? Number(raw) : NaN;
    if (!id || Number.isNaN(id)) {
      alert('ID inválido');
      this.regresar();
      return;
    }

    this.id = id;
    this.cargarDetalle();
  }

  cargarDetalle() {
    if (!this.id) return;
    this.cargandoDetalle = true;
    this.service.getModelo(this.id).subscribe({
      next: (data) => {
        this.cargandoDetalle = false;
        this.form = {
          fabricante: data?.fabricante || '',
          codigoModelo: data?.codigoModelo || '',
          nombre: data?.nombre || '',
          niveles: data?.niveles || 1,
          pasillos: data?.pasillos || 1,
          configuracion: data?.configuracion || '',
          totalColumnas: data?.totalColumnas || 1,
          filasMin: data?.filasMin || 1,
          filasMax: data?.filasMax || 1,
          estadoId: data?.estadoId || 1
        };
      },
      error: (e) => {
        this.cargandoDetalle = false;
        const message = getApiErrorMessage(e, 'Error al cargar modelo de avión');
        alert(message);
        this.regresar();
      }
    });
  }

  guardar() {
    if (!this.id) return;
    const msg = this.validar();
    if (msg) {
      alert(msg);
      return;
    }

    const payload: ModeloAvionRequest = {
      fabricante: this.form.fabricante.trim(),
      codigoModelo: this.form.codigoModelo.trim(),
      nombre: this.form.nombre.trim(),
      niveles: this.form.niveles,
      pasillos: this.form.pasillos,
      configuracion: this.form.configuracion.trim(),
      totalColumnas: this.form.totalColumnas,
      filasMin: this.form.filasMin,
      filasMax: this.form.filasMax,
      estadoId: this.form.estadoId || 1
    };

    this.cargando = true;
    this.service.actualizarModelo(this.id, payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Modelo de avión actualizado correctamente');
        this.router.navigate(['/menu/aerolinea/modelo-avion']);
      },
      error: (e) => {
        this.cargando = false;
        const message = getApiErrorMessage(e, 'Error al editar modelo de avión');
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/modelo-avion']);
  }

  private validar(): string {
    // Validaciones básicas
    if (!this.form.fabricante.trim()) return 'Fabricante obligatorio';
    if (!this.form.codigoModelo.trim()) return 'Código de modelo obligatorio';
    if (!this.form.nombre.trim()) return 'Nombre obligatorio';
    if (!this.form.configuracion.trim()) return 'Configuración obligatoria';

    // Validaciones numéricas
    if (!Number.isInteger(this.form.niveles) || this.form.niveles < 1 || this.form.niveles > 2) {
      return 'Niveles debe ser 1 o 2';
    }
    if (!Number.isInteger(this.form.pasillos) || this.form.pasillos < 1) {
      return 'Pasillos debe ser mayor a 0';
    }
    if (!Number.isInteger(this.form.totalColumnas) || this.form.totalColumnas < 1) {
      return 'Total de columnas debe ser mayor a 0';
    }
    if (!Number.isInteger(this.form.filasMin) || this.form.filasMin < 1) {
      return 'Filas mínimas debe ser mayor a 0';
    }
    if (!Number.isInteger(this.form.filasMax) || this.form.filasMax < 1) {
      return 'Filas máximas debe ser mayor a 0';
    }
    if (this.form.filasMax < this.form.filasMin) {
      return 'Filas máximas debe ser >= Filas mínimas';
    }

    // Validación de formato de configuración
    const configRegex = /^[0-9]+(-[0-9]+)*$/;
    if (!configRegex.test(this.form.configuracion)) {
      return 'Configuración debe tener formato válido (ej: 3-3, 3-4-3)';
    }

    // Validación de suma de bloques
    const bloques = this.form.configuracion.split('-').map(b => parseInt(b, 10));
    const suma = bloques.reduce((a, b) => a + b, 0);

    if (suma !== this.form.totalColumnas) {
      return `Suma de configuración (${suma}) debe coincidir con total de columnas (${this.form.totalColumnas})`;
    }

    // Validación de pasillos vs bloques
    const bloquesCount = bloques.length;
    const pasillosEsperados = bloquesCount - 1;

    if (this.form.pasillos !== pasillosEsperados) {
      return `Pasillos debe ser ${pasillosEsperados} (bloques: ${bloquesCount})`;
    }

    return '';
  }
}
