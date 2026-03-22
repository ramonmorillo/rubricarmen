import knowledgeBase from '../knowledge-base/cernuda-knowledge.json' with { type: 'json' };
import { longestCommonSpan, similarityByOverlap, splitSentences, trimExcerpt } from './utils.js';

export function knowledgeComparator(essayText) {
  const sentences = splitSentences(essayText);
  const sourceMatches = [];

  knowledgeBase.supportMaterials.forEach((source) => {
    source.passages.forEach((passage) => {
      const overlap = similarityByOverlap(essayText, passage.text);
      const longestSpan = longestCommonSpan(essayText, passage.text);
      if (overlap >= 0.42 || longestSpan >= 10) {
        sourceMatches.push({
          sourceTitle: source.title,
          section: passage.section,
          overlap: Number(overlap.toFixed(2)),
          longestSpan,
          excerpt: trimExcerpt(passage.text, 180),
        });
      }
    });
  });

  const factualChecks = knowledgeBase.factualCheckpoints.map((checkpoint) => {
    const evidence = sentences.find((sentence) => checkpoint.expectedTerms.every((term) => sentence.toLowerCase().includes(term.toLowerCase())));
    return {
      id: checkpoint.id,
      label: checkpoint.label,
      matched: Boolean(evidence),
      evidence: evidence ? trimExcerpt(evidence, 180) : '',
    };
  });

  return {
    sourceMatches: sourceMatches.sort((a, b) => (b.longestSpan - a.longestSpan) || (b.overlap - a.overlap)).slice(0, 8),
    factualChecks,
  };
}
