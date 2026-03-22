import rubric from '../../rubric/cernuda-2bach.json';

const LOW_EVIDENCE_TEXT = 'No hay evidencia suficiente en el texto extraído para valorar este criterio con mayor seguridad.';

export const RUBRIC_LEVELS = rubric.levels;
export const RUBRIC_TITLE = rubric.name;

export function getMarkedRubricRows(criteria = []) {
  const byId = new Map(criteria.map((criterion) => [criterion.criterionId, criterion]));

  return rubric.criteria.map((rubricCriterion) => {
    const evaluationCriterion = byId.get(rubricCriterion.id) || null;
    const detectedLevel = RUBRIC_LEVELS.includes(evaluationCriterion?.detectedLevel)
      ? evaluationCriterion.detectedLevel
      : RUBRIC_LEVELS.at(-1);

    return {
      id: rubricCriterion.id,
      criterion: rubricCriterion.name,
      detectedLevel,
      cells: RUBRIC_LEVELS.map((level) => ({
        level,
        checked: level === detectedLevel,
      })),
      needsManualReview: Boolean(evaluationCriterion?.needsManualReview),
    };
  });
}

export function buildObservations(evaluation) {
  const observations = [];
  const originalityCategory = evaluation?.originality?.category || '';
  const extraction = evaluation?.extraction || {};
  const criteria = Array.isArray(evaluation?.criteria) ? evaluation.criteria : [];

  const originalityNote = {
    'Sin indicios relevantes': 'Se aprecia elaboración propia suficiente.',
    'Sospecha moderada de dependencia de fuentes': 'Se observa posible dependencia de materiales de apoyo.',
    'Sospecha alta de copia o reproducción': 'Conviene revisión manual adicional.',
    'Revisión ligera aconsejable': 'Se observa posible dependencia de materiales de apoyo.',
    'Revisión docente recomendada': 'Conviene revisión manual adicional.',
  }[originalityCategory];

  if (originalityNote) {
    observations.push(originalityNote);
  }

  if (Array.isArray(extraction.warnings) && extraction.warnings.length) {
    observations.push('Revisión manual necesaria.');
  }

  if (extraction.usedOcr && extraction.ocrQuality === 'low') {
    observations.push('Conviene revisión manual adicional.');
  }

  const limitedEvidence = criteria.some((criterion) => criterion.needsManualReview || hasLowEvidence(criterion));
  if (limitedEvidence) {
    observations.push('Revisión manual necesaria.');
  }

  return dedupeObservations(observations).slice(0, 3);
}

function hasLowEvidence(criterion) {
  const textualEvidence = Array.isArray(criterion?.textualEvidence) ? criterion.textualEvidence : [];
  return textualEvidence.some((evidence) => evidence === LOW_EVIDENCE_TEXT);
}

function dedupeObservations(observations) {
  return observations.filter((item, index) => observations.indexOf(item) === index);
}
