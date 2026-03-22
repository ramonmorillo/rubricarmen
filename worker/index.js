import rubric from '../rubric/cernuda-2bach.json';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: jsonHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, rubric: rubric.id }, { headers: jsonHeaders });
    }

    if (request.method !== 'POST' || url.pathname !== '/api/evaluate') {
      return Response.json({ error: 'Ruta no encontrada.' }, { status: 404, headers: jsonHeaders });
    }

    try {
      const body = await request.json();
      const validation = validateRequest(body);
      if (!validation.valid) {
        return Response.json({ error: validation.message }, { status: 400, headers: jsonHeaders });
      }

      const evaluation = env.OPENAI_API_KEY
        ? await evaluateWithAi(body, env)
        : evaluateHeuristically(body);

      return Response.json(evaluation, { headers: jsonHeaders });
    } catch (error) {
      return Response.json(
        { error: `No se ha podido generar la evaluación: ${error.message}` },
        { status: 500, headers: jsonHeaders },
      );
    }
  },
};

function validateRequest(body) {
  if (!body?.student?.name || !body?.student?.group || !body?.student?.assignmentTitle) {
    return { valid: false, message: 'Faltan datos obligatorios del alumno o del trabajo.' };
  }

  if (!body?.essayText || body.essayText.trim().length < 220) {
    return { valid: false, message: 'El trabajo debe incluir al menos 220 caracteres para poder analizarlo.' };
  }

  if (body.rubricId !== rubric.id) {
    return { valid: false, message: 'La rúbrica solicitada no está disponible en este momento.' };
  }

  return { valid: true };
}

async function evaluateWithAi(body, env) {
  const systemPrompt = [
    'Eres una herramienta de apoyo docente para Bachillerato.',
    'Debes evaluar trabajos sobre Luis Cernuda con un tono académico, prudente y respetuoso.',
    'Nunca presentes la evaluación como infalible.',
    'Debes justificar cada criterio con evidencia textual o indicar explícitamente que no hay evidencia suficiente.',
    'Responde únicamente con JSON válido siguiendo exactamente el esquema pedido.',
  ].join(' ');

  const userPrompt = {
    rubric,
    student: body.student,
    essayText: body.essayText,
    instructions: {
      finalScoreScale: 10,
      schema: {
        rubricId: 'string',
        rubricName: 'string',
        generatedAt: 'ISO date string',
        student: {
          name: 'string',
          group: 'string',
          assignmentTitle: 'string',
        },
        criteria: [
          {
            id: 'criterion id',
            name: 'criterion name',
            weight: 'number',
            level: 'integer 1-4',
            score: 'number with final scale over 10 contribution',
            descriptorApplied: 'descriptor for chosen level',
            justification: 'brief teacher-facing explanation',
            evidenceSummary: 'quoted or paraphrased evidence or explicit insufficiency notice',
          },
        ],
        summary: {
          strengths: ['array of strings'],
          weaknesses: ['array of strings'],
          recommendations: ['array of strings'],
          finalObservation: 'string',
        },
        finalScore: 'number over 10',
      },
    },
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPrompt) },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`El proveedor de IA devolvió un error: ${errorText}`);
  }

  const completion = await response.json();
  const rawContent = completion.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('La respuesta del proveedor de IA no contiene contenido útil.');
  }

  const parsed = JSON.parse(rawContent);
  return normalizeEvaluation(parsed, body.student);
}

function evaluateHeuristically(body) {
  const normalizedText = normalize(body.essayText);
  const sentences = body.essayText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const criteria = rubric.criteria.map((criterion) => {
    const assessment = assessCriterion(criterion, normalizedText, sentences, body.essayText);
    return {
      id: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      level: assessment.level,
      score: roundToTwo(((assessment.level / 4) * criterion.weight * rubric.finalScoreScale)),
      descriptorApplied: criterion.levels[String(assessment.level)],
      justification: assessment.justification,
      evidenceSummary: assessment.evidenceSummary,
    };
  });

  const strengths = criteria
    .filter((criterion) => criterion.level >= 3)
    .slice(0, 3)
    .map((criterion) => `${criterion.name}: ${criterion.justification}`);

  const weaknesses = criteria
    .filter((criterion) => criterion.level <= 2)
    .slice(0, 3)
    .map((criterion) => `${criterion.name}: ${criterion.justification}`);

  const recommendations = criteria
    .filter((criterion) => criterion.level <= 3)
    .slice(0, 3)
    .map((criterion) => recommendationForCriterion(criterion.id));

  const finalScore = roundToTwo(criteria.reduce((total, criterion) => total + criterion.score, 0));

  return {
    rubricId: rubric.id,
    rubricName: rubric.name,
    generatedAt: new Date().toISOString(),
    student: body.student,
    criteria,
    summary: {
      strengths: strengths.length ? strengths : ['El texto ofrece algún punto de partida válido, aunque conviene contrastarlo manualmente.'],
      weaknesses: weaknesses.length ? weaknesses : ['No se han detectado debilidades claras, pero la profesora debería revisar el informe antes de cerrar la nota.'],
      recommendations: recommendations.length
        ? recommendations
        : ['Añadir citas o referencias más precisas del texto trabajado para reforzar la argumentación.'],
      finalObservation: buildFinalObservation(body.student.name, finalScore, strengths, weaknesses),
    },
    finalScore,
  };
}

function assessCriterion(criterion, normalizedText, sentences, originalText) {
  const profiles = {
    'author-context': {
      keywords: ['generacion del 27', 'exilio', 'surrealismo', 'historia', 'guerra civil', 'biografia', 'contexto'],
      evidenceKeywords: ['cernuda', '27', 'exilio', 'contexto', 'sevilla', 'guerra'],
      strongMessage: 'Se relaciona a Cernuda con su generación y con elementos de contexto histórico-literario de forma pertinente.',
      weakMessage: 'La contextualización del autor aparece de forma limitada o solo implícita.',
    },
    'thematic-analysis': {
      keywords: ['deseo', 'realidad', 'amor', 'soledad', 'memoria', 'nostalgia', 'libertad', 'identidad'],
      evidenceKeywords: ['deseo', 'realidad', 'soledad', 'nostalgia', 'amor'],
      strongMessage: 'El trabajo identifica temas nucleares de la poesía cernudiana y los desarrolla con cierta coherencia.',
      weakMessage: 'Se mencionan temas, pero faltan desarrollo o ejemplos más precisos.',
    },
    'literary-style': {
      keywords: ['simbolo', 'tono', 'voz poetica', 'estilo', 'metafora', 'imagenes', 'lenguaje', 'ritmo', 'depurada'],
      evidenceKeywords: ['tono', 'estilo', 'simbolo', 'voz', 'metafora', 'lenguaje'],
      strongMessage: 'Se comentan rasgos estilísticos o formales y se conectan con el sentido del poema o de la obra.',
      weakMessage: 'El comentario literario es escaso o más descriptivo que analítico.',
    },
    'structure-coherence': {
      keywords: ['en primer lugar', 'ademas', 'por otra parte', 'por eso', 'en conclusion'],
      evidenceKeywords: ['además', 'por eso', 'sin embargo', 'en conclusión'],
      strongMessage: 'La redacción mantiene una progresión clara de ideas y una organización reconocible.',
      weakMessage: 'La estructura general resulta comprensible, pero podría ordenar mejor las ideas o reforzar las transiciones.',
    },
    'language-accuracy': {
      keywords: ['.'],
      evidenceKeywords: [],
      strongMessage: 'La redacción es generalmente clara y adecuada al registro académico.',
      weakMessage: 'La expresión escrita necesita mayor revisión para ganar precisión y corrección.',
    },
    'interpretive-originality': {
      keywords: ['a mi juicio', 'considero', 'interpreto', 'pienso', 'sugiere', 'lectura personal', 'actual'],
      evidenceKeywords: ['a mi juicio', 'considero', 'actual', 'libertad individual'],
      strongMessage: 'Se aprecia una interpretación propia apoyada en argumentos del texto.',
      weakMessage: 'Predomina la exposición informativa y la interpretación personal aparece poco desarrollada.',
    },
  };

  const profile = profiles[criterion.id];
  const hits = profile.keywords.reduce((count, keyword) => count + keywordCount(normalizedText, keyword), 0);
  const evidence = extractEvidence(sentences, profile.evidenceKeywords, originalText);

  if (criterion.id === 'structure-coherence') {
    const paragraphCount = originalText.split(/\n\s*\n/).filter(Boolean).length;
    const connectorHits = hits;
    const level = paragraphCount >= 3 && connectorHits >= 2 ? 4 : paragraphCount >= 2 ? 3 : paragraphCount >= 1 ? 2 : 1;
    return {
      level,
      justification: level >= 3 ? profile.strongMessage : profile.weakMessage,
      evidenceSummary: evidence || 'No hay suficiente evidencia explícita; la valoración se basa en la organización observable del conjunto del texto.',
    };
  }

  if (criterion.id === 'language-accuracy') {
    const typoPenalty = countLikelyTypos(originalText);
    const level = typoPenalty <= 1 ? 4 : typoPenalty <= 3 ? 3 : typoPenalty <= 6 ? 2 : 1;
    return {
      level,
      justification: level >= 3 ? profile.strongMessage : profile.weakMessage,
      evidenceSummary:
        level >= 3
          ? 'No se observan errores graves recurrentes en la muestra aportada, aunque la revisión docente sigue siendo necesaria.'
          : 'Se detectan indicios de puntuación o formulación mejorables; conviene revisar el texto completo manualmente.',
    };
  }

  const level = hits >= 5 && evidence ? 4 : hits >= 3 ? 3 : hits >= 1 ? 2 : 1;
  return {
    level,
    justification: level >= 3 ? profile.strongMessage : profile.weakMessage,
    evidenceSummary: evidence || 'No hay evidencia textual suficiente para sostener una valoración más alta en este criterio.',
  };
}

function extractEvidence(sentences, keywords, originalText) {
  if (!keywords.length) return '';
  const matches = sentences.filter((sentence) => keywords.some((keyword) => normalize(sentence).includes(normalize(keyword))));
  if (!matches.length) return '';
  return matches
    .slice(0, 2)
    .map((sentence) => trimSentence(sentence, originalText.length > 900 ? 150 : 220))
    .join(' · ');
}

function recommendationForCriterion(criterionId) {
  const recommendations = {
    'author-context': 'Ampliar la relación entre la biografía de Cernuda, la Generación del 27 y el contexto del exilio para fundamentar mejor el comentario.',
    'thematic-analysis': 'Aportar ejemplos concretos de temas como deseo, realidad, amor o exilio y explicar su función en el texto.',
    'literary-style': 'Incorporar un comentario más preciso sobre símbolos, tono y recursos expresivos para reforzar el análisis literario.',
    'structure-coherence': 'Reorganizar el texto en apartados bien enlazados y usar conectores que clarifiquen el hilo argumental.',
    'language-accuracy': 'Revisar ortografía, puntuación y precisión léxica antes de entregar la versión final.',
    'interpretive-originality': 'Desarrollar una interpretación propia mejor argumentada, apoyándola con evidencia textual o comparaciones pertinentes.',
  };

  return recommendations[criterionId];
}

function buildFinalObservation(studentName, finalScore, strengths, weaknesses) {
  const performanceBand = finalScore >= 8
    ? 'muestra un desempeño sólido y bien orientado para el nivel de 2º de Bachillerato'
    : finalScore >= 6
      ? 'presenta una base adecuada, aunque todavía mejorable en algunos apartados clave'
      : 'necesita revisión y acompañamiento para consolidar los aspectos fundamentales del comentario literario';

  const strengthsText = strengths[0] || 'ofrece algunos indicios positivos';
  const weaknessesText = weaknesses[0] || 'conviene revisar el conjunto del texto con atención';

  return `${studentName} ${performanceBand}. Como punto favorable, ${strengthsText.toLowerCase()}. Al mismo tiempo, ${weaknessesText.toLowerCase()}. Esta valoración es orientativa y debería completarse con la lectura docente del trabajo original.`;
}

function normalizeEvaluation(parsed, student) {
  const criteria = rubric.criteria.map((criterion) => {
    const incoming = parsed.criteria?.find((item) => item.id === criterion.id) || {};
    const level = clamp(Number(incoming.level) || 1, 1, 4);
    return {
      id: criterion.id,
      name: criterion.name,
      weight: criterion.weight,
      level,
      score: roundToTwo(Number(incoming.score) || ((level / 4) * criterion.weight * rubric.finalScoreScale)),
      descriptorApplied: incoming.descriptorApplied || criterion.levels[String(level)],
      justification: incoming.justification || 'No se proporcionó justificación específica; conviene revisar manualmente este criterio.',
      evidenceSummary: incoming.evidenceSummary || 'No se indicó evidencia suficiente en la respuesta automática.',
    };
  });

  return {
    rubricId: rubric.id,
    rubricName: rubric.name,
    generatedAt: parsed.generatedAt || new Date().toISOString(),
    student,
    criteria,
    summary: {
      strengths: Array.isArray(parsed.summary?.strengths) && parsed.summary.strengths.length
        ? parsed.summary.strengths
        : ['La respuesta automática no devolvió fortalezas detalladas; se recomienda revisión docente.'],
      weaknesses: Array.isArray(parsed.summary?.weaknesses) && parsed.summary.weaknesses.length
        ? parsed.summary.weaknesses
        : ['La respuesta automática no devolvió debilidades detalladas; se recomienda revisión docente.'],
      recommendations: Array.isArray(parsed.summary?.recommendations) && parsed.summary.recommendations.length
        ? parsed.summary.recommendations
        : ['Revisar el informe y completar manualmente las recomendaciones al alumnado.'],
      finalObservation:
        parsed.summary?.finalObservation ||
        'La evaluación generada por IA debe considerarse un apoyo inicial y no sustituye la revisión experta de la profesora.',
    },
    finalScore: roundToTwo(Number(parsed.finalScore) || criteria.reduce((sum, criterion) => sum + criterion.score, 0)),
  };
}

function keywordCount(text, keyword) {
  if (keyword === '.') {
    return 1;
  }
  const pattern = new RegExp(escapeRegExp(normalize(keyword)), 'g');
  return (text.match(pattern) || []).length;
}

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function trimSentence(sentence, maxLength) {
  return sentence.length <= maxLength ? sentence : `${sentence.slice(0, maxLength).trim()}…`;
}

function countLikelyTypos(text) {
  const spacingErrors = (text.match(/\s+[,.!?;:]/g) || []).length;
  const repeatedPunctuation = (text.match(/[!?.,;:]{3,}/g) || []).length;
  const lowercaseSentenceStarts = (text.match(/(?:^|[.!?]\s+)[a-záéíóúñ]/g) || []).length;
  return spacingErrors + repeatedPunctuation + Math.max(0, lowercaseSentenceStarts - 1);
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
