import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoService } from '../../services/catalogo.service';
import { DestinoAutorizado, DestinosAutorizadosService } from '../../services/destinos-autorizados.service';

@Component({
  selector: 'app-destinos-autorizados',
  templateUrl: './destinos-autorizados.component.html',
  styleUrl: './destinos-autorizados.component.css'
})
export class DestinosAutorizadosComponent implements OnInit {
  destinos: DestinoAutorizado[] = [];
  cargando = false;

  aerolineas: any[] = [];
  aeropuertos: any[] = [];
  aerolineaMap: Record<string, string> = {};
  aeropuertoMap: Record<string, string> = {};

  filtros = {
    aerolineaId: '',
    aeropuertoId: '',
    pais: '',
    estadoId: ''
  };

  estados = [
    { id: 1, nombre: 'ACTIVO' },
    { id: 2, nombre: 'INACTIVO' }
  ];

  private searchTimer: any = null;

  constructor(
    private service: DestinosAutorizadosService,
    private catalogo: CatalogoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCatalogos();
    this.cargar();
  }

  cargarCatalogos() {
    this.catalogo.aerolinea().subscribe({
      next: (d) => {
        this.aerolineas = d || [];
        this.aerolineaMap = this.buildMap(this.aerolineas);
      },
      error: () => {
        this.aerolineas = [];
        this.aerolineaMap = {};
      }
    });

    this.catalogo.aeropuerto().subscribe({
      next: (d) => {
        this.aeropuertos = d || [];
        this.aeropuertoMap = this.buildMap(this.aeropuertos);
      },
      error: () => {
        this.aeropuertos = [];
        this.aeropuertoMap = {};
      }
    });
  }

  cargar() {
    this.cargando = true;
    this.service.listar(this.filtros).subscribe({
      next: (data) => {
        this.cargando = false;
        this.destinos = data || [];
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al cargar destinos autorizados';
        alert(message);
      }
    });
  }

  onFiltroChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.cargar(), 300);
  }

  limpiar() {
    this.filtros = { aerolineaId: '', aeropuertoId: '', pais: '', estadoId: '' };
    this.cargar();
  }

  crear() {
    this.router.navigate(['/menu/aerolinea/destinos-autorizados/nuevo']);
  }

  editar(item: DestinoAutorizado) {
    if (!item?.id) return;
    this.router.navigate(['/menu/aerolinea/destinos-autorizados/editar', item.id]);
  }

  eliminar(item: DestinoAutorizado) {
    if (!item?.id) return;
    if (!confirm('¿Eliminar destino autorizado? (borrado lógico)')) return;

    this.service.eliminar(item.id).subscribe({
      next: () => {
        alert('Destino autorizado eliminado');
        this.cargar();
      },
      error: (e) => {
        const message = e.error?.message || 'Error al eliminar destino autorizado';
        alert(message);
      }
    });
  }

  getAerolineaLabel(d: DestinoAutorizado) {
    return d?.aerolineaNombre || this.aerolineaMap[String(d?.aerolineaId)] || d?.aerolineaId || '-';
  }

  getAeropuertoLabel(d: DestinoAutorizado) {
    return d?.aeropuertoNombre || this.aeropuertoMap[String(d?.aeropuertoId)] || d?.aeropuertoId || '-';
  }

  private buildMap(items: any[]) {
    return (items || []).reduce((acc: Record<string, string>, item: any) => {
      const label = item?.nombre || item?.descripcion || item?.label || '';
      if (label && item?.id != null) {
        acc[String(item.id)] = label;
      }
      return acc;
    }, {});
  }
}

