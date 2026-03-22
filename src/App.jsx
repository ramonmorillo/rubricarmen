import { useMemo, useState } from 'react';
import rubric from '../rubric/cernuda-2bach.json';
import sampleOutput from '../examples/sample-output.json';
import { AppShell } from './components/AppShell';
import { EvaluationForm } from './components/EvaluationForm';
import { ResultsPanel } from './components/ResultsPanel';
import { messages } from './lib/i18n';
import { evaluateEssayMock } from './lib/mockApi';
import { generateEvaluationPdf } from './lib/pdf';

const initialFormData = {
  studentName: '',
  studentGroup: '',
  poemTitle: '',
  rubricId: rubric.id,
  pdfFile: null,
  pdfFileName: '',
};

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

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setFormData((current) => ({
      ...current,
      pdfFile: file,
      pdfFileName: file?.name || '',
    }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await evaluateEssayMock({
        student: {
          name: formData.studentName.trim(),
          group: formData.studentGroup.trim(),
          poemTitle: formData.poemTitle.trim(),
          assignmentTitle: formData.pdfFileName || 'Trabajo del alumno',
        },
        rubricId: formData.rubricId,
        pdfFile: formData.pdfFile,
        pdfFileName: formData.pdfFileName,
      });

      setEvaluation(result);
    } catch (submitError) {
      console.error('Error al generar la evaluación local:', submitError);
      setEvaluation(null);
      setError(submitError?.message || 'No se ha podido completar la simulación local. Puedes usar el modo demo para seguir navegando por la app.');
    } finally {
      setLoading(false);
    }
  }

  function handleExportJson() {
    if (!evaluation) return;
    try {
      const blob = new Blob([JSON.stringify(evaluation, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluacion-${slugify(evaluation.student.name)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error('Error al exportar JSON:', exportError);
      setError('No se ha podido exportar el JSON. La evaluación sigue visible en pantalla.');
    }
  }

  function handleLoadDemo() {
    try {
      setFormData({
        studentName: sampleOutput.student.name,
        studentGroup: sampleOutput.student.group,
        poemTitle: sampleOutput.student.poemTitle,
        rubricId: rubric.id,
        pdfFile: null,
        pdfFileName: sampleOutput.student.assignmentTitle,
      });
      setEvaluation(sampleOutput);
      setError('');
    } catch (demoError) {
      console.error('Error al activar el modo demo:', demoError);
      setEvaluation(null);
      setError('No se ha podido cargar el modo demo.');
    }
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
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          onLoadDemo={handleLoadDemo}
        />
        {evaluation ? (
          <ResultsPanel
            evaluation={evaluation}
            onExportPdf={() => generateEvaluationPdf(evaluation)}
            onExportJson={handleExportJson}
            onReset={handleReset}
          />
        ) : (
          <EmptyState onUseDemo={handleLoadDemo} />
        )}
      </main>
    </AppShell>
  );
}

function EmptyState({ onUseDemo }) {
  return (
    <section className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-panel backdrop-blur">
      <div className="max-w-md">
        <h2 className="text-xl font-semibold text-slate-900">Sin evaluación todavía</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Puedes analizar el formulario sin subir ningún PDF o abrir el modo demo para ver el resultado completo sin depender de ningún backend.
        </p>
        <button
          type="button"
          onClick={onUseDemo}
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          Modo demo
        </button>
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
