import http from 'node:http';
import rubric from '../rubric/cernuda-2bach.json' with { type: 'json' };
import { pdfExtractor, releasePdfExtraction } from './pdfExtractor.js';
import { ocrFallback } from './ocrFallback.js';
import { knowledgeComparator } from './knowledgeComparator.js';
import { originalityChecker } from './originalityChecker.js';
import { reportGenerator } from './reportGenerator.js';
import { rubricMatcher } from './rubricMatcher.js';

const PORT = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { ok: true, rubricId: rubric.id, server: 'node-http' });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/evaluate') {
    sendJson(res, 404, { error: 'Ruta no encontrada.' });
    return;
  }

  let extractionResult;
  try {
    const body = await readJson(req);
    const validationError = validateRequest(body);
    if (validationError) {
      sendJson(res, 400, { error: validationError });
      return;
    }

    const pdfBuffer = Buffer.from(body.pdfBase64, 'base64');
    extractionResult = await pdfExtractor(pdfBuffer);
    let essayText = extractionResult.text;
    let usedOcr = false;
    const warnings = [...extractionResult.warnings];
    let ocrQuality = 'not-needed';

    if (!extractionResult.hasEmbeddedText) {
      const ocrResult = await ocrFallback(extractionResult);
      warnings.push(...ocrResult.warnings);
      if (!ocrResult.available) {
        sendJson(res, 422, {
          error: 'El PDF no contiene texto digital suficiente y el OCR no está disponible en este entorno.',
          warnings,
        });
        return;
      }
      essayText = ocrResult.text;
      usedOcr = ocrResult.used;
      ocrQuality = ocrResult.quality;
    }

    if (essayText.trim().length < 220) {
      sendJson(res, 422, {
        error: 'No se ha podido extraer suficiente texto del PDF para una evaluación fiable.',
        warnings,
      });
      return;
    }

    const comparison = knowledgeComparator(essayText);
    const originality = originalityChecker(essayText, comparison);
    const criteria = rubricMatcher({
      essayText,
      student: body.student,
      originality,
      extractionMeta: { usedOcr, ocrQuality },
    });

    const extraction = {
      hasEmbeddedText: extractionResult.hasEmbeddedText,
      usedOcr,
      documentStatus: extractionResult.hasEmbeddedText ? 'Texto digital embebido' : 'PDF escaneado con OCR',
      ocrQuality,
      warnings,
      extractedTextPreview: essayText.slice(0, 1200),
    };

    const report = reportGenerator({ student: body.student, extraction, criteria, originality });

    sendJson(res, 200, {
      rubricId: rubric.id,
      rubricName: rubric.name,
      student: body.student,
      extraction,
      knowledgeBaseCheck: comparison,
      originality,
      criteria,
      report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendJson(res, 500, { error: `No se ha podido completar el análisis: ${error.message}` });
  } finally {
    await releasePdfExtraction(extractionResult);
  }
});

server.listen(PORT, () => {
  console.log(`RubriCarmen backend escuchando en http://127.0.0.1:${PORT}`);
});

function validateRequest(body) {
  if (body?.rubricId !== rubric.id) return 'La rúbrica solicitada no está disponible.';
  if (!body?.student?.name || !body?.student?.group) return 'Faltan nombre del alumno o grupo/curso.';
  if (!body?.pdfBase64) return 'Debes adjuntar un PDF del alumno.';
  return '';
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
