import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Avion, AvionService } from '../../services/avion.service';
import { CatalogoService } from '../../services/catalogo.service';
import {
  ConfigClaseFilasAvion,
  ConfigClaseFilasAvionRequest,
  ConfigClaseFilasAvionService
} from '../../services/config-clase-filas-avion.service';
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
  configsActivasAvion: ConfigClaseFilasAvion[] = [];

  form = this.getEmptyForm();

  avionSeleccionado: Avion | null = null;

  cargando = false;
  guardando = false;
  errorMsg: string | null = null;

  constructor(
    private avionService: AvionService,
    private catalogo: CatalogoService,
    private configService: ConfigClaseFilasAvionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarInicial();
  }

  private getEmptyForm() {
    return {
      avionId: '',
      claseVueloId: '',
      filaDesde: '',
      filaHasta: ''
    };
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
        this.clasesVuelo = this.filtrarClasesVendibles(clases ?? []);

        this.aplicarParametrosDeEntrada();

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        this.errorMsg = getApiErrorMessage(err, 'Error cargando datos iniciales');
        alert(this.errorMsg);
      }
    });
  }

  private aplicarParametrosDeEntrada(): void {
  const avionIdParam = this.route.snapshot.queryParamMap.get('avionId');
  const claseParam = this.route.snapshot.queryParamMap.get('clase');

  if (avionIdParam) {
    this.form.avionId = avionIdParam;
    this.onAvionChange(false);
  }

  if (claseParam) {
    const clase = this.buscarClasePorNombre(claseParam);

    if (clase?.id != null) {
      this.form.claseVueloId = String(clase.id);
    }
  }
}

  onAvionChange(limpiarCampos = true): void {
    const avionId = Number(this.form.avionId);

    this.avionSeleccionado =
      this.aviones.find((a) => Number(a.id) === avionId) ?? null;

    this.configsActivasAvion = [];

    if (limpiarCampos) {
      this.form.claseVueloId = '';
      this.form.filaDesde = '';
      this.form.filaHasta = '';
    }

    if (!this.avionSeleccionado) {
      return;
    }

    this.cargarConfiguracionesDelAvion(avionId);
  }

  cargarConfiguracionesDelAvion(avionId: number): void {
    this.configService.obtenerCompleta(avionId).subscribe({
      next: (data) => {
        this.configsActivasAvion = (data.configuraciones ?? [])
          .filter((c) => c.id !== null)
          .filter((c) => c.activo !== false);
      },
      error: (err) => {
        console.error(err);
        this.configsActivasAvion = [];
      }
    });
  }

  guardar(): void {
    const validacion = this.validar();

    if (validacion) {
      alert(validacion);
      return;
    }

    const avionId = Number(this.form.avionId);

    const payload: ConfigClaseFilasAvionRequest = {
      claseVueloId: Number(this.form.claseVueloId),
      filaDesde: Number(this.form.filaDesde),
      filaHasta: Number(this.form.filaHasta),
      activo: true
    };

    this.guardando = true;

    this.configService.crearRango(avionId, payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Rango creado correctamente');
        this.regresar();
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        alert(getApiErrorMessage(err, 'Error creando rango'));
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

  getFilasInhabilitadasAutomaticas(): string {
    if (!this.avionSeleccionado) {
      return 'Seleccione un avión.';
    }

    const filasMax = Number(this.avionSeleccionado.filasConfiguradas || 0);

    if (!filasMax) {
      return 'El avión no tiene filas configuradas.';
    }

    const ocupadas = new Set<number>();

    for (const rango of this.configsActivasAvion) {
      const desde = Number(rango.filaDesde);
      const hasta = Number(rango.filaHasta);

      if (!desde || !hasta) {
        continue;
      }

      for (let fila = desde; fila <= hasta; fila++) {
        ocupadas.add(fila);
      }
    }

    const desdeNuevo = Number(this.form.filaDesde);
    const hastaNuevo = Number(this.form.filaHasta);

    if (desdeNuevo > 0 && hastaNuevo >= desdeNuevo) {
      for (let fila = desdeNuevo; fila <= hastaNuevo; fila++) {
        ocupadas.add(fila);
      }
    }

    const libres: string[] = [];
    let fila = 1;

    while (fila <= filasMax) {
      if (ocupadas.has(fila)) {
        fila++;
        continue;
      }

      const inicio = fila;

      while (fila <= filasMax && !ocupadas.has(fila)) {
        fila++;
      }

      const fin = fila - 1;

      libres.push(inicio === fin ? String(inicio) : `${inicio}-${fin}`);
    }

    return libres.length ? libres.join(', ') : 'Ninguna';
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

  private filtrarClasesVendibles(clases: any[]): any[] {
    return clases.filter((clase: any) => {
      const nombre = this.normalizar(
        clase.nombre ?? clase.descripcion ?? clase.label ?? ''
      );

      return nombre === 'ECONOMICA' || nombre === 'EJECUTIVA';
    });
  }

  private buscarClasePorNombre(nombreClase: string): any | null {
    const objetivo = this.normalizar(nombreClase);

    return this.clasesVuelo.find((clase: any) => {
      const nombre = this.normalizar(
        clase.nombre ?? clase.descripcion ?? clase.label ?? ''
      );

      return nombre === objetivo;
    }) ?? null;
  }

  private normalizar(valor: string): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }
}