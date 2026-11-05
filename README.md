# Diversity Store — Módulo de catálogo (Angular + Node.js + PostgreSQL)

Dos vistas conectadas a una sola API: **Cliente** (`/`, `/login`, `/registro`) y **Admin** (`/admin/login`, `/admin/registro`, `/admin`).

## Puesta en marcha
**Base de datos:** crea un proyecto en [Supabase](https://supabase.com) → SQL Editor → pega `backend/schema.sql`.
**API:** `cd backend && cp .env.example .env` (rellena) `&& npm i && npm run dev`
**Frontend:** `ng new diversity-store --style=scss --routing=false` y copia `frontend/src/*` encima de `src/` (incluye `assets/logo.png`). `ng serve`.
Cambia `HOST` en `src/app/core.ts` al desplegar. Para ser el primer admin: `/admin/registro` con `ADMIN_INVITE_CODE`.

## Decisiones técnicas
- **PostgreSQL en Supabase**: relacional (productos↔categorías↔pedidos), gratis, con editor de tablas en línea. Se usa `pg` directo (sin ORM) para mantener el módulo portable.
- **Arquitectura por capas**: `routes` (HTTP + validación) → `services` (correo, DNI, códigos, imágenes) → `db`. Middleware de auth/validación/errores centralizado.
- **Validación backend con Zod** en todos los endpoints; consultas parametrizadas (sin SQL injection); `helmet`, CORS por lista, rate-limit en `/auth`.
- **Auth**: bcrypt + JWT (8 h). Verificación por **correo con código de 6 dígitos**: hasheado (SHA-256), vence en 10 min, máx. 5 intentos, reenvío cada 60 s. Admin: código siempre; cliente: configurable (`two_fa` en `PATCH /api/auth/me`).
- **DNI obligatorio y único** para ambos. Admin: se escribe el DNI y el nombre se obtiene de una API externa (`DNI_API_*`); el endpoint de consulta exige el código de invitación para no exponer datos personales. El DNI se devuelve enmascarado.
- **Imágenes**: `sharp` → WebP (800 px máx, calidad 75) + miniatura 240 px, autorrotación y sin EXIF; límite 5 MB y solo JPG/PNG/WebP. El listado usa miniaturas + `loading="lazy"`; caché `immutable` de 30 días.
- **Compras**: transacción SQL con descuento atómico de stock (no hay sobreventa) y recibo por correo.
- **Dashboard**: clientes, compras, ingresos, ventas 14 días, más vendidos, últimos clientes.

## Despliegue
- **Frontend → Cloudflare Pages**: build `ng build`, salida `dist/<app>/browser`. Copia `_headers` y un archivo `_redirects` con `/*  /index.html  200` (SPA).
- **API → Render / Railway / Fly** (Express no corre nativo en Workers). Define las variables de `.env.example` y `CORS_ORIGIN` = URL de Pages.
- ⚠ El disco de Render/Railway es efímero: en producción monta un volumen o migra `services/image.js` a Supabase Storage / Cloudflare R2.

## Pendiente / mejoras
Pantalla de "Mi cuenta" y recuperar contraseña (la API ya existe: `/forgot`, `/reset`, `/me`), texto de Términos, tests, paginación en admin.
