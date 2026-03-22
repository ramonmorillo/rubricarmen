import fs from 'node:fs/promises';
import { cleanupTempDir, commandExists, compactWhitespace, createTempDir, runCommand, writeTempFile } from './utils.js';

function naivePdfText(buffer) {
  const binary = buffer.toString('latin1');
  const literalText = [...binary.matchAll(/\(([^()]*)\)\s*Tj/g)].map((match) => match[1]);
  if (literalText.length) {
    return compactWhitespace(literalText.join(' '));
  }

  const matches = [...binary.matchAll(/[\x20-\x7EÀ-ÿ]{5,}/g)].map((match) => match[0]);
  return compactWhitespace(matches.join(' '));
}

export async function pdfExtractor(pdfBuffer) {
  const tempDir = await createTempDir();
  try {
    const pdfPath = await writeTempFile(tempDir, 'pdf', pdfBuffer);
    let text = '';
    let method = 'embedded-text';

    if (await commandExists('pdftotext')) {
      try {
        const { stdout } = await runCommand('pdftotext', ['-layout', pdfPath, '-']);
        text = compactWhitespace(stdout);
      } catch {
        text = '';
      }
    }

    if (!text) {
      text = naivePdfText(pdfBuffer);
      method = 'naive-fallback';
    }

    const hasEmbeddedText = text.replace(/\s+/g, '').length >= 180;
    return {
      text,
      hasEmbeddedText,
      extractionMethod: hasEmbeddedText ? method : 'none-detected',
      warnings: hasEmbeddedText ? [] : ['No se ha detectado texto digital suficiente en el PDF.'],
      pdfPath,
      tempDir,
    };
  } catch (error) {
    await cleanupTempDir(tempDir);
    throw error;
  }
}

export async function releasePdfExtraction(result) {
  await cleanupTempDir(result?.tempDir);
}
