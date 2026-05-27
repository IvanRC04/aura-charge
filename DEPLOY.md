# Deploy AURA Charge a Vercel

Guía completa para tener `aura-charge.vercel.app` + `aura-charge-crm.vercel.app` en producción en ~15 min. Todo gratis.

---

## 0. Pre-requisitos

- Cuenta GitHub (logueada en `gh` CLI)
- Cuenta Vercel (https://vercel.com — login con GitHub)
- Cuenta Groq (https://console.groq.com — login con Google)

---

## 1. Conseguir la API key de Groq

1. Ve a https://console.groq.com y entra.
2. En el menú lateral: **API Keys** → **Create API Key**.
3. Nombre: `aura-charge-demo`. Copia el valor (`gsk_…`) y guárdalo — lo necesitarás dos veces.

---

## 2. Publicar el repo en GitHub

Yo lo dejé listo en `D:\aura_charge` con commit inicial. Para subirlo a tu cuenta:

```bash
cd D:/aura_charge
gh repo create aura-charge --private --source=. --remote=origin --push
```

Si prefieres público: cambia `--private` por `--public`.

---

## 3. Crear el primer proyecto Vercel: `aura-charge` (web)

1. Ve a https://vercel.com/new
2. Selecciona el repo `aura-charge`.
3. **Importante**: en **Root Directory** click **Edit** → selecciona `apps/web`.
4. **Project Name**: `aura-charge`. Esto te da el subdominio `aura-charge.vercel.app`.
5. **Framework Preset**: Next.js (auto-detectado).
6. Click **Environment Variables** → deja vacío por ahora.
7. Click **Deploy**. **Va a fallar** la primera build porque faltan env vars. No pasa nada.

---

## 4. Crear el segundo proyecto Vercel: `aura-charge-crm`

1. Vuelve a https://vercel.com/new
2. Selecciona el mismo repo `aura-charge`.
3. **Root Directory** → `apps/crm`.
4. **Project Name**: `aura-charge-crm`.
5. Deploy (también fallará la primera vez).

---

## 5. Añadir Neon Postgres desde el Marketplace

1. En el proyecto `aura-charge` (web) → **Storage** → **Create Database**.
2. Selecciona **Neon** (Postgres).
3. Plan: **Free**. Region: cualquiera europea (Frankfurt, ej.). Confirma.
4. Vercel inyectará automáticamente `DATABASE_URL` y aliases en `aura-charge`.
5. Vuelve a la database creada → pestaña **Projects** → **Connect Project** → elige `aura-charge-crm`. Ahora ambos proyectos comparten la misma DB.

---

## 6. Añadir Upstash Redis desde el Marketplace

1. En el proyecto `aura-charge` → **Storage** → **Create Database**.
2. Selecciona **Upstash for Redis**.
3. Plan: **Free**. Region: la misma que Neon idealmente.
4. Vercel inyectará `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (y los aliases `KV_REST_API_*`).
5. Conecta también al proyecto `aura-charge-crm` (igual que con Neon).

---

## 7. Añadir las env vars manuales

En **AMBOS proyectos** (web y crm), entra a **Settings → Environment Variables** y añade:

| Key | Value | Apply to |
|---|---|---|
| `GROQ_API_KEY` | `gsk_…` (de paso 1) | Production, Preview, Development |
| `INTERNAL_SECRET` | un string aleatorio largo (32+ chars) | Production, Preview, Development |
| `NEXT_PUBLIC_WEB_URL` | `https://aura-charge.vercel.app` | Production, Preview, Development |
| `NEXT_PUBLIC_CRM_URL` | `https://aura-charge-crm.vercel.app` | Production, Preview, Development |

Para generar un `INTERNAL_SECRET` aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `CRON_SECRET` se autoconfigura por Vercel cuando hay un `crons:` en `vercel.json`. No lo añadas manual.

---

## 8. Aplicar el schema a la DB

Necesitas que las tablas existan antes de que las apps respondan. En local:

```bash
# Copia el DATABASE_URL desde Vercel → aura-charge → Settings → Environment Variables → Show
echo 'DATABASE_URL=postgresql://...' > .env.local
echo 'UPSTASH_REDIS_REST_URL=...' >> .env.local
echo 'UPSTASH_REDIS_REST_TOKEN=...' >> .env.local

pnpm install
pnpm db:push     # crea las tablas
pnpm db:seed     # siembra 12 cargadores + 25 clientes + 80 sesiones históricas
```

---

## 9. Redeploy

En cada proyecto Vercel → **Deployments** → click en el último deployment → menú **⋯ Redeploy** (con "Use existing build cache" desmarcado).

Ambas builds deberían verde ahora.

---

## 10. Verificar

1. Abre `https://aura-charge.vercel.app` — debes ver el landing con el QR.
2. Escanea el QR o click "Abre la simulación ahora" — debes aterrizar en `/charge/[sessionId]` con telemetría animada.
3. Scrollea — debes poder chatear con AURA.
4. Abre `https://aura-charge-crm.vercel.app` — debes ver KPIs y la nueva sesión aparecer en sesiones activas + feed de actividad.
5. Espera 1 min — el cron `/api/tick` se dispara automáticamente y debe persistir telemetría.

---

## Troubleshooting

**Build falla con "DATABASE_URL is not set"**
→ Verifica que conectaste Neon a AMBOS proyectos (paso 5). Cada proyecto necesita la env var inyectada.

**Chat IA devuelve 401 / 429**
→ Verifica `GROQ_API_KEY` en el proyecto `aura-charge`. El free tier de Groq es 30 req/min, 14.4K req/día con `llama-3.1-8b-instant`.

**Cron no dispara**
→ Revisa que `apps/crm/vercel.json` tenga el bloque `crons`. Pro tip: en Vercel → proyecto `aura-charge-crm` → **Cron Jobs** debe listar `/api/tick · * * * * *`.

**Sesión no aparece en CRM**
→ Espera 1.5s (intervalo de polling) o refresca. Si persiste, comprueba que `UPSTASH_REDIS_REST_URL/TOKEN` está en AMBOS proyectos.

**Hot fix manual del cron**
→ `curl -H "Authorization: Bearer $INTERNAL_SECRET" https://aura-charge-crm.vercel.app/api/tick`

---

## Resumen one-liner

```
GitHub repo → 2 Vercel projects (root web / root crm) → Neon + Upstash from Marketplace → 4 env vars → db:push + db:seed → redeploy.
```
