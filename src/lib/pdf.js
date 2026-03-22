import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './formatters';

export function generateEvaluationPdf(evaluation) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 42;
  let cursorY = 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Informe individualizado · Luis Cernuda · 2º Bachillerato', marginX, cursorY);

  cursorY += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Informe cualitativo orientativo para revisión docente.', marginX, cursorY);

  cursorY += 24;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  const metadataLines = [
    `Alumno/a: ${evaluation.student.name}`,
    `Grupo/curso: ${evaluation.student.group}`,
    `Poema: ${evaluation.student.poemTitle || 'No indicado'}`,
    `Fecha: ${formatDate(evaluation.generatedAt)}`,
    `Estado del documento: ${evaluation.extraction.documentStatus}`,
    `Modo de extracción: ${evaluation.extraction.usedOcr ? 'OCR' : 'Texto digital'}`,
  ];

  metadataLines.forEach((line) => {
    doc.text(line, marginX, cursorY);
    cursorY += 15;
  });

  if (evaluation.extraction.warnings.length) {
    cursorY += 4;
    doc.setTextColor(180, 83, 9);
    doc.text(`Avisos: ${evaluation.extraction.warnings.join(' | ')}`, marginX, cursorY, { maxWidth: 510 });
    cursorY += 20;
    doc.setTextColor(15, 23, 42);
  }

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [['Criterio', 'Nivel detectado', 'Justificación breve', 'Evidencia textual']],
    body: evaluation.criteria.map((criterion) => [
      criterion.criterion,
      criterion.detectedLevel,
      criterion.justification,
      criterion.textualEvidence.join(' · '),
    ]),
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 64, 175],
    },
  });

  cursorY = doc.lastAutoTable.finalY + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bloque de originalidad y dependencia de fuentes', marginX, cursorY);

  cursorY += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const originalityText = doc.splitTextToSize(
    `Categoría: ${evaluation.originality.category}. ${evaluation.originality.rationale}`,
    510,
  );
  doc.text(originalityText, marginX, cursorY);

  cursorY += originalityText.length * 12 + 10;
  const noteText = doc.splitTextToSize('Observación final: Informe orientativo para revisión docente.', 510);
  doc.text(noteText, marginX, cursorY);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Documento generado el ${formatDate(evaluation.generatedAt)}`, marginX, 800);

  doc.save(`informe-${slugify(evaluation.student.name)}.pdf`);
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
