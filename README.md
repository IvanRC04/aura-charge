# AURA Charge

Demo full-stack para feria universitaria: estación de carga inteligente para vehículos eléctricos con telemetría simulada realista, asistente IA en vivo y panel CRM de operaciones.

## Apps

- **`apps/web`** → cliente final. Landing con QR + página de carga en vivo + chat IA. Despliega a `aura-charge.vercel.app`.
- **`apps/crm`** → panel operativo en tiempo real. Despliega a `aura-charge-crm.vercel.app`.

## Stack

Next.js 15 · TypeScript · Tailwind v4 · Drizzle ORM (Neon Postgres) · Upstash Redis · Vercel AI SDK + Groq (Llama 3.1 8B) · Recharts · Framer Motion · pnpm + Turborepo.

## Estructura

```
aura-charge/
├── apps/
│   ├── web/      single-page de carga + chat IA
│   └── crm/      dashboard de operaciones + cron job
└── packages/
    ├── ui/          tema + fuente Albert Sans + componentes
    ├── db/          Drizzle schema + queries + seed
    ├── kv/          Upstash Redis + ratelimit + event stream
    └── simulation/  curva realista de carga EV
```

## Desarrollo local

```bash
pnpm install
cp .env.example .env.local   # rellena las claves
pnpm db:push                 # crea las tablas en Neon
pnpm db:seed                 # 12 cargadores · 25 clientes · 80 sesiones históricas
pnpm dev                     # arranca web (3000) + crm (3001) en paralelo
```

## Deploy a Vercel

Lee **[DEPLOY.md](./DEPLOY.md)** para los pasos completos.

Resumen: crear repo GitHub, importar **dos veces** en Vercel (root `apps/web` y `apps/crm`), añadir integraciones Marketplace de **Neon** y **Upstash Redis**, configurar las env vars `GROQ_API_KEY`, `INTERNAL_SECRET`, `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_CRM_URL`.

## Variables de entorno

| Variable | Necesaria en | Origen |
|---|---|---|
| `DATABASE_URL` | web + crm | Vercel Marketplace · Neon |
| `UPSTASH_REDIS_REST_URL` | web + crm | Vercel Marketplace · Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | web + crm | Vercel Marketplace · Upstash |
| `GROQ_API_KEY` | web | console.groq.com (free) |
| `INTERNAL_SECRET` | web + crm | cualquier string aleatorio ≥ 16 chars |
| `CRON_SECRET` | crm | auto-set por Vercel cuando hay crons |
| `NEXT_PUBLIC_WEB_URL` | crm | URL del proyecto `web` en Vercel |
| `NEXT_PUBLIC_CRM_URL` | web | URL del proyecto `crm` en Vercel |

## Comandos útiles

```bash
pnpm dev                # ambas apps en paralelo
pnpm dev:web            # solo web
pnpm dev:crm            # solo crm
pnpm build              # build de todo el monorepo
pnpm typecheck          # type-check de todo
pnpm db:push            # sincronizar schema con la DB (dev)
pnpm db:generate        # generar migraciones (.sql)
pnpm db:migrate         # aplicar migraciones (prod)
pnpm db:seed            # sembrar datos demo
pnpm db:studio          # Drizzle Studio
```

## Flujo demo (lo que verán los jurados)

1. Profesor escanea QR en pantalla `aura-charge.vercel.app` → es redirigido a `/charge/[sessionId]`.
2. Ve UI con SoC ring, potencia kW, gráficas de potencia + SoC, stats (€, kWh, °C, V, A, CO₂).
3. Scrollea → chat IA con contexto en vivo. Pregunta y AURA responde basándose en el estado actual.
4. En la otra pantalla, el CRM muestra:
   - KPIs (sesiones activas, kWh hoy, ingresos, visitas QR)
   - Sesiones activas con SoC y potencia en tiempo real
   - Feed de actividad (eventos nuevos cada segundo)
   - Mapa de cargadores con estado por color
   - Histórico de sesiones, cargadores y clientes

Un Vercel Cron Job ejecuta `/api/tick` cada minuto para:
- Avanzar telemetría persistente de sesiones activas
- Marcar como completadas las sesiones que llegan a target SoC
- Generar actividad sintética si hay poca actividad real (mantiene el dashboard vivo)

## Notas técnicas

- **Simulación determinista**: el estado de carga es `f(startedAt, params, now)`. Cualquier cliente puede recomputar el mismo estado en cualquier momento. La curva sigue un perfil Li-ion DC realista (rampa, meseta, tapering lineal, tapering exponencial, trickle).
- **Realtime sin WebSocket**: la web hace polling cada 1s a `/api/session/[id]/state`, el CRM cada 1.5s a `/api/live/*`. Cada poll recomputa estado en vivo. Sin conexiones persistentes → compatible con Vercel hobby tier.
- **Eventos en Upstash**: cada acción (start, tick, completed) se escribe en un Redis Sorted Set con score = timestamp ms. El CRM hace ZRANGEBYSCORE con cursor para tirar deltas.
- **Rate limiting** del chat IA: 20 req/min y 100 req/día por IP, gestionado por `@upstash/ratelimit`.
