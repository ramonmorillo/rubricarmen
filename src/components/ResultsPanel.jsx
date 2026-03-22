import { Download, RefreshCcw, Save } from 'lucide-react';
import { criterionWeightLabel, formatDate, formatScore } from '../lib/formatters';

export function ResultsPanel({ evaluation, onExportPdf, onExportJson, onReset }) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-panel backdrop-blur">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Resultado de la evaluación</h2>
          <p className="mt-1 text-sm text-slate-500">
            Informe orientativo generado el {formatDate(evaluation.generatedAt)}. Revísese antes de consolidar la nota.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ActionButton onClick={onExportPdf} icon={<Download className="h-4 w-4" />}>
            Generar PDF
          </ActionButton>
          <ActionButton onClick={onExportJson} icon={<Save className="h-4 w-4" />} variant="secondary">
            Exportar JSON
          </ActionButton>
          <ActionButton onClick={onReset} icon={<RefreshCcw className="h-4 w-4" />} variant="ghost">
            Reiniciar evaluación
          </ActionButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <InfoCard label="Alumno/a" value={evaluation.student.name} />
        <InfoCard label="Grupo" value={evaluation.student.group} />
        <InfoCard label="Trabajo" value={evaluation.student.assignmentTitle} />
        <InfoCard label="Nota global" value={`${formatScore(evaluation.finalScore)} / 10`} emphasis />
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              {['Criterio', 'Peso', 'Nivel', 'Puntuación', 'Descriptor', 'Justificación'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {evaluation.criteria.map((criterion) => (
              <tr key={criterion.id} className="align-top">
                <td className="px-4 py-4 text-sm font-medium text-slate-900">{criterion.name}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{criterionWeightLabel(criterion.weight)}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{criterion.level}/4</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatScore(criterion.score)}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{criterion.descriptorApplied}</td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  <p>{criterion.justification}</p>
                  <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Evidencia: {criterion.evidenceSummary}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Fortalezas" items={evaluation.summary.strengths} tone="emerald" />
        <SummaryCard title="Aspectos de mejora" items={evaluation.summary.weaknesses} tone="amber" />
        <SummaryCard title="Recomendaciones" items={evaluation.summary.recommendations} tone="brand" />
      </div>

      <article className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Observaciones finales</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">{evaluation.summary.finalObservation}</p>
      </article>
    </section>
  );
}

function ActionButton({ children, icon, onClick, variant = 'primary' }) {
  const styles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
    ghost: 'border border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${styles[variant]}`}
    >
      {icon}
      {children}
    </button>
  );
}

function InfoCard({ label, value, emphasis = false }) {
  return (
    <article className={`rounded-3xl border p-4 ${emphasis ? 'border-brand-100 bg-brand-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-sm ${emphasis ? 'font-bold text-brand-700' : 'font-medium text-slate-900'}`}>{value}</p>
    </article>
  );
}

function SummaryCard({ title, items, tone }) {
  const tones = {
    emerald: 'border-emerald-100 bg-emerald-50',
    amber: 'border-amber-100 bg-amber-50',
    brand: 'border-brand-100 bg-brand-50',
  };

  return (
    <article className={`rounded-3xl border p-5 ${tones[tone]}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
      <ul className="mt-3 space-y-3 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="rounded-2xl bg-white/70 px-3 py-2">• {item}</li>
        ))}
      </ul>
    </article>
  );
}
