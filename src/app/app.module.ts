import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { PortalComponent } from './pages/portal/portal.component';
import { LoginComponent } from './pages/login/login.component';
import { MenuComponent } from './pages/menu/menu.component';
import { MenuAbordajeComponent } from './pages/menu-abordaje/menu-abordaje.component';
import { MenuClienteComponent } from './pages/menu-cliente/menu-cliente.component';

import { FormsModule } from '@angular/forms';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { EmpleadoFormComponent } from './pages/empleado-form/empleado-form.component';
import { EmpleadoEditComponent } from './pages/empleado-edit/empleado-edit.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PlaceholderComponent } from './pages/placeholder/placeholder.component';

import { TripulacionComponent } from './pages/tripulacion/tripulacion.component';
import { TripulacionCreateComponent } from './pages/tripulacion-create/tripulacion-create.component';
import { TripulacionEditComponent } from './pages/tripulacion-edit/tripulacion-edit.component';

import { AerolineasComponent } from './pages/aerolineas/aerolineas.component';
import { AerolineaCreateComponent } from './pages/aerolinea-create/aerolinea-create.component';
import { AerolineaEditComponent } from './pages/aerolinea-edit/aerolinea-edit.component';

import { AeropuertosComponent } from './pages/aeropuertos/aeropuertos.component';
import { AeropuertoCreateComponent } from './pages/aeropuerto-create/aeropuerto-create.component';
import { AeropuertoEditComponent } from './pages/aeropuerto-edit/aeropuerto-edit.component';

import { DestinosAutorizadosComponent } from './pages/destinos-autorizados/destinos-autorizados.component';
import { DestinoAutorizadoCreateComponent } from './pages/destino-autorizado-create/destino-autorizado-create.component';
import { DestinoAutorizadoEditComponent } from './pages/destino-autorizado-edit/destino-autorizado-edit.component';

import { PasajerosComponent } from './pages/pasajeros/pasajeros.component';
import { PasajeroEditComponent } from './pages/pasajero-edit/pasajero-edit.component';
import { EditPasajerosComponent } from './pages/edit-pasajeros/edit-pasajeros.component';

import { ModeloAvionComponent } from './pages/modelo-avion/modelo-avion.component';
import { ModeloAvionCreateComponent } from './pages/modelo-avion-create/modelo-avion-create.component';
import { ModeloAvionEditComponent } from './pages/modelo-avion-edit/modelo-avion-edit.component';

import { VuelosComponent } from './pages/vuelos/vuelos.component';
import { VueloCreateComponent } from './pages/vuelo-create/vuelo-create.component';
import { VueloEditComponent } from './pages/vuelo-edit/vuelo-edit.component';

import { VuelosOperadosComponent } from './pages/vuelos-operados/vuelos-operados.component';
import { VueloOperadoCreateComponent } from './pages/vuelo-operado-create/vuelo-operado-create.component';
import { VueloOperadoEditComponent } from './pages/vuelo-operado-edit/vuelo-operado-edit.component';
import { ConsultaVueloComponent } from './pages/consulta-vuelo/consulta-vuelo.component';
import { ConsultasComponent } from './pages/consultas/consultas.component';
import { ReservarVueloComponent } from './pages/reservar-vuelo/reservar-vuelo.component';
import { AbordajeVuelosComponent } from './pages/abordaje-vuelos/abordaje-vuelos.component';
import { BlockPastDateDirective } from './directives/block-past-date.directive';

@NgModule({
  declarations: [
    AppComponent,
    PortalComponent,
    LoginComponent,
    MenuComponent,
    MenuAbordajeComponent,
    MenuClienteComponent,
    EmpleadosComponent,
    EmpleadoFormComponent,
    EmpleadoEditComponent,
    RegisterComponent,
    DashboardComponent,
    PlaceholderComponent,

    TripulacionComponent,
    TripulacionCreateComponent,
    TripulacionEditComponent,

    AerolineasComponent,
    AerolineaCreateComponent,
    AerolineaEditComponent,

    AeropuertosComponent,
    AeropuertoCreateComponent,
    AeropuertoEditComponent,

    DestinosAutorizadosComponent,
    DestinoAutorizadoCreateComponent,
    DestinoAutorizadoEditComponent,

    PasajerosComponent,
    PasajeroEditComponent,
    EditPasajerosComponent,

    ModeloAvionComponent,
    ModeloAvionCreateComponent,
    ModeloAvionEditComponent,

    VuelosComponent,
    VueloCreateComponent,
    VueloEditComponent,

    VuelosOperadosComponent,
    VueloOperadoCreateComponent,
    VueloOperadoEditComponent,
    ConsultaVueloComponent,
    ConsultasComponent,
    ReservarVueloComponent,
    AbordajeVuelosComponent,
    BlockPastDateDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
