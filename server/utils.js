import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñüáéíóú\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitParagraphs(text = '') {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function splitSentences(text = '') {
  return text
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function compactWhitespace(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

export function findKeywordHits(text, keywords = []) {
  const normalized = normalizeText(text);
  return keywords.reduce((count, keyword) => count + (normalized.includes(normalizeText(keyword)) ? 1 : 0), 0);
}

export function extractEvidence(sentences, keywords = [], maxItems = 2) {
  if (!keywords.length) return [];
  const normalizedKeywords = keywords.map((keyword) => normalizeText(keyword));
  return sentences
    .filter((sentence) => normalizedKeywords.some((keyword) => normalizeText(sentence).includes(keyword)))
    .slice(0, maxItems)
    .map((sentence) => trimExcerpt(sentence, 220));
}

export function trimExcerpt(text, maxLength = 220) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function levelFromScore(score) {
  if (score >= 0.88) return 'Excelente';
  if (score >= 0.7) return 'Notable';
  if (score >= 0.5) return 'Adecuado';
  if (score >= 0.28) return 'Insuficiente';
  return 'Muy deficiente';
}

export function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function commandExists(command) {
  try {
    await execFileAsync('bash', ['-lc', `command -v ${command}`]);
    return true;
  } catch {
    return false;
  }
}

export async function runCommand(command, args, options = {}) {
  return execFileAsync(command, args, { maxBuffer: 32 * 1024 * 1024, ...options });
}

export async function createTempDir(prefix = 'rubricarmen-') {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function writeTempFile(dir, extension, buffer) {
  const filePath = path.join(dir, `${randomUUID()}.${extension}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function cleanupTempDir(dir) {
  if (!dir) return;
  await fs.rm(dir, { recursive: true, force: true });
}

export function tokenise(text = '') {
  return normalizeText(text)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

export function similarityByOverlap(textA = '', textB = '') {
  const tokensA = new Set(tokenise(textA));
  const tokensB = new Set(tokenise(textB));
  if (!tokensA.size || !tokensB.size) return 0;

  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared += 1;
  }

  return shared / Math.min(tokensA.size, tokensB.size);
}

export function longestCommonSpan(textA = '', textB = '') {
  const a = normalizeText(textA).split(' ');
  const b = normalizeText(textB).split(' ');
  const index = new Map();
  b.forEach((token, position) => {
    const items = index.get(token) || [];
    items.push(position);
    index.set(token, items);
  });

  let best = 0;
  for (let i = 0; i < a.length; i += 1) {
    const positions = index.get(a[i]) || [];
    positions.forEach((j) => {
      let span = 0;
      while (a[i + span] && b[j + span] && a[i + span] === b[j + span]) {
        span += 1;
      }
      if (span > best) best = span;
    });
  }

  return best;
}
