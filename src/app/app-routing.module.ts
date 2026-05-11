import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PortalComponent } from './pages/portal/portal.component';
import { LoginComponent } from './pages/login/login.component';
import { MenuComponent } from './pages/menu/menu.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { EmpleadoFormComponent } from './pages/empleado-form/empleado-form.component';
import { EmpleadoEditComponent } from './pages/empleado-edit/empleado-edit.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PlaceholderComponent } from './pages/placeholder/placeholder.component';
import { TripulacionComponent } from './pages/tripulacion/tripulacion.component';
import { TripulacionCreateComponent } from './pages/tripulacion-create/tripulacion-create.component';
import { AerolineasComponent } from './pages/aerolineas/aerolineas.component';
import { AerolineaCreateComponent } from './pages/aerolinea-create/aerolinea-create.component';
import { AerolineaEditComponent } from './pages/aerolinea-edit/aerolinea-edit.component';
import { AeropuertosComponent } from './pages/aeropuertos/aeropuertos.component';
import { AeropuertoCreateComponent } from './pages/aeropuerto-create/aeropuerto-create.component';
import { AeropuertoEditComponent } from './pages/aeropuerto-edit/aeropuerto-edit.component';
import { DestinosAutorizadosComponent } from './pages/destinos-autorizados/destinos-autorizados.component';
import { DestinoAutorizadoCreateComponent } from './pages/destino-autorizado-create/destino-autorizado-create.component';
import { DestinoAutorizadoEditComponent } from './pages/destino-autorizado-edit/destino-autorizado-edit.component';
import { AvionesComponent } from './pages/aviones/aviones.component';
import { AvionCreateComponent } from './pages/avion-create/avion-create.component';
import { AvionEditComponent } from './pages/avion-edit/avion-edit.component';

const routes: Routes = [
  { path: '', component: PortalComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'menu',
    component: MenuComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'aerolinea/empleados', component: EmpleadosComponent },
      { path: 'aerolinea/empleados/nuevo', component: EmpleadoFormComponent },
      { path: 'aerolinea/empleados/editar/:id', component: EmpleadoEditComponent },
      { path: 'aerolinea/tripulacion', component: TripulacionComponent },
      { path: 'aerolinea/tripulacion/nuevo', component: TripulacionCreateComponent },
      { path: 'aerolinea/aerolineas', component: AerolineasComponent },
      { path: 'aerolinea/aerolineas/nuevo', component: AerolineaCreateComponent },
      { path: 'aerolinea/aerolineas/editar/:id', component: AerolineaEditComponent },
      { path: 'aerolinea/aeropuertos', component: AeropuertosComponent },
      { path: 'aerolinea/aeropuertos/nuevo', component: AeropuertoCreateComponent },
      { path: 'aerolinea/aeropuertos/editar/:id', component: AeropuertoEditComponent },
      { path: 'aerolinea/destinos-autorizados', component: DestinosAutorizadosComponent },
      { path: 'aerolinea/destinos-autorizados/nuevo', component: DestinoAutorizadoCreateComponent },
      { path: 'aerolinea/destinos-autorizados/editar/:id', component: DestinoAutorizadoEditComponent },
      { path: 'aerolinea/aviones', component: AvionesComponent },
      { path: 'aerolinea/aviones/nuevo', component: AvionCreateComponent },
      { path: 'aerolinea/aviones/editar/:id', component: AvionEditComponent },
      { path: 'aerolinea/vuelos', component: PlaceholderComponent, data: { title: 'Vuelos (Aerolínea)' } },

      { path: 'vuelos/reservar', component: PlaceholderComponent, data: { title: 'Reservar vuelo' } },
      { path: 'vuelos/abordaje', component: PlaceholderComponent, data: { title: 'Abordaje' } },

      { path: 'consultas/vuelos', component: PlaceholderComponent, data: { title: 'Consulta de vuelos' } },
      { path: 'consultas/equipaje', component: PlaceholderComponent, data: { title: 'Consulta de equipaje' } },
      { path: 'consultas/pasajeros', component: PlaceholderComponent, data: { title: 'Consulta de pasajeros' } },

      { path: 'usuarios/registro', component: PlaceholderComponent, data: { title: 'Usuarios - Registro' } },
      { path: 'usuarios/login', component: PlaceholderComponent, data: { title: 'Usuarios - Login' } }
    ]
  },
  { path: 'empleados', redirectTo: 'menu/aerolinea/empleados', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'portal', component: PortalComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
