# Guía de Deploy en Vercel

## 📋 Pasos para Desplegar

### 1. Instalar Vercel CLI (si no la tienes)
```bash
npm i -g vercel
```

### 2. Login en Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

El CLI te hará algunas preguntas:
- **Set up and deploy?** → Yes
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → No (primera vez)
- **Project name?** → booky (o el nombre que prefieras)
- **Directory?** → ./ (presiona Enter)
- **Override settings?** → No

### 4. Configurar Variables de Entorno

Después del primer deploy, ve al dashboard de Vercel:
1. Abre tu proyecto en https://vercel.com/dashboard
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables (cópialas de tu `.env.local`):

**Client SDK (Frontend):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Admin SDK (Backend/API Routes):**
- `FIREBASE_SERVICE_ACCOUNT_KEY` (todo el JSON en una línea)

O alternativamente:
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 5. Re-deploy con Variables
```bash
vercel --prod
```

## 🚀 Comandos Útiles

- **Deploy de prueba:** `vercel`
- **Deploy a producción:** `vercel --prod`
- **Ver logs:** `vercel logs`
- **Ver deployments:** `vercel ls`

## 🔗 URLs

Después del deploy obtendrás:
- **Preview URL:** `https://booky-xxx.vercel.app` (deploy de prueba)
- **Production URL:** `https://booky.vercel.app` (después de `vercel --prod`)

Puedes configurar un dominio personalizado en el dashboard de Vercel.

## ⚙️ Configuración Automática

Vercel detecta automáticamente:
- ✅ Framework Next.js
- ✅ Rutas API
- ✅ Build commands
- ✅ Node.js runtime para APIs

## 📝 Notas

- Las variables de entorno se configuran en el dashboard de Vercel
- Cada push a `main` (si conectas GitHub) desplegará automáticamente
- Los deploys de preview se crean para cada PR
