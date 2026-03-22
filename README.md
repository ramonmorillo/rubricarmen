# RubriCarmen

Aplicación para profesorado de **2º de Bachillerato** que analiza trabajos sobre **Luis Cernuda** a partir del **PDF del alumno**, extrae el texto, aplica **OCR** cuando es necesario, evalúa según una **rúbrica cualitativa editable en JSON** y genera un **informe PDF individualizado**.

> **Importante:** la herramienta **no calcula la nota final**. La nota se sigue gestionando en iDoceo o en el sistema docente habitual. RubriCarmen solo proporciona una valoración orientativa, prudente y trazable para apoyar la revisión profesional.

---

## 1. Flujo funcional implementado

La aplicación ahora trabaja con este circuito:

1. El profesorado sube un **PDF** del trabajo del alumno.
2. El backend intenta extraer **texto digital embebido**.
3. Si no encuentra texto suficiente, intenta aplicar **OCR**.
4. La app indica claramente si el documento se ha leído como:
   - **Texto digital embebido**
   - **PDF escaneado con OCR**
5. Si el OCR es de calidad baja, la interfaz muestra un **aviso explícito de revisión manual recomendada**.
6. El backend analiza el trabajo con una **rúbrica JSON editable**.
7. Para cada criterio devuelve:
   - criterio,
   - nivel detectado,
   - justificación breve,
   - evidencia textual,
   - recomendación de mejora.
8. Además, compara el trabajo con una **base de conocimiento interna** para:
   - comprobar apoyo factual,
   - detectar dependencia textual o estructural excesiva.
9. Finalmente, el frontend genera un **PDF individualizado** con la valoración cualitativa.

---

## 2. Arquitectura actual

### Frontend
- **React + Vite**.
- Interfaz orientada a profesorado.
- Subida de PDF.
- Visualización del estado de extracción, OCR, criterios, originalidad y recomendaciones.
- Exportación a **JSON** y a **PDF**.

### Backend
- Backend seguro en `server/` con **Node.js** y módulos nativos.
- Endpoints:
  - `GET /api/health`
  - `POST /api/evaluate`
- El cliente envía el PDF como **base64** por JSON al backend.
- El backend organiza el flujo en módulos:
  - `pdfExtractor`
  - `ocrFallback`
  - `rubricMatcher`
  - `knowledgeComparator`
  - `originalityChecker`
  - `reportGenerator`

---

## 3. Estructura del proyecto

```text
rubricarmen/
├─ examples/
│  └─ sample-output.json
├─ knowledge-base/
│  └─ cernuda-knowledge.json
├─ rubric/
│  └─ cernuda-2bach.json
├─ server/
│  ├─ index.js
│  ├─ knowledgeComparator.js
│  ├─ ocrFallback.js
│  ├─ originalityChecker.js
│  ├─ pdfExtractor.js
│  ├─ reportGenerator.js
│  ├─ rubricMatcher.js
│  └─ utils.js
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
│  └─ App.jsx
└─ README.md
```

---

## 4. Rúbrica cualitativa editable

La rúbrica está en:

- `rubric/cernuda-2bach.json`

Incluye estos criterios:

- Portada
- Índice
- Introducción
- Biografía del autor
- Localización del poema
- Tema
- Estructura
- Análisis métrico
- Análisis del estilo
- Comentario crítico
- Conclusión
- Bibliografía
- Originalidad
- Ortografía y redacción

Niveles usados:

- Excelente
- Notable
- Adecuado
- Insuficiente
- Muy deficiente

---

## 5. Lógica de originalidad y dependencia de fuentes

La app **no afirma “plagio confirmado”**.

Solo utiliza estas categorías:

- **Sin indicios relevantes**
- **Sospecha moderada de dependencia de fuentes**
- **Sospecha alta de copia o reproducción**

La señalización se apoya en indicios como:

- similitud con materiales de apoyo de la base de conocimiento,
- reformulación insuficiente,
- bloques demasiado genéricos o impropios del nivel,
- ausencia de interpretación personal,
- saltos de estilo,
- coincidencias textuales extensas.

La coincidencia conceptual esperable en un trabajo sobre Cernuda **no debe interpretarse como copia**.

---

## 6. Base de conocimiento interna

La base de conocimiento está en:

- `knowledge-base/cernuda-knowledge.json`

Se usa para dos funciones:

1. **Comprobación de apoyo factual** sobre Luis Cernuda.
2. **Detección de dependencia excesiva** de materiales de apoyo.

Puedes ampliarla con:

- fichas docentes,
- comentarios modelo,
- materiales sobre poemas concretos,
- resúmenes curriculares del departamento.

Recomendación importante: incluir materiales reales del centro para que la detección de dependencia sea más útil y ajustada a vuestro contexto.

---

## 7. Requisitos del sistema

### Necesarios
- **Node.js 20+**.
- **npm** para el frontend.

### Recomendados para OCR real sobre PDFs escaneados
Instalar en el servidor o máquina de despliegue:

- `pdftotext`
- `pdftoppm`
- `tesseract`
- paquete de idioma español de Tesseract (`spa`)

En Debian/Ubuntu, por ejemplo:

```bash
sudo apt install poppler-utils tesseract-ocr tesseract-ocr-spa
```

---

## 8. Desarrollo local

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
npm run server:dev
```

Por defecto, el frontend apunta a:

```text
http://127.0.0.1:8787/api/evaluate
```

Si necesitas cambiar la URL del backend, crea un archivo `.env` en la raíz con:

```bash
VITE_EVALUATION_API_URL=http://127.0.0.1:8787/api/evaluate
```

---

## 9. Respuesta del backend

La respuesta principal incluye:

- datos del alumno,
- estado del documento,
- uso o no de OCR,
- calidad estimada del OCR,
- avisos de extracción,
- criterios evaluados,
- bloque de originalidad,
- comprobaciones contra base de conocimiento,
- estructura preparada para el informe final.

---

## 10. Informe PDF final

El PDF generado por el frontend incluye:

- nombre del alumno,
- fecha,
- estado del documento,
- modo de extracción,
- tabla por criterios con nivel alcanzado,
- comentario breve por criterio,
- evidencia textual,
- bloque final de originalidad,
- bloque final de sospecha de copia/dependencia de fuentes,
- observación final:
  - **“Informe orientativo para revisión docente”**

---

## 11. Limitaciones actuales

1. El OCR depende de utilidades del sistema (`pdftoppm` y `tesseract`). Si no están instaladas, el backend informa con claridad de que el OCR no está disponible.
2. La extracción de texto embebido mejora mucho si `pdftotext` está instalado. Sin esa utilidad, el backend aplica un intento de lectura más simple y menos fiable.
3. La detección de originalidad es **prudente y orientativa**, no forense.
4. El valor de la herramienta aumenta si se enriquece la base de conocimiento con materiales reales del departamento.
5. El entorno actual de esta tarea puede impedir instalar dependencias npm o del sistema; por eso el backend se ha implementado con módulos nativos de Node y apoyos opcionales del sistema operativo.

---

## 12. Despliegue recomendado

- Frontend estático con Vite.
- Backend Node.js desplegado en un entorno interno del centro, servidor propio o VPS.
- OCR habilitado solo en el backend, nunca en el cliente.
- Si el centro lo desea, puede mantenerse el antiguo Worker como pieza separada, pero el flujo principal de esta versión queda orientado al backend de `server/`.

---

## 13. Despliegue en GitHub Pages

La publicación del frontend se realiza con **GitHub Actions** mediante el workflow `.github/workflows/deploy.yml`.

Puntos clave de la configuración:

- La app de Vite usa la base fija `/rubricarmen/` para que los assets resuelvan correctamente en `https://ramonmorillo.github.io/rubricarmen/`.
- Cada **push a `main`** ejecuta la instalación de dependencias, el build con `npm run build` y la publicación automática de la carpeta `dist` en **GitHub Pages**.
- GitHub Pages debe estar configurado en el repositorio para usar **GitHub Actions** como fuente de despliegue.

