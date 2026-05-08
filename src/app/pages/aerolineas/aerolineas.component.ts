import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Aerolinea, AerolineasService } from '../../services/aerolineas.service';

@Component({
  selector: 'app-aerolineas',
  templateUrl: './aerolineas.component.html',
  styleUrl: './aerolineas.component.css'
})
export class AerolineasComponent implements OnInit {
  aerolineas: Aerolinea[] = [];
  cargando = false;

  search = {
    nombre: ''
  };

  private searchTimer: any = null;

  constructor(
    private service: AerolineasService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar(nombre?: string) {
    this.cargando = true;
    this.service.listar(nombre).subscribe({
      next: (data) => {
        this.cargando = false;
        this.aerolineas = data || [];
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al cargar aerolíneas';
        alert(message);
      }
    });
  }

  onNombreChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.buscar(), 300);
  }

  buscar() {
    const nombre = (this.search.nombre || '').trim();
    this.cargar(nombre || undefined);
  }

  limpiar() {
    this.search.nombre = '';
    this.cargar();
  }

  crear() {
    this.router.navigate(['/menu/aerolinea/aerolineas/nuevo']);
  }

  editar(item: Aerolinea) {
    if (!item?.id) return;
    this.router.navigate(['/menu/aerolinea/aerolineas/editar', item.id]);
  }

  eliminar(item: Aerolinea) {
    if (!item?.id) return;
    if (!confirm('¿Eliminar aerolínea? (borrado lógico)')) return;

    this.service.eliminar(item.id).subscribe({
      next: () => {
        alert('Aerolínea eliminada');
        this.buscar();
      },
      error: (e) => {
        const message = e.error?.message || 'Error al eliminar aerolínea';
        alert(message);
      }
    });
  }
}

