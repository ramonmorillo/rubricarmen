import rubric from '../rubric/cernuda-2bach.json';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: jsonHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      return Response.json(
        {
          ok: true,
          rubric: rubric.id,
          mode: 'legacy-worker',
          message: 'El flujo principal de evaluación con PDF y OCR se ha trasladado a server/index.js.',
        },
        { headers: jsonHeaders },
      );
    }

    if (request.method === 'POST' && url.pathname === '/api/evaluate') {
      return Response.json(
        {
          error:
            'El Worker ya no es el backend principal para esta versión. Usa el backend Node de server/index.js para PDF, OCR y evaluación cualitativa.',
        },
        { status: 501, headers: jsonHeaders },
      );
    }

    return Response.json({ error: 'Ruta no encontrada.' }, { status: 404, headers: jsonHeaders });
  },
};
