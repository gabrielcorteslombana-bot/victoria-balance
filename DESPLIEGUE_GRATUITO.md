# 🚀 GUÍA DE DESPLIEGUE GRATUITO - VICTORIA BALANCE 2.0.0

Esta guía te permite desplegar **Victoria Balance** en la nube de forma **100% gratuita**, con base de datos PostgreSQL persistente y URL pública accesible desde cualquier computador o iPhone.

---

## 🏗️ ARQUITECTURA DE DESPLIEGUE GRATUITO

| Capa | Plataforma Gratuita | Especificaciones |
| :--- | :--- | :--- |
| **Base de Datos** | **Supabase** o **Neon.tech** | PostgreSQL en la nube, SSL activado, backups automáticos, 100% gratuita. |
| **Backend REST API** | **Render.com** (Web Service gratuito) | Node.js + Prisma + Express, auto-deploy desde GitHub. |
| **Frontend Web / PWA** | **Vercel** o **Render Static Site** | React + Vite, HTTPS automático, CDN global instantáneo. |

---

## PASO 1: Base de Datos PostgreSQL Gratuita en Supabase (o Neon)

1. Ingresa a [https://supabase.com](https://supabase.com) y crea una cuenta gratis con tu GitHub o email.
2. Crea un nuevo proyecto llamado `victoria-balance`.
3. Ve a **Project Settings > Database > Connection String > URI**.
4. Copia tu cadena de conexión, que lucirá así:
   ```env
   postgresql://postgres.[ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

---

## PASO 2: Subir tu Código a GitHub

1. Entra a [https://github.com](https://github.com) y crea un nuevo repositorio llamado `victoria-balance` (público o privado).
2. En tu terminal (dentro de `C:\Users\jesus.cortes\Downloads\victoria-balance`), ejecuta:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/victoria-balance.git
   git branch -M main
   git push -u origin main
   ```

---

## PASO 3: Desplegar el Backend en Render.com (Gratis)

1. Ingresa a [https://render.com](https://render.com) e inicia sesión con GitHub.
2. Selecciona **New + > Web Service** y conecta tu repositorio `victoria-balance`.
3. Configura los siguientes campos:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. En la sección **Environment Variables**, añade:
   - `DATABASE_URL`: *(Tu URL copiada de Supabase)*
   - `JWT_SECRET`: `victoria_balance_super_secret_jwt_key_2026_finance`
   - `NODE_ENV`: `production`
5. Haz clic en **Create Web Service**.  
   Render te asignará una URL pública (ejemplo: `https://victoria-balance-api.onrender.com`).

---

## PASO 4: Desplegar el Frontend en Vercel (Gratis)

1. Ingresa a [https://vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **Add New... > Project** e importa `victoria-balance`.
3. Configura:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. En **Environment Variables**:
   - `VITE_API_URL`: `https://victoria-balance-api.onrender.com/api`
5. Haz clic en **Deploy**.  
   En 30 segundos tendrás tu aplicación web lista con certificado SSL en `https://victoria-balance.vercel.app` para usar desde tu iPhone o PC.
