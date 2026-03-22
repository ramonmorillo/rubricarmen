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
    criteria,
    originality: {
      category: originality.category,
      rationale: originality.rationale,
      findings: originality.findings,
    },
    finalNote: 'Informe orientativo para revisión docente',
  };
}
