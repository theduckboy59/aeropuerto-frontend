import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AerolineasService } from '../../services/aerolineas.service';

@Component({
  selector: 'app-aerolinea-create',
  templateUrl: './aerolinea-create.component.html',
  styleUrl: './aerolinea-create.component.css'
})
export class AerolineaCreateComponent {
  form = {
    nombre: '',
    codigoIata: '',
    codigoIcao: '',
    pais: ''
  };

  cargando = false;

  constructor(
    private service: AerolineasService,
    private router: Router
  ) {}

  guardar() {
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
    this.service.crear(payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Aerolínea creada correctamente');
        this.router.navigate(['/menu/aerolinea/aerolineas']);
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al crear aerolínea';
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

