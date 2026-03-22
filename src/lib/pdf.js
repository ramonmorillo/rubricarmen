import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './formatters';
import { buildObservations, getMarkedRubricRows, RUBRIC_LEVELS, RUBRIC_TITLE } from './rubricOutput';

export function generateEvaluationPdf(evaluation) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 34;
  const bottomMargin = 34;
  const rows = getMarkedRubricRows(evaluation.criteria);
  const observations = buildObservations(evaluation);

  let cursorY = 34;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.8);
  doc.rect(marginX, cursorY, pageWidth - marginX * 2, 68);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(RUBRIC_TITLE, marginX + 12, cursorY + 20);

  const metadata = [
    ['Alumno/a', evaluation.student.name],
    ['Grupo/curso', evaluation.student.group],
    ['Poema analizado', evaluation.student.poemTitle || 'No indicado'],
    ['Fecha', formatDate(evaluation.generatedAt)],
  ];

  const labelX = [marginX + 12, marginX + 250];
  let lineY = cursorY + 38;
  metadata.forEach(([label, value], index) => {
    const baseX = labelX[index % 2];
    if (index === 2) lineY += 17;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`${label}:`, baseX, lineY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || 'No indicado'), baseX + 74, lineY, { maxWidth: 155 });
  });

  cursorY += 82;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    tableWidth: pageWidth - marginX * 2,
    head: [[
      'Criterios',
      ...RUBRIC_LEVELS,
    ]],
    body: rows.map((row) => [
      row.criterion,
      ...row.cells.map((cell) => (cell.checked ? '✓' : '')),
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      lineColor: [148, 163, 184],
      lineWidth: 0.5,
      textColor: [15, 23, 42],
      valign: 'middle',
      halign: 'center',
      cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 180, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 66 },
      2: { cellWidth: 66 },
      3: { cellWidth: 66 },
      4: { cellWidth: 66 },
      5: { cellWidth: 66 },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index > 0 && data.cell.raw === '✓') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 12;
      }
    },
  });

  let currentY = doc.lastAutoTable.finalY + 10;
  const observationsHeight = Math.max(54, 22 + observations.length * 12);

  if (currentY + observationsHeight > pageHeight - bottomMargin) {
    doc.addPage();
    currentY = 34;
  }

  doc.setLineWidth(0.8);
  doc.setDrawColor(148, 163, 184);
  doc.rect(marginX, currentY, pageWidth - marginX * 2, observationsHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Observaciones', marginX + 10, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const observationLines = observations.length ? observations : ['Se aprecia elaboración propia suficiente.'];
  let observationY = currentY + 30;
  observationLines.forEach((observation) => {
    const wrapped = doc.splitTextToSize(`• ${observation}`, pageWidth - marginX * 2 - 20);
    doc.text(wrapped, marginX + 10, observationY);
    observationY += wrapped.length * 11;
  });

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Documento generado el ${formatDate(evaluation.generatedAt)}`, marginX, pageHeight - 16);

  doc.save(`rubrica-${slugify(evaluation.student.name)}.pdf`);
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
