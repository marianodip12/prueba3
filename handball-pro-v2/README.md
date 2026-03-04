# 🤾 Handball Pro Analytics v2

Sistema profesional de estadísticas de handball.  
React + Vite · Sin backend · Datos en LocalStorage · Deploy en Vercel.

---

## 🚀 Deploy en Vercel (desde GitHub)

```bash
# 1. Subir a GitHub
git init
git add .
git commit -m "Handball Pro Analytics v2"
git remote add origin https://github.com/TU_USUARIO/handball-pro.git
git push -u origin main

# 2. En vercel.com → New Project → importar el repo
# 3. Vercel detecta Vite automáticamente → Deploy ✅
```

No necesitas configurar Root Directory ni ningún ajuste adicional.

---

## 💻 Desarrollo local

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## 🏗 Arquitectura

```
src/
├── App.jsx                          # Root — routing entre páginas
├── main.jsx                         # Entry point React
│
├── data/
│   └── eventSchema.js              # 🔑 Fuente única de constantes y schema
│
├── utils/
│   ├── calculations.js             # Funciones puras: pct, efectividad, scores
│   └── filters.js                  # Filtros de eventos: por equipo, jugador, etc.
│
├── services/
│   ├── statsEngine.js              # Orquestador principal — llama a todos los módulos
│   ├── teamStats.js                # Estadísticas de equipo
│   ├── playerStats.js              # Estadísticas por jugador
│   ├── goalkeeperStats.js          # Estadísticas de porteros
│   └── mvpEngine.js                # Algoritmo MVP configurable + análisis automático
│
├── context/
│   └── MatchContext.jsx            # Estado global + CRUD + persistencia LocalStorage
│
├── components/
│   ├── ui/index.jsx                # Primitivos: Card, Btn, Input, StatBox, Table…
│   ├── charts/
│   │   ├── StatsCharts.jsx         # HBarChart, VBarChart, TimelineChart, RadarCompare…
│   │   └── GoalMap.jsx             # Mapa de portería con heatmap
│   └── layout/
│       └── Header.jsx              # Navegación principal
│
└── pages/
    ├── MatchesPage.jsx             # Gestión de partidos (CRUD)
    ├── RegisterPage.jsx            # Registro de eventos en tiempo real
    ├── TeamStatsPage.jsx           # Stats de equipo (local vs visitante)
    ├── PlayersPage.jsx             # Stats individuales de jugadores
    ├── GoalkeepersPage.jsx         # Stats de porteros + heatmap portería
    ├── AdvancedPage.jsx            # Análisis avanzado por dimensión
    └── MVPPage.jsx                 # Ranking MVP + análisis automático
```

---

## 📊 Módulos

| Tab | Descripción |
|-----|-------------|
| 🏆 Partidos | Crear/editar/eliminar partidos · Gestión de plantilla |
| ⚡ Registrar | Registro de cada evento · Marcador en tiempo real · Exportar CSV |
| 📊 Equipo | Stats globales · Por zona/distancia/situación · Evolución temporal |
| 👥 Jugadores | Stats individuales · Por zona/técnica/distancia · Score |
| 🧤 Porteros | Stats porteros · Heatmap portería · Valoración automática |
| 📈 Avanzado | 6 dimensiones de análisis con gráficos y tablas |
| 🥇 MVP | Ranking MVP ponderado · Análisis automático por jugador |

---

## 🧠 Modelo de Evento

```js
{
  id, equipo, jugadorId, porteroId,
  tipoEvento, resultado, distancia,
  zonaAtaque, cuadrantePorteria,
  tipoLanzamiento, tipoAtaque,
  situacionNumerica, minuto
}
```

---

## 🛠 Stack

- **React 18** + **Vite 5**
- **Recharts** — visualizaciones
- **LocalStorage** — persistencia (0 backend)
- **Vercel** — deploy gratuito
