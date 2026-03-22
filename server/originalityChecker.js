import { splitParagraphs, splitSentences, trimExcerpt } from './utils.js';

export function originalityChecker(essayText, comparison) {
  const paragraphs = splitParagraphs(essayText);
  const sentences = splitSentences(essayText);
  const firstPersonCount = (essayText.match(/\b(a mi juicio|considero|pienso|me parece|entiendo|creo)\b/gi) || []).length;
  const styleShift = detectStyleShift(sentences);
  const genericBlocks = paragraphs.filter((paragraph) => /luis cernuda (fue|nacio|nació)|generacion del 27|poeta sevillano|realidad y deseo/gi.test(paragraph) && paragraph.length > 280);
  const extensiveMatches = comparison.sourceMatches.filter((match) => match.longestSpan >= 14 || match.overlap >= 0.55);
  const moderateMatches = comparison.sourceMatches.filter((match) => match.longestSpan >= 10 || match.overlap >= 0.42);

  const findings = [];

  if (extensiveMatches.length) {
    findings.push({
      type: 'coincidencias textuales extensas',
      evidence: extensiveMatches.map((match) => `Coincidencia con ${match.sourceTitle} (${match.section}) [tramo compartido: ${match.longestSpan} palabras].`).join(' '),
    });
  }

  if (moderateMatches.length >= 2) {
    findings.push({
      type: 'dependencia estructural de materiales de apoyo',
      evidence: moderateMatches.map((match) => `Similitud relevante con ${match.sourceTitle} (${match.section}).`).join(' '),
    });
  }

  if (genericBlocks.length) {
    findings.push({
      type: 'bloques demasiado genéricos o impropios del nivel',
      evidence: trimExcerpt(genericBlocks[0], 190),
    });
  }

  if (firstPersonCount === 0) {
    findings.push({
      type: 'ausencia de interpretación personal',
      evidence: 'No se detectan marcadores claros de posicionamiento interpretativo propio en la muestra analizada.',
    });
  }

  if (styleShift) {
    findings.push({
      type: 'saltos de estilo',
      evidence: styleShift,
    });
  }

  const category = extensiveMatches.length >= 2 || (extensiveMatches.length && findings.length >= 3)
    ? 'Sospecha alta de copia o reproducción'
    : findings.length >= 2 || moderateMatches.length >= 2
      ? 'Sospecha moderada de dependencia de fuentes'
      : 'Sin indicios relevantes';

  return {
    category,
    findings,
    rationale: findings.length
      ? findings.map((item) => `${item.type}: ${item.evidence}`).join(' ')
      : 'No se observan coincidencias textuales o estructurales excesivas más allá de la coincidencia conceptual esperable en un trabajo sobre Luis Cernuda.',
  };
}

function detectStyleShift(sentences) {
  if (sentences.length < 4) return '';
  const lengths = sentences.map((sentence) => sentence.split(/\s+/).filter(Boolean).length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  if (max - min < 24) return '';

  const longSentence = sentences[lengths.indexOf(max)];
  const shortSentence = sentences[lengths.indexOf(min)];
  return `Se aprecia contraste fuerte entre tramos muy densos y otros muy breves: «${trimExcerpt(longSentence, 120)}» frente a «${trimExcerpt(shortSentence, 80)}».`;
}
