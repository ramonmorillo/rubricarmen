import rubric from '../../rubric/cernuda-2bach.json';
const LEVELS = rubric.levels;

export async function evaluateEssayMock({ student = {}, rubricId = rubric.id, pdfFile = null, pdfFileName = '' } = {}) {
  const normalizedStudent = {
    name: student.name?.trim() || 'Alumno sin identificar',
    group: student.group?.trim() || 'Grupo no indicado',
    poemTitle: student.poemTitle?.trim() || 'Poema no indicado',
    assignmentTitle: pdfFileName || student.assignmentTitle?.trim() || 'trabajo-sin-pdf.pdf',
  };

  const estimatedPages = estimatePdfLength(pdfFile);
  const extractedFromScan = shouldSimulateScan(pdfFileName);
  const generatedAt = new Date().toISOString();
  const extraction = buildExtraction({ normalizedStudent, pdfFile, pdfFileName, estimatedPages, extractedFromScan });
  const originality = buildOriginality({ normalizedStudent, pdfFileName, estimatedPages, extractedFromScan });
  const criteria = buildCriteria({ normalizedStudent, estimatedPages, pdfFileName, originality, extraction });

  return {
    rubricId,
    rubricName: rubric.name,
    generatedAt,
    student: normalizedStudent,
    extraction,
    originality,
    criteria,
    report: {
      header: {
        studentName: normalizedStudent.name,
        group: normalizedStudent.group,
        poemTitle: normalizedStudent.poemTitle,
        date: generatedAt,
        documentStatus: extraction.documentStatus,
        extractionMethod: extraction.usedOcr ? 'OCR simulado' : 'Texto digital simulado',
        extractionWarnings: extraction.warnings,
      },
      criteria: criteria.map((criterion) => ({
        criterionId: criterion.criterionId,
        criterion: criterion.criterion,
        detectedLevel: criterion.detectedLevel,
        justification: criterion.justification,
        recommendation: criterion.recommendation,
        needsManualReview: Boolean(criterion.needsManualReview),
      })),
      originality: {
        category: originality.category,
        rationale: originality.rationale,
        findings: originality.findings,
      },
      outputMode: 'marked-rubric',
      observations: buildObservations({ extraction, originality, criteria }),
    },
  };
}

function estimatePdfLength(pdfFile) {
  if (!pdfFile) return 0;
  if (typeof pdfFile.size !== 'number' || Number.isNaN(pdfFile.size)) return 1;
  return Math.max(1, Math.min(12, Math.round(pdfFile.size / 18000)));
}

function shouldSimulateScan(pdfFileName) {
  return /scan|escaneado|foto|ocr/i.test(pdfFileName || '');
}

function buildExtraction({ normalizedStudent, pdfFile, pdfFileName, estimatedPages, extractedFromScan }) {
  const hasPdf = Boolean(pdfFile);
  const hasEmbeddedText = hasPdf ? !extractedFromScan : true;
  const usedOcr = hasPdf ? extractedFromScan : false;
  const ocrQuality = usedOcr ? (estimatedPages > 4 ? 'medium' : 'high') : 'not-needed';
  const warnings = [];

  if (!hasPdf) {
    warnings.push('No se ha subido ningún PDF: se genera una simulación orientativa a partir de los datos del formulario.');
  }

  if (usedOcr) {
    warnings.push('El nombre del archivo sugiere un documento escaneado; se simula extracción OCR en el navegador.');
  }

  if (hasPdf && estimatedPages >= 8) {
    warnings.push('El PDF es relativamente extenso; la vista previa resume solo los apartados más representativos.');
  }

  const documentStatus = !hasPdf
    ? 'Simulación sin PDF'
    : hasEmbeddedText
      ? 'Texto digital embebido'
      : 'Documento escaneado con OCR simulado';

  const previewTopic = normalizedStudent.poemTitle === 'Poema no indicado'
    ? 'el comentario literario'
    : `el poema «${normalizedStudent.poemTitle}»`;

  return {
    hasEmbeddedText,
    usedOcr,
    documentStatus,
    ocrQuality,
    warnings,
    extractedTextPreview: `${normalizedStudent.name} presenta un análisis sobre ${previewTopic}. Archivo de referencia: ${pdfFileName || 'sin PDF adjunto'}. Extensión estimada: ${estimatedPages || 1} ${estimatedPages === 1 ? 'página' : 'páginas'}.`,
  };
}

function buildOriginality({ normalizedStudent, pdfFileName, estimatedPages, extractedFromScan }) {
  const lowerName = normalizedStudent.name.toLowerCase();
  const lowerFile = (pdfFileName || '').toLowerCase();

  if (lowerFile.includes('wiki') || lowerFile.includes('copia')) {
    return {
      category: 'Sospecha alta de copia o reproducción',
      rationale: 'El nombre del archivo contiene pistas que podrían sugerir una fuerte dependencia de fuentes externas; conviene contrastar el trabajo completo en revisión manual.',
      findings: [
        {
          type: 'Nombre de archivo',
          evidence: `El archivo «${pdfFileName}» contiene términos asociados a material copiado o compilado.`,
        },
      ],
    };
  }

  if (extractedFromScan || estimatedPages >= 7 || lowerName.includes('vega')) {
    return {
      category: 'Sin indicios relevantes',
      rationale: 'La simulación no detecta señales preocupantes más allá de coincidencias conceptuales previsibles en un trabajo académico sobre Luis Cernuda.',
      findings: [],
    };
  }

  return {
    category: 'Sospecha moderada de dependencia de fuentes',
    rationale: 'La simulación aprecia algunos patrones demasiado formularios para un comentario breve; no implican copia, pero aconsejan una comprobación docente rápida.',
    findings: [
      {
        type: 'Patrón discursivo',
        evidence: 'La extensión estimada es breve y podría apoyarse demasiado en esquemas de aula o resúmenes previos.',
      },
    ],
  };
}

function buildCriteria({ normalizedStudent, estimatedPages, pdfFileName, originality, extraction }) {
  return rubric.criteria.map((criterion, index) => {
    if (criterion.id === 'originalidad') {
      return {
        criterion: criterion.name,
        criterionId: criterion.id,
        detectedLevel: originality.category === 'Sin indicios relevantes' ? 'Notable' : 'Adecuado',
        justification: originality.rationale,
        textualEvidence: originality.findings.length
          ? originality.findings.map((finding) => `${finding.type}: ${finding.evidence}`)
          : ['No se aprecian coincidencias textuales problemáticas en la simulación local.'],
        recommendation: 'Interpretar este bloque con prudencia y contrastarlo con la lectura docente del trabajo completo.',
        needsManualReview: originality.category !== 'Sin indicios relevantes' && originality.findings.length > 0,
      };
    }

    const seed = normalizedStudent.name.length + (pdfFileName || '').length + estimatedPages + index;
    const detectedLevel = LEVELS[seed % LEVELS.length];

    return {
      criterion: criterion.name,
      criterionId: criterion.id,
      detectedLevel,
      justification: createJustification(criterion.name, detectedLevel, estimatedPages, extraction.documentStatus),
      textualEvidence: createEvidence(criterion.name, normalizedStudent, pdfFileName, estimatedPages),
      recommendation: createRecommendation(criterion.name, detectedLevel),
      needsManualReview: detectedLevel === 'Muy deficiente',
    };
  });
}

function createJustification(criterionName, detectedLevel, estimatedPages, documentStatus) {
  const pageReference = estimatedPages > 0 ? `La extensión estimada del PDF es de ${estimatedPages} ${estimatedPages === 1 ? 'página' : 'páginas'}.` : 'No se ha subido PDF y la valoración se apoya en los datos básicos del formulario.';

  const levelFragments = {
    Excelente: `El criterio «${criterionName}» aparece muy consolidado en la simulación y sugiere un desempeño completo y bien sostenido.`,
    Notable: `El criterio «${criterionName}» está bien resuelto en términos generales, aunque aún admite algún ajuste de precisión.`,
    Adecuado: `El criterio «${criterionName}» se aprecia de forma suficiente, con margen razonable de mejora.`,
    Insuficiente: `El criterio «${criterionName}» solo se detecta de manera parcial y necesita refuerzo específico.`,
    'Muy deficiente': `El criterio «${criterionName}» apenas cuenta con señales aprovechables en la simulación actual.`,
  };

  return `${levelFragments[detectedLevel]} ${pageReference} Estado del documento: ${documentStatus}.`;
}

function createEvidence(criterionName, normalizedStudent, pdfFileName, estimatedPages) {
  const commonEvidence = {
    Portada: [`${normalizedStudent.name} · ${normalizedStudent.group} · ${normalizedStudent.poemTitle}`],
    'Índice': ['Índice estimado: introducción, análisis, conclusión y bibliografía.'],
    Introducción: [`La simulación presupone una apertura contextual sobre Luis Cernuda y ${normalizedStudent.poemTitle}.`],
    'Biografía del autor': ['Se espera una referencia a la Generación del 27 y al exilio del autor.'],
    'Localización del poema': [`Se sitúa ${normalizedStudent.poemTitle} dentro de la trayectoria poética de Cernuda.`],
    Tema: ['Se detecta un enfoque sobre deseo, realidad, memoria o soledad, según el trabajo presentado.'],
    Estructura: [`La extensión estimada (${estimatedPages || 1} páginas) sugiere una organización en bloques temáticos.`],
    'Análisis métrico': ['Se prevé una mención al verso libre o a la organización rítmica del poema.'],
    'Análisis del estilo': ['La simulación espera referencias a imágenes, símbolos y tono elegíaco o reflexivo.'],
    'Comentario crítico': ['Se valora la presencia de una interpretación personal conectada con el texto.'],
    Conclusión: ['Se espera un cierre que sintetice la lectura del poema y su sentido global.'],
    Bibliografía: [`Archivo de referencia: ${pdfFileName || 'sin PDF adjunto'}.`],
    'Ortografía y redacción': ['No se observan errores reales: este criterio se estima de forma orientativa en modo local.'],
  };

  return commonEvidence[criterionName] || ['Evidencia simulada generada localmente para GitHub Pages.'];
}

function createRecommendation(criterionName, detectedLevel) {
  if (detectedLevel === 'Excelente' || detectedLevel === 'Notable') {
    return `Mantener el buen nivel del apartado «${criterionName}» y reforzar la precisión terminológica en la revisión final.`;
  }

  if (detectedLevel === 'Adecuado') {
    return `Ampliar el apartado «${criterionName}» con más desarrollo y ejemplos concretos del poema.`;
  }

  return `Revisar de forma prioritaria el apartado «${criterionName}» con apoyo de la rúbrica y del texto poético.`;
}

function buildObservations({ extraction, originality, criteria }) {
  const observations = [];

  const originalityObservation = {
    'Sin indicios relevantes': 'Se aprecia elaboración propia suficiente.',
    'Sospecha moderada de dependencia de fuentes': 'Se observa posible dependencia de materiales de apoyo.',
    'Sospecha alta de copia o reproducción': 'Conviene revisión manual adicional.',
  }[originality.category];

  if (originalityObservation) observations.push(originalityObservation);
  if (extraction.warnings.length) observations.push('Revisión manual necesaria.');
  if (criteria.some((criterion) => criterion.needsManualReview)) observations.push('Revisión manual necesaria.');

  return [...new Set(observations)];
}
