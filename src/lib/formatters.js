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

export function extractionStatusLabel(extraction) {
  if (!extraction) return 'Sin analizar';
  return extraction.documentStatus;
}

export function ocrQualityLabel(quality) {
  const labels = {
    high: 'OCR alto',
    medium: 'OCR medio',
    low: 'OCR bajo',
    'not-needed': 'No necesario',
    unavailable: 'No disponible',
  };
  return labels[quality] || quality || 'Sin dato';
}
