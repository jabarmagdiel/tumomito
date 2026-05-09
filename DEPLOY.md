# 🚀 Guía de Despliegue — ERP TUMOMITO
## Servicio gratuito: Supabase (DB) + Render (Backend + Frontend)

---

## PASO 1: Configurar Base de Datos en Supabase

### 1.1 Crear cuenta y proyecto
1. Ve a **https://supabase.com** → "Start for free"
2. Crea una cuenta con Google o email
3. Haz clic en **"New project"**
   - Organization: tu nombre o empresa
   - Project name: `tumomito-erp`
   - Database Password: **anótala, la necesitarás**
   - Region: South America (São Paulo)
4. Espera ~2 minutos a que se cree el proyecto

### 1.2 Importar el schema SQL
1. En tu proyecto Supabase, ve al menú izquierdo → **SQL Editor**
2. Haz clic en **"New query"**
3. Copia todo el contenido del archivo `database/schema.sql`
4. Pégalo en el editor
5. Haz clic en **"Run"** (o Ctrl+Enter)
6. Verifica que diga: "Success. No rows returned"

### 1.3 Obtener la cadena de conexión
1. Ve a **Settings** (ícono de engranaje) → **Database**
2. Scroll hasta "Connection string" → selecciona **URI**
3. Copia la URL que tiene este formato:
   ```
   postgresql://postgres:[TU-PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
4. Reemplaza `[TU-PASSWORD]` con la contraseña que anotaste
5. **Guarda esta URL**, la necesitarás para Render

---

## PASO 2: Desplegar el Backend en Render

### 2.1 Preparar el repositorio
1. Sube el contenido de la carpeta `tumomito/` a un repositorio en **GitHub**
   - Puedes usar GitHub Desktop o la interfaz web
   - Estructura: el repo debe tener las carpetas `backend/` y `frontend/`

### 2.2 Crear el Web Service en Render
1. Ve a **https://render.com** → Inicia sesión con GitHub
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub (`tumomito`)
4. Configura el servicio:
   - **Name**: `tumomito-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### 2.3 Configurar variables de entorno
En la sección "Environment Variables", agrega:

| Clave | Valor |
|-------|-------|
| `DATABASE_URL` | (URL de Supabase del paso 1.3) |
| `SECRET_KEY` | (cadena aleatoria de 32+ caracteres) |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` |
| `FRONTEND_URL` | `https://tumomito-frontend.onrender.com` |
| `ENVIRONMENT` | `production` |

5. Haz clic en **"Create Web Service"**
6. Espera ~5 minutos al primer deploy
7. Cuando diga **"Your service is live"**, copia la URL: `https://tumomito-backend.onrender.com`
8. Verifica accediendo a: `https://tumomito-backend.onrender.com/docs`

> ⚠️ En el plan gratuito, el servicio "duerme" tras 15 min de inactividad. El primer request tardará ~30 seg en despertar.

---

## PASO 3: Desplegar el Frontend en Render

### 3.1 Crear el Static Site en Render
1. En Render, haz clic en **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio de GitHub
3. Configura:
   - **Name**: `tumomito-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3.2 Variable de entorno del frontend
En "Environment Variables":

| Clave | Valor |
|-------|-------|
| `VITE_API_URL` | `https://tumomito-backend.onrender.com` |

4. Haz clic en **"Create Static Site"**
5. Espera ~3 minutos al build
6. Tu frontend estará en: `https://tumomito-frontend.onrender.com`

---

## PASO 4: Verificación Final

### Checklist post-deploy:
- [ ] Acceder a `https://tumomito-backend.onrender.com/docs` → Swagger visible
- [ ] Acceder a `https://tumomito-frontend.onrender.com/login`
- [ ] Hacer login con: `admin@tumomito.com` / `Admin1234!`
- [ ] Verificar Dashboard (puede estar vacío al inicio)
- [ ] Acceder a `/catalogo` sin login
- [ ] Registrar un producto de prueba
- [ ] Hacer una venta de prueba

---

## Credenciales de acceso inicial

| Campo | Valor |
|-------|-------|
| Email | `admin@tumomito.com` |
| Contraseña | `Admin1234!` |
| Rol | Administrador |

> ⚠️ **Cambia la contraseña** después del primer acceso desde el módulo de Usuarios.

---

## Solución de problemas comunes

### Backend no inicia
- Verifica que `DATABASE_URL` esté correctamente configurada
- Revisa los logs en Render Dashboard → tu servicio → "Logs"

### Error CORS en el frontend
- Verifica que `FRONTEND_URL` en el backend sea la URL exacta de Render (sin slash final)

### Login falla
- Asegúrate de que el schema SQL se ejecutó correctamente en Supabase
- La tabla `usuarios` debe tener el registro admin creado

### Supabase connection refused
- En Supabase → Settings → Database, verifica que "SSL mode" esté en `require`
- Asegúrate de usar el puerto `5432`

---

## Estructura de URLs

| Servicio | URL |
|----------|-----|
| API REST | `https://tumomito-backend.onrender.com` |
| Swagger UI | `https://tumomito-backend.onrender.com/docs` |
| Frontend ERP | `https://tumomito-frontend.onrender.com` |
| Catálogo Público | `https://tumomito-frontend.onrender.com/catalogo` |
| WhatsApp | `https://wa.me/59176666750` |
