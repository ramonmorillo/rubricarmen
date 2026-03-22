import { useMemo, useState } from 'react';
import rubric from '../rubric/cernuda-2bach.json';
import sampleOutput from '../examples/sample-output.json';
import { AppShell } from './components/AppShell';
import { EvaluationForm } from './components/EvaluationForm';
import { ResultsPanel } from './components/ResultsPanel';
import { messages } from './lib/i18n';
import { evaluateEssay } from './lib/api';
import { generateEvaluationPdf } from './lib/pdf';

const initialFormData = {
  studentName: '',
  studentGroup: '',
  assignmentTitle: '',
  rubricId: rubric.id,
  essayText: '',
};

const sampleEssay = `Luis Cernuda pertenece a la Generación del 27, aunque su trayectoria poética tiene una voz muy personal. En su obra aparece una tensión constante entre deseo y realidad, que da título al conjunto de su poesía. La experiencia del exilio también marca sus poemas, porque transforma la nostalgia en una forma de conocimiento doloroso.

En poemas como "Donde habite el olvido" se percibe un tono íntimo, sobrio y reflexivo. No busca una ornamentación excesiva, sino una expresión depurada que comunica frustración, deseo y soledad. Además, la naturaleza y la memoria funcionan como símbolos que permiten comprender el conflicto interior del poeta.

A mi juicio, Cernuda no solo escribe desde la biografía, sino desde una reflexión más amplia sobre la libertad individual. Por eso su poesía sigue resultando actual: convierte una experiencia personal en una meditación universal sobre el amor, la identidad y la imposibilidad de reconciliarse con el mundo.`;

export default function App() {
  const [formData, setFormData] = useState(initialFormData);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const content = useMemo(() => messages.es, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (formData.essayText.trim().length < 220) {
      setError('El texto es demasiado breve para una evaluación razonada. Añade más contenido antes de analizarlo.');
      return;
    }

    try {
      setLoading(true);
      const result = await evaluateEssay({
        student: {
          name: formData.studentName.trim(),
          group: formData.studentGroup.trim(),
          assignmentTitle: formData.assignmentTitle.trim(),
        },
        rubricId: formData.rubricId,
        essayText: formData.essayText.trim(),
      });
      setEvaluation(result);
    } catch (submitError) {
      setError(submitError.message || 'Ha ocurrido un error inesperado durante el análisis.');
    } finally {
      setLoading(false);
    }
  }

  function handleExportJson() {
    if (!evaluation) return;
    const blob = new Blob([JSON.stringify(evaluation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluacion-${slugify(evaluation.student.name)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadExample() {
    setFormData({
      studentName: 'Lucía Hernández Vega',
      studentGroup: '2º Bach A',
      assignmentTitle: 'Realidad, deseo y exilio en Luis Cernuda',
      rubricId: rubric.id,
      essayText: sampleEssay,
    });
    setEvaluation(sampleOutput);
    setError('');
  }

  function handleReset() {
    setFormData(initialFormData);
    setEvaluation(null);
    setError('');
  }

  return (
    <AppShell title={content.appTitle} subtitle={content.appSubtitle} disclaimer={content.disclaimer}>
      <main className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <EvaluationForm
          rubric={rubric}
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          onLoadExample={handleLoadExample}
        />
        {evaluation ? (
          <ResultsPanel
            evaluation={evaluation}
            onExportPdf={() => generateEvaluationPdf(evaluation)}
            onExportJson={handleExportJson}
            onReset={handleReset}
          />
        ) : (
          <EmptyState />
        )}
      </main>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <section className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-panel backdrop-blur">
      <div className="max-w-md">
        <h2 className="text-xl font-semibold text-slate-900">Sin evaluación todavía</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Cuando analices un trabajo aparecerán aquí los criterios evaluados, la propuesta de nota global, las fortalezas, los aspectos de mejora y los botones para exportar el informe en PDF o JSON.
        </p>
      </div>
    </section>
  );
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
