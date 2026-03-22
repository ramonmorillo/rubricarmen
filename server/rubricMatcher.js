import rubric from '../rubric/cernuda-2bach.json' with { type: 'json' };
import { extractEvidence, findKeywordHits, levelFromScore, normalizeText, splitParagraphs, splitSentences } from './utils.js';

const criterionProfiles = {
  portada: {
    keywords: ['portada', 'nombre', 'curso', 'luis cernuda', 'título'],
    recommendation: 'Añadir una portada completa con identificación del alumno, curso y título del trabajo.',
    scorer: ({ text, paragraphs, student }) => {
      const firstBlock = paragraphs[0] || text.slice(0, 400);
      let score = 0;
      if (student.name && firstBlock.toLowerCase().includes(student.name.toLowerCase())) score += 0.35;
      if (student.group && firstBlock.toLowerCase().includes(student.group.toLowerCase())) score += 0.2;
      if (student.assignmentTitle && firstBlock.toLowerCase().includes(student.assignmentTitle.toLowerCase().slice(0, 12))) score += 0.25;
      if (/luis cernuda|poema|trabajo/i.test(firstBlock)) score += 0.2;
      return Math.min(score, 1);
    },
  },
  indice: {
    keywords: ['índice', 'indice', 'introducción', 'biografía', 'conclusión', 'bibliografía'],
    recommendation: 'Incorporar un índice visible que anticipe los apartados principales del comentario.',
    scorer: ({ text }) => {
      const hits = findKeywordHits(text.slice(0, 1200), ['índice', 'introducción', 'biografía', 'conclusión', 'bibliografía']);
      return hits >= 4 ? 0.95 : hits >= 3 ? 0.72 : hits >= 2 ? 0.54 : hits >= 1 ? 0.3 : 0.05;
    },
  },
  introduccion: {
    keywords: ['introducción', 'presentamos', 'este trabajo', 'en este comentario'],
    recommendation: 'Abrir el trabajo con una introducción que sitúe el objetivo y el enfoque del comentario.',
    scorer: ({ paragraphs }) => {
      const intro = paragraphs[0] || '';
      const hits = findKeywordHits(intro, ['luis cernuda', 'poema', 'comentario', 'trabajo', 'analizar']);
      return hits >= 4 ? 0.9 : hits >= 3 ? 0.74 : hits >= 2 ? 0.56 : hits >= 1 ? 0.32 : 0.1;
    },
  },
  biografia: {
    keywords: ['sevilla', '1902', 'generación del 27', 'exilio', 'realidad y deseo'],
    recommendation: 'Relacionar mejor los datos biográficos de Cernuda con su trayectoria literaria y el poema analizado.',
    scorer: ({ text }) => {
      const hits = findKeywordHits(text, ['sevilla', '1902', 'generación del 27', 'exilio', 'realidad y deseo', 'poeta']);
      return hits >= 5 ? 0.94 : hits >= 4 ? 0.77 : hits >= 3 ? 0.58 : hits >= 2 ? 0.36 : 0.12;
    },
  },
  localizacion: {
    keywords: ['poema', 'libro', 'etapa', 'donde habite el olvido', 'los placeres prohibidos', 'la realidad y el deseo'],
    recommendation: 'Precisar el libro, etapa o marco de publicación del poema para localizarlo con mayor rigor.',
    scorer: ({ text, student }) => {
      const poemHit = student.poemTitle ? Number(normalizeText(text).includes(normalizeText(student.poemTitle))) : 0;
      const hits = findKeywordHits(text, ['poema', 'libro', 'etapa', 'publicado', 'realidad y deseo', 'donde habite el olvido', 'los placeres prohibidos']) + poemHit;
      return hits >= 5 ? 0.92 : hits >= 4 ? 0.75 : hits >= 3 ? 0.57 : hits >= 2 ? 0.34 : 0.1;
    },
  },
  tema: {
    keywords: ['tema', 'deseo', 'realidad', 'amor', 'soledad', 'nostalgia', 'libertad'],
    recommendation: 'Explicar el tema principal con más precisión y apoyarlo en rasgos del poema.',
    scorer: ({ text }) => {
      const hits = findKeywordHits(text, ['deseo', 'realidad', 'amor', 'soledad', 'nostalgia', 'libertad', 'tema']);
      return hits >= 6 ? 0.95 : hits >= 4 ? 0.78 : hits >= 3 ? 0.6 : hits >= 2 ? 0.38 : 0.14;
    },
  },
  estructura: {
    keywords: ['estructura', 'partes', 'estrofas', 'organización', 'progresión'],
    recommendation: 'Describir mejor la organización interna del poema o del comentario, indicando partes y progresión.',
    scorer: ({ text, paragraphs }) => {
      const hits = findKeywordHits(text, ['estructura', 'partes', 'estrofas', 'organización', 'progresión', 'primera parte', 'segunda parte']);
      return hits >= 5 && paragraphs.length >= 4 ? 0.9 : hits >= 3 ? 0.73 : hits >= 2 ? 0.55 : hits >= 1 ? 0.32 : 0.08;
    },
  },
  metrica: {
    keywords: ['verso', 'métrica', 'rima', 'heptasílabo', 'endecasílabo', 'sinalefa'],
    recommendation: 'Añadir un análisis métrico más concreto: medida de versos, rima y observaciones relevantes.',
    scorer: ({ text }) => {
      const hits = findKeywordHits(text, ['verso', 'métrica', 'rima', 'heptasílabo', 'endecasílabo', 'sinalefa', 'silva', 'asonante']);
      return hits >= 5 ? 0.93 : hits >= 4 ? 0.76 : hits >= 3 ? 0.58 : hits >= 2 ? 0.35 : 0.06;
    },
  },
  estilo: {
    keywords: ['metáfora', 'metafora', 'símbolo', 'simbolo', 'tono', 'voz poética', 'encabalgamiento'],
    recommendation: 'Profundizar en los recursos expresivos y relacionarlos con el sentido del poema.',
    scorer: ({ text }) => {
      const hits = findKeywordHits(text, ['metáfora', 'simbolo', 'símbolo', 'tono', 'voz poética', 'encabalgamiento', 'imagen', 'adjetivación']);
      return hits >= 5 ? 0.94 : hits >= 4 ? 0.77 : hits >= 3 ? 0.59 : hits >= 2 ? 0.36 : 0.12;
    },
  },
  comentarioCritico: {
    keywords: ['a mi juicio', 'considero', 'pienso', 'interpreto', 'lectura personal', 'actualidad'],
    recommendation: 'Reforzar la interpretación personal con una valoración propia mejor argumentada.',
    scorer: ({ text }) => {
      const opinionHits = findKeywordHits(text, ['a mi juicio', 'considero', 'pienso', 'me parece', 'interpreto', 'lectura personal']);
      const argumentHits = findKeywordHits(text, ['porque', 'por ello', 'esto sugiere', 'de este modo', 'por tanto']);
      const total = opinionHits + argumentHits;
      return total >= 6 ? 0.95 : total >= 4 ? 0.78 : total >= 3 ? 0.6 : total >= 2 ? 0.37 : 0.14;
    },
  },
  conclusion: {
    keywords: ['conclusión', 'en conclusión', 'para concluir', 'en definitiva'],
    recommendation: 'Cerrar el comentario con una conclusión que sintetice la interpretación lograda.',
    scorer: ({ paragraphs }) => {
      const closing = paragraphs.at(-1) || '';
      const hits = findKeywordHits(closing, ['conclusión', 'para concluir', 'en definitiva', 'en resumen', 'finalmente']);
      return hits >= 2 ? 0.9 : hits >= 1 ? 0.68 : closing.length > 220 ? 0.52 : closing.length > 120 ? 0.34 : 0.1;
    },
  },
  bibliografia: {
    keywords: ['bibliografía', 'bibliografia', 'editorial', 'consulta', 'https://', 'www.'],
    recommendation: 'Añadir bibliografía o webgrafía con formato reconocible y fuentes concretas.',
    scorer: ({ text }) => {
      const tail = text.slice(-1400);
      const hits = findKeywordHits(tail, ['bibliografía', 'bibliografia', 'editorial', 'consulta', 'recuperado', 'https://', 'www.']);
      return hits >= 4 ? 0.94 : hits >= 3 ? 0.74 : hits >= 2 ? 0.56 : hits >= 1 ? 0.32 : 0.08;
    },
  },
  ortografia: {
    keywords: ['ortografía', 'redacción'],
    recommendation: 'Revisar ortografía, puntuación y redacción para ganar precisión académica.',
    scorer: ({ text }) => {
      const errors = (text.match(/\s,|\s\.|\s;|\s:|\bq\b|\bxq\b|\bke\b|\baver\b/gi) || []).length;
      const paragraphs = splitParagraphs(text).length;
      if (errors <= 1 && paragraphs >= 3) return 0.9;
      if (errors <= 3) return 0.72;
      if (errors <= 5) return 0.54;
      if (errors <= 8) return 0.3;
      return 0.1;
    },
  },
};

export function rubricMatcher({ essayText, student, originality, extractionMeta }) {
  const sentences = splitSentences(essayText);
  const paragraphs = splitParagraphs(essayText);

  const criteria = rubric.criteria.map((criterion) => {
    if (criterion.id === 'originalidad') {
      return originalityCriterion(criterion, originality);
    }

    const profile = criterionProfiles[criterion.id];
    const score = profile?.scorer({ text: essayText, paragraphs, sentences, student, extractionMeta }) ?? 0.1;
    const evidence = extractEvidence(sentences, profile?.keywords || [], 2);
    const level = levelFromScore(score);
    const needsManualReview = evidence.length === 0;
    return {
      criterion: criterion.name,
      criterionId: criterion.id,
      detectedLevel: level,
      justification: buildJustification(level, criterion.name, evidence.length > 0),
      textualEvidence: evidence.length ? evidence : ['No hay evidencia suficiente en el texto extraído para valorar este criterio con mayor seguridad.'],
      recommendation: profile?.recommendation || 'Revisar este apartado con apoyo de la lectura docente directa.',
      needsManualReview,
    };
  });

  return criteria;
}

function originalityCriterion(criterion, originality) {
  const mappedLevel = {
    'Sin indicios relevantes': 'Notable',
    'Sospecha moderada de dependencia de fuentes': 'Adecuado',
    'Sospecha alta de copia o reproducción': 'Insuficiente',
  }[originality.category] || 'Adecuado';

  return {
    criterion: criterion.name,
    criterionId: criterion.id,
    detectedLevel: mappedLevel,
    justification: originality.category,
    textualEvidence: originality.findings.length
      ? originality.findings.map((item) => `${item.type}: ${item.evidence}`)
      : ['No se observan coincidencias textuales o estructurales excesivas con la base de conocimiento interna.'],
    recommendation: 'Interpretar este bloque con prudencia: la coincidencia conceptual esperable no debe confundirse con copia.',
    needsManualReview: originality.category !== 'Sin indicios relevantes' && originality.findings.length > 0,
  };
}

function buildJustification(level, criterionName, hasEvidence) {
  const base = {
    Excelente: `El criterio «${criterionName}» aparece resuelto con solidez y trazabilidad suficiente para una valoración alta.`,
    Notable: `El criterio «${criterionName}» está bien encaminado, aunque todavía admite algún matiz o refuerzo puntual.`,
    Adecuado: `El criterio «${criterionName}» se aprecia de forma parcial; hay base, pero falta desarrollo o precisión.`,
    Insuficiente: `El criterio «${criterionName}» solo se percibe de manera débil o incompleta en el trabajo analizado.`,
    'Muy deficiente': `No se localiza evidencia fiable bastante para sostener el criterio «${criterionName}» en la extracción disponible.`,
  }[level];

  return hasEvidence ? base : `${base} Además, la evidencia localizada es escasa.`;
}
