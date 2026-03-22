import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatScore } from './formatters';

export function generateEvaluationPdf(evaluation) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 42;
  let cursorY = 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Informe de evaluación asistida · Luis Cernuda', marginX, cursorY);

  cursorY += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'La calificación propuesta debe contrastarse con el juicio profesional de la docente.',
    marginX,
    cursorY,
  );

  cursorY += 24;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  const metadataLines = [
    `Alumno/a: ${evaluation.student.name}`,
    `Grupo/curso: ${evaluation.student.group}`,
    `Título del trabajo: ${evaluation.student.assignmentTitle}`,
    `Fecha de evaluación: ${formatDate(evaluation.generatedAt)}`,
  ];

  metadataLines.forEach((line) => {
    doc.text(line, marginX, cursorY);
    cursorY += 16;
  });

  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [['Criterio', 'Nivel', 'Puntuación', 'Justificación breve']],
    body: evaluation.criteria.map((criterion) => [
      criterion.name,
      `${criterion.level}/4`,
      formatScore(criterion.score),
      criterion.justification,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 6,
      valign: 'top',
    },
    headStyles: {
      fillColor: [30, 64, 175],
    },
  });

  cursorY = doc.lastAutoTable.finalY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Fortalezas detectadas', marginX, cursorY);

  cursorY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const strengthsText = doc.splitTextToSize(`• ${evaluation.summary.strengths.join('\n• ')}`, 510);
  doc.text(strengthsText, marginX, cursorY);

  cursorY += strengthsText.length * 12 + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Aspectos de mejora y recomendaciones', marginX, cursorY);

  cursorY += 14;
  doc.setFont('helvetica', 'normal');
  const improvements = [
    ...evaluation.summary.weaknesses.map((item) => `Debilidad: ${item}`),
    ...evaluation.summary.recommendations.map((item) => `Sugerencia: ${item}`),
  ];
  const improvementsText = doc.splitTextToSize(`• ${improvements.join('\n• ')}`, 510);
  doc.text(improvementsText, marginX, cursorY);

  cursorY += improvementsText.length * 12 + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Nota global propuesta: ${formatScore(evaluation.finalScore)} / 10`, marginX, cursorY);

  cursorY += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const finalComments = doc.splitTextToSize(evaluation.summary.finalObservation, 510);
  doc.text(finalComments, marginX, cursorY);

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
