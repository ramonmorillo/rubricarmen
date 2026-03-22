import { useMemo, useState } from 'react';
import rubric from '../rubric/cernuda-2bach.json';
import sampleOutput from '../examples/sample-output.json';
import { AppShell } from './components/AppShell';
import { EvaluationForm } from './components/EvaluationForm';
import { ResultsPanel } from './components/ResultsPanel';
import { messages } from './lib/i18n';
import { evaluateEssay, fileToBase64 } from './lib/api';
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
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!formData.pdfFile) {
      setError('Debes seleccionar un PDF antes de iniciar el análisis.');
      return;
    }

    try {
      setLoading(true);
      const pdfBase64 = await fileToBase64(formData.pdfFile);
      const result = await evaluateEssay({
        student: {
          name: formData.studentName.trim(),
          group: formData.studentGroup.trim(),
          poemTitle: formData.poemTitle.trim(),
          assignmentTitle: formData.pdfFileName || 'Trabajo del alumno',
        },
        rubricId: formData.rubricId,
        pdfBase64,
        pdfFileName: formData.pdfFileName,
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
      poemTitle: 'Donde habite el olvido',
      rubricId: rubric.id,
      pdfFile: null,
      pdfFileName: 'lucia-hernandez-cernuda.pdf',
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
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          onLoadExample={handleLoadExample}
        />
        {evaluation ? (
          <ResultsPanel evaluation={evaluation} onExportPdf={() => generateEvaluationPdf(evaluation)} onExportJson={handleExportJson} onReset={handleReset} />
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
          Cuando analices un PDF aparecerán aquí el estado de extracción, los criterios cualitativos, la señalización prudente de originalidad y los botones para exportar el informe en PDF o JSON.
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
