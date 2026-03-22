import fs from 'node:fs/promises';
import path from 'node:path';
import { average, commandExists, compactWhitespace, runCommand } from './utils.js';

function estimateOcrQuality(text) {
  const cleaned = compactWhitespace(text);
  const words = cleaned.split(' ').filter(Boolean);
  const weirdChars = (cleaned.match(/[^\w\sáéíóúñü.,;:()"'¿?¡!-]/gi) || []).length;
  const avgWordLength = average(words.map((word) => word.length));
  const density = cleaned.length ? weirdChars / cleaned.length : 1;

  if (words.length < 60 || density > 0.08 || avgWordLength < 3.4) {
    return { label: 'low', warning: 'OCR de baja calidad: se recomienda revisión manual del texto extraído.' };
  }
  if (words.length < 140 || density > 0.04 || avgWordLength < 4.1) {
    return { label: 'medium', warning: 'OCR aceptable pero revisable: conviene comprobar fragmentos dudosos.' };
  }
  return { label: 'high', warning: '' };
}

export async function ocrFallback({ pdfPath, tempDir }) {
  const hasPpm = await commandExists('pdftoppm');
  const hasTesseract = await commandExists('tesseract');

  if (!hasPpm || !hasTesseract) {
    return {
      available: false,
      used: false,
      text: '',
      quality: 'unavailable',
      warnings: ['OCR no disponible en este entorno: instala poppler-utils y tesseract para habilitar el respaldo sobre PDFs escaneados.'],
    };
  }

  const outputBase = path.join(tempDir, 'ocr-page');
  await runCommand('pdftoppm', ['-png', '-f', '1', '-l', '6', pdfPath, outputBase]);
  const imageFiles = (await fs.readdir(tempDir))
    .filter((file) => file.startsWith('ocr-page') && file.endsWith('.png'))
    .sort();

  const pageTexts = [];
  for (const imageFile of imageFiles) {
    const imagePath = path.join(tempDir, imageFile);
    const outBase = imagePath.replace(/\.png$/, '');
    const { stdout } = await runCommand('tesseract', [imagePath, outBase, '-l', 'spa'], { cwd: tempDir });
    void stdout;
    const txtPath = `${outBase}.txt`;
    const pageText = await fs.readFile(txtPath, 'utf8').catch(() => '');
    pageTexts.push(pageText);
  }

  const text = compactWhitespace(pageTexts.join('\n'));
  const quality = estimateOcrQuality(text);

  return {
    available: true,
    used: true,
    text,
    quality: quality.label,
    warnings: quality.warning ? [quality.warning] : [],
  };
}
