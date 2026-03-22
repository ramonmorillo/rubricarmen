export function reportGenerator({ student, extraction, criteria, originality }) {
  return {
    header: {
      studentName: student.name,
      group: student.group,
      poemTitle: student.poemTitle || '',
      date: new Date().toISOString(),
      documentStatus: extraction.documentStatus,
      extractionMethod: extraction.usedOcr ? 'OCR' : 'Texto digital',
      extractionWarnings: extraction.warnings,
    },
    outputMode: 'marked-rubric',
    criteria: criteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      criterion: criterion.criterion,
      detectedLevel: criterion.detectedLevel,
      needsManualReview: Boolean(criterion.needsManualReview),
    })),
    originality: {
      category: originality.category,
      rationale: originality.rationale,
      findings: originality.findings,
    },
    observations: buildObservations({ extraction, criteria, originality }),
  };
}

function buildObservations({ extraction, criteria, originality }) {
  const observations = [];

  const originalityObservation = {
    'Sin indicios relevantes': 'Se aprecia elaboración propia suficiente.',
    'Sospecha moderada de dependencia de fuentes': 'Se observa posible dependencia de materiales de apoyo.',
    'Sospecha alta de copia o reproducción': 'Conviene revisión manual adicional.',
  }[originality.category];

  if (originalityObservation) observations.push(originalityObservation);
  if (extraction.warnings?.length) observations.push('Revisión manual necesaria.');
  if (criteria.some((criterion) => criterion.needsManualReview)) observations.push('Revisión manual necesaria.');

  return [...new Set(observations)];
}
