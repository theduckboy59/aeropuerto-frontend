import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModeloAvion, ModeloAvionService } from '../../services/modelo-avion.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-modelo-avion',
  templateUrl: './modelo-avion.component.html',
  styleUrl: './modelo-avion.component.css'
})
export class ModeloAvionComponent implements OnInit {
  modelos: ModeloAvion[] = [];
  cargando: boolean = false;

  filtros: any = {
    q: '',
    size: 100
  };

  private searchTimer: any = null;

  constructor(
    private service: ModeloAvionService,
    private router: Router
  ) {
    console.log('[ModeloAvion] Componente inicializado');
  }

  ngOnInit(): void {
    console.log('[ModeloAvion] ngOnInit ejecutado');
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    console.log('[ModeloAvion] Cargando modelos con filtros:', this.filtros);

    this.service.getModelos(this.filtros).subscribe({
      next: (data: ModeloAvion[]) => {
        console.log('[ModeloAvion] ✅ Datos recibidos:', data);
        this.modelos = data || [];
        this.cargando = false;
        console.log('[ModeloAvion] Total modelos: ' + this.modelos.length);
      },
      error: (error: any) => {
        this.cargando = false;
        console.error('[ModeloAvion] ❌ Error:', error);
        const message = getApiErrorMessage(error, 'Error al cargar modelos de avión');
        alert(message);
      }
    });
  }

  onFiltroChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.cargar(), 300);
  }

  buscar(): void {
    this.cargar();
  }

  limpiar(): void {
    this.filtros = { q: '', size: 100 };
    this.cargar();
  }

  crear(): void {
    this.router.navigate(['/menu/aerolinea/modelo-avion/nuevo']);
  }

  editar(item: ModeloAvion): void {
    if (!item?.id) {
      alert('ID no válido');
      return;
    }
    this.router.navigate(['/menu/aerolinea/modelo-avion/editar', item.id]);
  }

  inactivar(item: ModeloAvion): void {
    if (!item?.id) {
      alert('ID no válido');
      return;
    }

    if (!confirm('¿Inactivar modelo de avión?')) {
      return;
    }

    this.service.cambiarEstado(item.id, 2).subscribe({
      next: () => {
        alert('Modelo inactivado');
        this.cargar();
      },
      error: (error: any) => {
        const message = getApiErrorMessage(error, 'Error al inactivar modelo');
        alert(message);
      }
    });
  }

  getCapacidadReferencia(item: ModeloAvion): string {
    if (!item) return '0 a 0';
    const min = item.filasMin * item.totalColumnas * item.niveles;
    const max = item.filasMax * item.totalColumnas * item.niveles;
    return `${min} a ${max}`;
  }
}