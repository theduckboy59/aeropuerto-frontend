import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Aeropuerto, AeropuertosService } from '../../services/aeropuertos.service';

@Component({
  selector: 'app-aeropuertos',
  templateUrl: './aeropuertos.component.html',
  styleUrl: './aeropuertos.component.css'
})
export class AeropuertosComponent implements OnInit {
  aeropuertos: Aeropuerto[] = [];
  cargando = false;

  filtros = {
    nombre: '',
    pais: ''
  };

  private searchTimer: any = null;

  constructor(
    private service: AeropuertosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;

    this.service.listar(this.filtros).subscribe({
      next: (data) => {
        this.cargando = false;
        this.aeropuertos = data || [];
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al cargar aeropuertos';
        alert(message);
      }
    });
  }

  onFiltroChange() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => this.cargar(), 300);
  }

  buscar() {
    this.cargar();
  }

  limpiar() {
    this.filtros = {
      nombre: '',
      pais: ''
    };

    this.cargar();
  }

  crear() {
    this.router.navigate(['/menu/aerolinea/aeropuertos/nuevo']);
  }

  editar(item: Aeropuerto) {
    if (!item?.id) return;

    this.router.navigate([
      '/menu/aerolinea/aeropuertos/editar',
      item.id
    ]);
  }

  eliminar(item: Aeropuerto) {
    if (!item?.id) return;

    if (!confirm('¿Eliminar aeropuerto? También se inactivarán sus puertas.')) {
      return;
    }

    this.service.eliminar(item.id).subscribe({
      next: () => {
        alert('Aeropuerto eliminado');
        this.cargar();
      },
      error: (e) => {
        const message = e.error?.message || 'Error al eliminar aeropuerto';
        alert(message);
      }
    });
  }

  getPuertasLabel(a: Aeropuerto) {
    const puertas = (a?.puertas || [])
      .map(p => (p?.codigo || '').trim())
      .filter(Boolean);

    return puertas.length ? puertas.join(', ') : '-';
  }
}