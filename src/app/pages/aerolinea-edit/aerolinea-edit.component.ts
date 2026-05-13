import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AerolineasService } from '../../services/aerolineas.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-aerolinea-edit',
  templateUrl: './aerolinea-edit.component.html',
  styleUrl: './aerolinea-edit.component.css'
})
export class AerolineaEditComponent implements OnInit {
  id: number | null = null;

  form = {
    nombre: '',
    codigoIata: '',
    codigoIcao: '',
    pais: ''
  };

  cargando = false;
  cargandoDetalle = false;

  constructor(
    private route: ActivatedRoute,
    private service: AerolineasService,
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
    this.service.obtener(this.id).subscribe({
      next: (data) => {
        this.cargandoDetalle = false;
        this.form = {
          nombre: data?.nombre || '',
          codigoIata: data?.codigoIata || '',
          codigoIcao: data?.codigoIcao || '',
          pais: data?.pais || ''
        };
      },
      error: (e) => {
        this.cargandoDetalle = false;
        const message = getApiErrorMessage(e, 'Error al cargar aerolínea');
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
      nombre: this.form.nombre.trim(),
      codigoIata: this.form.codigoIata.trim(),
      codigoIcao: this.form.codigoIcao.trim(),
      pais: this.form.pais.trim()
    };

    this.cargando = true;
    this.service.editar(this.id, payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Aerolínea actualizada correctamente');
        this.router.navigate(['/menu/aerolinea/aerolineas']);
      },
      error: (e) => {
        this.cargando = false;
        const message = getApiErrorMessage(e, 'Error al editar aerolínea');
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/aerolineas']);
  }

  private validar() {
    if (!this.form.nombre.trim()) return 'Nombre obligatorio';
    if (!this.form.codigoIata.trim()) return 'Código IATA obligatorio';
    if (!this.form.codigoIcao.trim()) return 'Código ICAO obligatorio';
    if (!this.form.pais.trim()) return 'País obligatorio';
    return '';
  }
}

