import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoService } from '../../services/catalogo.service';
import { DestinosAutorizadosService } from '../../services/destinos-autorizados.service';

@Component({
  selector: 'app-destino-autorizado-create',
  templateUrl: './destino-autorizado-create.component.html',
  styleUrl: './destino-autorizado-create.component.css'
})
export class DestinoAutorizadoCreateComponent implements OnInit {
  aerolineas: any[] = [];
  aeropuertos: any[] = [];

  form = {
    aerolineaId: '',
    aeropuertoId: ''
  };

  cargando = false;

  constructor(
    private catalogo: CatalogoService,
    private service: DestinosAutorizadosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCatalogos();
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

  guardar() {
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
    this.service.crear(payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Destino autorizado creado');
        this.router.navigate(['/menu/aerolinea/destinos-autorizados']);
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al crear destino autorizado';
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

