import { Download, RefreshCcw, Save } from 'lucide-react';
import rubric from '../../rubric/cernuda-2bach.json';
import { extractionStatusLabel, formatDate, ocrQualityLabel } from '../lib/formatters';
import { buildObservations, getMarkedRubricRows } from '../lib/rubricOutput';

export function ResultsPanel({ evaluation, onExportPdf, onExportJson, onReset }) {
  const safeEvaluation = {
    ...evaluation,
    student: evaluation?.student || {},
    extraction: {
      warnings: [],
      ...(evaluation?.extraction || {}),
    },
    criteria: Array.isArray(evaluation?.criteria) ? evaluation.criteria : [],
    originality: {
      findings: [],
      ...(evaluation?.originality || {}),
    },
  };

  const rubricRows = getMarkedRubricRows(safeEvaluation.criteria);
  const observations = buildObservations(safeEvaluation);

  return (
    <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-panel backdrop-blur">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Rúbrica marcada generada</h2>
          <p className="mt-1 text-sm text-slate-500">
            Salida principal en formato de rúbrica imprimible generada el {formatDate(safeEvaluation.generatedAt)}. No calcula la nota final.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ActionButton onClick={onExportPdf} icon={<Download className="h-4 w-4" />}>
            Descargar rúbrica PDF
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
        <InfoCard label="Alumno/a" value={safeEvaluation.student.name || 'No indicado'} />
        <InfoCard label="Grupo" value={safeEvaluation.student.group || 'No indicado'} />
        <InfoCard label="Poema" value={safeEvaluation.student.poemTitle || 'No indicado'} />
        <InfoCard label="Estado del documento" value={extractionStatusLabel(safeEvaluation.extraction)} emphasis />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <InfoCard label="Texto embebido" value={safeEvaluation.extraction.hasEmbeddedText ? 'Sí' : 'No'} />
        <InfoCard label="OCR" value={safeEvaluation.extraction.usedOcr ? 'Aplicado' : 'No necesario'} />
        <InfoCard label="Calidad OCR" value={ocrQualityLabel(safeEvaluation.extraction.ocrQuality)} />
      </div>

      {safeEvaluation.extraction.warnings.length ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Avisos de extracción</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {safeEvaluation.extraction.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <article className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{rubric.name}</h3>
          <p className="mt-1 text-sm text-slate-600">Cada criterio marca un único nivel. El resto de opciones queda vacío.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-200 px-4 py-3 text-left font-semibold">Criterios</th>
                {rubric.levels.map((level) => (
                  <th key={level} className="border border-slate-200 px-3 py-3 text-center font-semibold">
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rubricRows.map((row) => (
                <tr key={row.id} className="align-middle even:bg-slate-50/70">
                  <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900">{row.criterion}</th>
                  {row.cells.map((cell) => (
                    <td key={`${row.id}-${cell.level}`} className="border border-slate-200 px-3 py-3 text-center text-lg font-semibold text-slate-900">
                      {cell.checked ? '✓' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Observaciones</h3>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
            {(observations.length ? observations : ['Se aprecia elaboración propia suficiente.']).map((observation) => (
              <li key={observation} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">• {observation}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Originalidad y apoyo</h3>
          <p className="mt-3 text-lg font-semibold text-slate-900">{safeEvaluation.originality.category || 'Sin dato'}</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{safeEvaluation.originality.rationale || 'Sin observaciones.'}</p>
        </article>
      </div>
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
    <button type="button" onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${styles[variant]}`}>
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
