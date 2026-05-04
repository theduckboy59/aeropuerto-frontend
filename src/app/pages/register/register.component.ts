import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CatalogoService } from '../../services/catalogo.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  private api = `${environment.apiUrl}/auth/register`;

  tipos: any[] = [];
  nacionalidades: any[] = [];
  codigos: any[] = [];

  form: any = {
    username: '',
    email: '',
    password: '',
    tipoDocumentoId: null,
    numeroDocumento: '',
    nombreCompleto: '',
    fechaNacimiento: '',
    nacionalidadId: null,
    codigoAreaId: null,
    telefono: '',
    telefonoEmergencia: '',
    direccion: ''
  };

  constructor(
    private http: HttpClient,
    private catalogoService: CatalogoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catalogoService.tipoDocumento().subscribe(r => this.tipos = r);
    this.catalogoService.nacionalidad().subscribe(r => this.nacionalidades = r);
    this.catalogoService.codigoArea().subscribe(r => this.codigos = r);
  }

  register() {
    this.http.post(this.api, this.form, { responseType: 'text' }).subscribe({
      next: () => {
        this.router.navigate(['/portal']);
      },
      error: (e) => console.error(e)
    });
  }
}
