# Diversity Store — Tienda digital de videojuegos

Diversity Store es una tienda digital desarrollada con **Angular, Node.js, Express y PostgreSQL**, enfocada en la venta de videojuegos, consolas y accesorios.

El diseño inicial de la tienda se planteó mediante wireframes elaborados en Word, que sirvieron como referencia para organizar la estructura y distribución de las diferentes secciones.

Para el diseño de las pantallas de inicio de sesión y registro, tanto de clientes como de administradores, se tomó como inspiración el estilo de autenticación de **Epic Games**, adaptándolo a la identidad visual de Diversity Store.

## Tecnologías utilizadas

- **Frontend:** Angular.
- **Backend:** Node.js y Express.
- **Base de datos:** PostgreSQL con Supabase.
- **Autenticación:** JWT y bcrypt.
- **Validaciones:** Zod.
- **Despliegue:** Cloudflare Pages y Render.

## Funcionalidades

- Registro e inicio de sesión para clientes.
- Acceso independiente para administradores.
- Verificación de cuentas mediante códigos enviados al correo electrónico.
- Catálogo y gestión de productos.
- Carrito de compras y pedidos.
- Administración de usuarios, ventas e ingresos.
- Panel de administración con información general de la tienda.

## Cambios realizados

- Se eliminó la solicitud de DNI en el registro de clientes y administradores.
- Se simplificaron los formularios de registro.
- Se ajustaron las validaciones del frontend y backend.
- Se mejoró el proceso de autenticación y verificación por correo.
- Se realizaron ajustes en la conexión entre Angular, la API y PostgreSQL.

## Despliegue

- **Frontend:** Cloudflare Pages.
- **Backend:** Render.
- **Base de datos:** Supabase (PostgreSQL).

## Instalación

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
ng serve
```
Configurar previamente las variables de entorno del backend y la conexión con la API.

Notas adicionales
- Se adjunta los links para ingresar tanto para CLIENTE como para ADMIN

ADMIN: https://diversity-store.skullrydexx.workers.dev/admin

CLIENTE: https://diversity-store.skullrydexx.workers.dev/

(Para registro de ADMIN, usa el codigo de administrador: DIVERSITY-ADMIN-2026)
