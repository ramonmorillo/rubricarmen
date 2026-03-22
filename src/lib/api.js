const DEFAULT_ENDPOINT = 'http://127.0.0.1:8787/api/evaluate';

export async function evaluateEssay(payload) {
  const endpoint = import.meta.env.VITE_EVALUATION_API_URL || DEFAULT_ENDPOINT;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'No se ha podido completar el análisis.');
  }

  return response.json();
}
