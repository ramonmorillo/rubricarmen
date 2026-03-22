# RubriCarmen

Aplicación web profesional para que profesorado de **2º de Bachillerato** evalúe trabajos escritos sobre **Luis Cernuda** mediante una **rúbrica docente editable**, reciba una **valoración asistida por IA** y genere un **PDF individualizado** por alumno.

> **Importante:** la herramienta está diseñada como apoyo a la evaluación, no como sustituto del juicio docente. Siempre muestra una advertencia de uso y procura justificar cada criterio con evidencia textual o indicar cuando esa evidencia es insuficiente.

---

## 1. Qué incluye esta primera versión funcional

### Frontend
- **React + Vite**.
- **Tailwind CSS** para una interfaz limpia y moderna.
- Formulario para introducir datos del alumno y pegar el texto del trabajo.
- Pantalla de resultados con:
  - criterios evaluados,
  - nivel aplicado,
  - puntuación por criterio,
  - descriptor,
  - justificación breve,
  - evidencia textual o aviso de evidencia insuficiente.
- Botones para:
  - **Analizar trabajo**,
  - **Generar PDF**,
  - **Exportar JSON**,
  - **Reiniciar evaluación**.
- Preparado para **GitHub Pages** mediante la propiedad `base` de Vite controlada por variable de entorno.

### Backend
- **Cloudflare Worker** separado del frontend.
- Sin claves en cliente.
- Dos modos de funcionamiento:
  1. **Con IA real**: si configuras `OPENAI_API_KEY`, el Worker solicita una valoración estructurada al modelo.
  2. **Modo funcional sin clave**: si no configuras clave, el Worker genera una evaluación heurística basada en la rúbrica y en evidencias detectadas en el texto. Esto permite disponer de una versión operativa desde el primer momento.

### Datos y ejemplos
- Rúbrica editable en `rubric/cernuda-2bach.json`.
- Ejemplo de trabajo del alumno en `examples/sample-work.txt`.
- Ejemplo de salida estructurada en `examples/sample-output.json`.

---

## 2. Estructura del proyecto

```text
rubricarmen/
├─ examples/
│  ├─ sample-output.json
│  └─ sample-work.txt
├─ rubric/
│  └─ cernuda-2bach.json
├─ src/
│  ├─ components/
│  │  ├─ AppShell.jsx
│  │  ├─ EvaluationForm.jsx
│  │  └─ ResultsPanel.jsx
│  ├─ lib/
│  │  ├─ api.js
│  │  ├─ formatters.js
│  │  ├─ i18n.js
│  │  └─ pdf.js
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ worker/
│  ├─ index.js
│  └─ wrangler.toml
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
├─ vite.config.js
└─ README.md
```

---

## 3. Requisitos previos

- **Node.js 20+** recomendado.
- **npm 10+** recomendado.
- Cuenta de **Cloudflare** para desplegar el Worker.
- Opcional: una clave `OPENAI_API_KEY` para usar evaluación con IA en lugar del modo heurístico local del Worker.

---

## 4. Instalación local

```bash
npm install
```

### Lanzar frontend en desarrollo
```bash
npm run dev
```

### Lanzar Worker en desarrollo
En otra terminal:
```bash
npm run worker:dev
```

Por defecto, el frontend apunta a:

```text
http://127.0.0.1:8787/api/evaluate
```

Si quieres usar otro endpoint, crea un archivo `.env` en la raíz con:

```bash
VITE_EVALUATION_API_URL=https://tu-worker.tu-subdominio.workers.dev/api/evaluate
```

---

## 5. Configuración del Worker

El Worker está en `worker/index.js` y expone:

- `POST /api/evaluate`
- `GET /api/health`
- `OPTIONS /api/evaluate`

### Variables del Worker
Puedes configurar estas variables/secretos:

#### Obligatoria solo si quieres IA real
```bash
OPENAI_API_KEY
```

#### Opcional
```bash
OPENAI_MODEL=gpt-4o-mini
```

### Desarrollo local con clave
```bash
npx wrangler secret put OPENAI_API_KEY
```

Luego:
```bash
npm run worker:dev
```

### Cómo funciona la evaluación

#### Si existe `OPENAI_API_KEY`
El Worker:
1. valida la entrada,
2. envía la rúbrica + trabajo al modelo,
3. exige salida JSON,
4. normaliza la respuesta,
5. devuelve el informe al frontend.

#### Si no existe `OPENAI_API_KEY`
El Worker:
1. analiza el texto con reglas heurísticas,
2. busca indicadores de contexto, temas, estilo, conectores y formulaciones interpretativas,
3. asigna un nivel por criterio,
4. genera justificaciones prudentes,
5. señala cuando **no hay evidencia textual suficiente**.

Este modo no sustituye la IA real, pero permite una **versión funcional y utilizable** sin bloquear la puesta en marcha del proyecto.

---

## 6. Despliegue del frontend en GitHub Pages

### Opción recomendada: despliegue con GitHub Actions

1. Sube el proyecto a GitHub.
2. Activa GitHub Pages en el repositorio.
3. Añade en el flujo de build la variable:

```bash
GITHUB_PAGES=true
```

Esto hace que Vite use:

```text
/rubricarmen/
```

como `base` en producción.

### Build manual
```bash
GITHUB_PAGES=true npm run build
```

El contenido generado en `dist/` puede publicarse en GitHub Pages.

### Variable de entorno del frontend
Antes del build, configura el endpoint del Worker:

```bash
VITE_EVALUATION_API_URL=https://tu-worker.tu-subdominio.workers.dev/api/evaluate
```

### Ejemplo de flujo básico de GitHub Actions

```yaml
name: Deploy frontend to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: GITHUB_PAGES=true npm run build
        env:
          VITE_EVALUATION_API_URL: ${{ secrets.VITE_EVALUATION_API_URL }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 7. Despliegue del backend en Cloudflare Worker

### Autenticación con Cloudflare
```bash
npx wrangler login
```

### Despliegue
```bash
npm run worker:deploy
```

### Configurar el secreto de IA
```bash
npx wrangler secret put OPENAI_API_KEY
```

### Verificación rápida
```bash
curl https://tu-worker.tu-subdominio.workers.dev/api/health
```

---

## 8. Uso de la aplicación

1. Introduce el nombre del alumno.
2. Introduce grupo/curso.
3. Introduce el título del trabajo.
4. Pega el texto completo.
5. Pulsa **Analizar trabajo**.
6. Revisa la propuesta de evaluación.
7. Exporta el resultado en **PDF** o **JSON**.
8. Si deseas empezar de nuevo, usa **Reiniciar evaluación**.

También puedes usar **Cargar ejemplo** para rellenar el formulario y visualizar una salida ya preparada.

---

## 9. Archivo de rúbrica editable

La rúbrica está en:

```text
rubric/cernuda-2bach.json
```

Cada criterio incluye:
- `id`
- `name`
- `weight`
- `levels`

Los niveles van del **1 al 4** y contienen un descriptor completo por nivel.

Si más adelante quieres añadir nuevas rúbricas, la arquitectura actual ya permite extender el selector del frontend y la lógica del Worker.

---

## 10. PDF generado

El botón **Generar PDF** crea un informe con:
- cabecera profesional,
- datos del alumno,
- fecha de evaluación,
- tabla de criterios,
- puntuaciones,
- comentarios individualizados,
- fortalezas,
- aspectos de mejora,
- recomendaciones,
- nota final destacada,
- pie con fecha de generación.

La generación se realiza en el frontend con `jsPDF`, de modo que la profesora puede descargar el informe al instante.

---

## 11. Consideraciones pedagógicas incorporadas

- La evaluación se presenta como **asistida por IA**, no como automática e infalible.
- El lenguaje es **académico, claro y respetuoso**.
- Cuando no se detecta base suficiente para una valoración fuerte, el informe lo dice de forma explícita.
- Se intenta justificar cada criterio con evidencia del texto o con una advertencia prudente sobre la insuficiencia de evidencia.
- Las observaciones finales están redactadas para ser útiles tanto a la profesora como al alumnado.

---

## 12. Validaciones incluidas

### En el frontend
- campos obligatorios,
- longitud mínima del texto antes de analizar,
- control visual de errores.

### En el Worker
- validación del identificador de rúbrica,
- validación de datos del alumno,
- validación de longitud mínima del trabajo,
- manejo elegante de errores con respuesta JSON.

---

## 13. Preparación para futura internacionalización

Se ha dejado una base simple en `src/lib/i18n.js` para separar textos de interfaz. La primera versión está en español, pero la estructura permite evolucionar a un sistema de etiquetas por idioma más amplio.

---

## 14. Archivos de ejemplo

### Trabajo de ejemplo
```text
examples/sample-work.txt
```

### Salida JSON de ejemplo
```text
examples/sample-output.json
```

---

## 15. Mejoras futuras recomendadas

- Soporte multi-rúbrica.
- Historial de evaluaciones.
- Carga de documentos `.docx` o `.pdf`.
- Panel de administración de rúbricas.
- Ajustes de idioma español/inglés.
- Autenticación docente.
- Almacenamiento seguro de informes.
- Citas textuales automáticas con fragmentos destacados del trabajo.

---

## 16. Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run worker:dev
npm run worker:deploy
```

---

## 17. Nota final de diseño

Esta primera versión prioriza **simplicidad**, **robustez**, **separación frontend/backend** y **utilidad real para profesorado**. No es un prototipo vacío: el sistema puede funcionar ya con un Worker heurístico y queda preparado para integrar un proveedor de IA real mediante secretos del backend.
