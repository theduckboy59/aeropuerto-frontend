# Flujo Frontend — Módulo Pasajeros

## Arquitectura funcional del frontend

El módulo de pasajeros queda dividido en 2 áreas completamente distintas.

---

# 1. REGISTRO PÚBLICO

## Objetivo

Permitir que cualquier cliente cree su cuenta desde el portal.

## NO pertenece al CRUD administrativo.

Este flujo es independiente del panel administrativo.

---

## Pantalla Angular

```txt
/registro
```

---

## Endpoint

```http
POST /auth/register
```

---

## Flujo visual

### Pantalla pública

Campos:

- username
- email
- password
- pasaporte
- nombre completo
- fecha nacimiento
- nacionalidad
- código área
- teléfono
- teléfono emergencia
- dirección

---

## Validaciones frontend

TODAS obligatorias:

```ts
Validators.required
```

---

## Validaciones especiales

### Password

Regex:

```ts
^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$
```

---

### Teléfono

```ts
Validators.pattern('^[0-9]{8}$')
```

---

### Pasaporte máximo 15

```ts
Validators.maxLength(15)
```

---

## Mensajes esperados backend

### Pasaporte repetido

```json
{
  "message": "El número de pasaporte ingresado ya cuenta con usuario."
}
```

---

### Password inválido

```json
{
  "message": "El formato de la contraseña debe incluir al menos una letra mayúscula, un carácter especial y un número"
}
```

---

## Respuesta exitosa

Redirigir:

```txt
/login
```

Mostrar toast:

```txt
Se ha creado con éxito el usuario.
```

---

# 2. CRUD ADMINISTRATIVO PASAJEROS

## Objetivo

Gestión interna de pasajeros.

NO es registro público.

Aquí:
- editan
- consultan
- eliminan
- buscan

---

# RUTA FRONTEND

```txt
/dashboard/pasajeros
```

---

# COMPONENTES RECOMENDADOS

```txt
pasajeros/
│
├── pasajero-list
├── pasajero-edit
├── pasajero-detail
├── pasajero-service
├── pasajero-model
```

---

# APIs BACKEND

---

# LISTAR

## URL

```http
GET /pasajeros
```

---

## Response

```json
[
  {
    "id": 1,
    "userId": 4,
    "username": "samu",
    "email": "samu@gmail.com",
    "pasaporte": "165415464521513",
    "nombreCompleto": "Samuel Alexander",
    "fechaNacimiento": "2000-05-12",
    "nacionalidad": "Guatemalteca",
    "codigoArea": "502",
    "telefono": "34951198",
    "telefonoEmergencia": "45636564",
    "direccion": "Zona 1",
    "estado": "Activo"
  }
]
```

---

# IMPORTANTE FRONTEND

## NO mostrar:

```txt
id
userId
```

---

## SÍ mostrar:

```txt
username
email
pasaporte
nombreCompleto
telefono
nacionalidad
estado
```

---

# TABLA SUGERIDA

| Usuario | Email | Pasaporte | Nombre | Teléfono | Nacionalidad | Estado | Acciones |
|---|---|---|---|---|---|---|---|

---

# BUSCAR

## URL

```http
GET /pasajeros?nombre=sam
```

---

## Frontend

Implementar:
- input búsqueda
- búsqueda por debounce opcional
- búsqueda al escribir o botón buscar

---

# OBTENER POR ID

## URL

```http
GET /pasajeros/{id}
```

---

# EDITAR PASAJERO

## URL

```http
PUT /pasajeros/{id}
```

---

## Body

```json
{
  "username": "samuel",
  "email": "samuel@gmail.com",
  "password": "Admin@123",
  "pasaporte": "GT123456",
  "nombreCompleto": "Samuel Alexander",
  "fechaNacimiento": "2000-05-12",
  "nacionalidad": "Guatemalteca",
  "codigoArea": "502",
  "telefono": "12345678",
  "telefonoEmergencia": "87654321",
  "direccion": "Zona 10"
}
```

---

# IMPORTANTE EDITAR

## Password

Puede:
- cambiarse
- mantenerse

Recomendación frontend:

### Si no cambia password:

enviar:

```json
"password": ""
```

---

# ELIMINAR

## URL

```http
DELETE /pasajeros/{id}
```

---

# IMPORTANTE DELETE

NO elimina físicamente.

Backend hace:

```txt
estadoId = 2
```

---

# Resultado

El pasajero:
- desaparece de listados
- sigue existiendo en BD
- mantiene relaciones futuras:
  - boletos
  - pagos
  - abordaje
  - historial

---

# MENSAJES FRONTEND

## Crear

```txt
Se ha creado con éxito el usuario.
```

---

## Editar

```txt
Se actualizó correctamente el pasajero.
```

---

## Eliminar

```txt
Se eliminó correctamente el pasajero.
```

---

## Error campos

```txt
Debe ingresar los campos obligatorios.
```

---

## Error pasaporte

```txt
El número de pasaporte ingresado ya cuenta con usuario.
```

---

# VALIDACIONES FRONTEND

## Todos requeridos

```ts
Validators.required
```

---

## Password

```ts
Validators.pattern(
 /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/
)
```

---

## Teléfono

```ts
Validators.pattern('^[0-9]{8}$')
```

---

## Pasaporte

```ts
Validators.maxLength(15)
```

---

# Seguridad actual

Actualmente backend está:

```java
.requestMatchers("/pasajeros/**").permitAll()
```

SOLO para pruebas.

---

# Seguridad final recomendada

Después:

```java
.requestMatchers("/pasajeros/**")
.hasAnyRole("ADMIN_SISTEMA", "CLIENTE")
```

---

# Estado actual backend

## Ya funcional

- CRUD completo
- búsqueda
- soft delete
- DTOs
- validaciones
- integración users + pasajero
- password encriptado
- estado textual
- no listar eliminados

---

# Próximo paso recomendado

Frontend Angular:
- tabla pasajeros
- modal editar
- búsqueda dinámica
- confirmación eliminar
- toast notifications
- guards por rol
