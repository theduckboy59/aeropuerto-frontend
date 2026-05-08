import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AeropuertosService } from '../../services/aeropuertos.service';

@Component({
  selector: 'app-aeropuerto-create',
  templateUrl: './aeropuerto-create.component.html',
  styleUrl: './aeropuerto-create.component.css'
})
export class AeropuertoCreateComponent {
  form = {
    nombre: '',
    codigoIata: '',
    codigoIcao: '',
    pais: '',
    ciudad: ''
  };

  puertas: Array<{ codigo: string }> = [{ codigo: '' }];
  nuevaPuerta = '';
  cargando = false;

  constructor(
    private service: AeropuertosService,
    private router: Router
  ) {}

  agregarPuerta() {
    const codigo = (this.nuevaPuerta || '').trim();
    if (!codigo) return;
    this.puertas.push({ codigo });
    this.nuevaPuerta = '';
  }

  quitarPuerta(index: number) {
    this.puertas.splice(index, 1);
    if (!this.puertas.length) this.puertas.push({ codigo: '' });
  }

  guardar() {
    const msg = this.validar();
    if (msg) {
      alert(msg);
      return;
    }

    const puertas = this.normalizarPuertas();

    const payload = {
      nombre: this.form.nombre.trim(),
      codigoIata: this.form.codigoIata.trim(),
      codigoIcao: this.form.codigoIcao.trim(),
      pais: this.form.pais.trim(),
      ciudad: this.form.ciudad.trim(),
      puertas
    };

    this.cargando = true;
    this.service.crear(payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Aeropuerto creado correctamente');
        this.router.navigate(['/menu/aerolinea/aeropuertos']);
      },
      error: (e) => {
        this.cargando = false;
        const message = e.error?.message || 'Error al crear aeropuerto';
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/aeropuertos']);
  }

  private normalizarPuertas() {
    const codigos = (this.puertas || [])
      .map(p => (p?.codigo || '').trim())
      .filter(Boolean);
    const uniq = Array.from(new Set(codigos.map(c => c.toUpperCase()))).map(c => ({ codigo: c }));
    return uniq;
  }

  private validar() {
    if (!this.form.nombre.trim()) return 'Nombre obligatorio';
    if (!this.form.codigoIata.trim()) return 'Código IATA obligatorio';
    if (!this.form.codigoIcao.trim()) return 'Código ICAO obligatorio';
    if (!this.form.pais.trim()) return 'País obligatorio';
    if (!this.form.ciudad.trim()) return 'Ciudad obligatoria';

    const puertas = this.normalizarPuertas();
    if (!puertas.length) return 'Ingrese al menos una puerta';
    return '';
  }
}

