# CryptoDesk

Sistema de gestión de operaciones de cambio de criptomonedas.

## Deploy en Vercel

### Opción 1 — Vercel CLI (más rápido)

```bash
# 1. Instalar dependencias
npm install

# 2. Build de prueba local
npm run dev

# 3. Instalar Vercel CLI (si no lo tenés)
npm install -g vercel

# 4. Deploy
vercel

# Seguí el wizard:
# - Set up and deploy: Y
# - Which scope: tu cuenta
# - Link to existing project: N
# - Project name: cryptodesk (o el que quieras)
# - Directory: ./  (Enter)
# - Override settings: N
```

### Opción 2 — GitHub + Vercel (recomendado para updates futuros)

```bash
# 1. Crear repo en GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USER/cryptodesk.git
git push -u origin main

# 2. Ir a vercel.com → New Project → importar el repo
# 3. Vercel detecta Vite automáticamente, click Deploy
```

## Desarrollo local

```bash
npm install
npm run dev
# Abre http://localhost:5173
```

## Build

```bash
npm run build
# Genera /dist listo para deploy estático
```
