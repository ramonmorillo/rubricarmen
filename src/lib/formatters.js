export function formatScore(score) {
  return Number(score).toFixed(2);
}

export function formatDate(dateString) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function criterionWeightLabel(weight) {
  return `${Math.round(weight * 100)}%`;
}
