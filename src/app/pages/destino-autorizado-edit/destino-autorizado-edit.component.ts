import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogoService } from '../../services/catalogo.service';
import { DestinosAutorizadosService } from '../../services/destinos-autorizados.service';

@Component({
  selector: 'app-destino-autorizado-edit',
  templateUrl: './destino-autorizado-edit.component.html',
  styleUrl: './destino-autorizado-edit.component.css'
})
export class DestinoAutorizadoEditComponent implements OnInit {
  id: number | null = null;

  aerolineas: any[] = [];
  aeropuertos: any[] = [];

  form = {
    aerolineaId: '',
    aeropuertoId: ''
  };

  cargandoDetalle = false;
  cargando = false;

  constructor(
    private route: ActivatedRoute,
    private catalogo: CatalogoService,
    private service: DestinosAutorizadosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCatalogos();

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

  cargarCatalogos() {
    this.catalogo.aerolinea().subscribe({
      next: (d) => (this.aerolineas = d || []),
      error: () => (this.aerolineas = [])
    });

    this.catalogo.aeropuerto().subscribe({
      next: (d) => (this.aeropuertos = d || []),
      error: () => (this.aeropuertos = [])
    });
  }

  cargarDetalle() {
    if (!this.id) return;
    this.cargandoDetalle = true;
    this.service.obtener(this.id).subscribe({
      next: (data) => {
        this.cargandoDetalle = false;
        this.form = {
          aerolineaId: String(data?.aerolineaId ?? ''),
          aeropuertoId: String(data?.aeropuertoId ?? '')
        };
      },
      error: (e) => {
        this.cargandoDetalle = false;
        const message = e.error?.message || 'Error al cargar destino autorizado';
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

    const payload = {
      aerolineaId: Number(this.form.aerolineaId),
      aeropuertoId: Number(this.form.aeropuertoId)
    };

    this.cargando = true;
    this.service.editar(this.id, payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Destino autorizado actualizado');
        this.router.navigate(['/menu/aerolinea/destinos-autorizados']);
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al editar destino autorizado';
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/destinos-autorizados']);
  }

  private validar() {
    if (!this.form.aerolineaId) return 'Seleccione una aerolínea';
    if (!this.form.aeropuertoId) return 'Seleccione un aeropuerto';
    return '';
  }
}

