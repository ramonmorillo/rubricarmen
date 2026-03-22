import { Download, RefreshCcw, Save } from 'lucide-react';
import { extractionStatusLabel, formatDate, ocrQualityLabel } from '../lib/formatters';

export function ResultsPanel({ evaluation, onExportPdf, onExportJson, onReset }) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-panel backdrop-blur">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Resultado de la evaluación</h2>
          <p className="mt-1 text-sm text-slate-500">
            Informe orientativo generado el {formatDate(evaluation.generatedAt)}. No calcula la nota final; deja esa decisión para iDoceo y la revisión docente.
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
        <InfoCard label="Poema" value={evaluation.student.poemTitle || 'No indicado'} />
        <InfoCard label="Estado del documento" value={extractionStatusLabel(evaluation.extraction)} emphasis />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <InfoCard label="Texto embebido" value={evaluation.extraction.hasEmbeddedText ? 'Sí' : 'No'} />
        <InfoCard label="OCR" value={evaluation.extraction.usedOcr ? 'Aplicado' : 'No necesario'} />
        <InfoCard label="Calidad OCR" value={ocrQualityLabel(evaluation.extraction.ocrQuality)} />
      </div>

      {evaluation.extraction.warnings.length ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Avisos de extracción</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {evaluation.extraction.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {evaluation.criteria.map((criterion) => (
          <article key={criterion.criterionId} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{criterion.criterion}</h3>
                <p className="mt-1 text-sm font-medium text-brand-700">Nivel detectado: {criterion.detectedLevel}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Evidencia trazable
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">{criterion.justification}</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidencia textual</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {criterion.textualEvidence.map((evidence) => (
                  <li key={evidence}>• {evidence}</li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Recomendación:</span> {criterion.recommendation}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Originalidad</h3>
          <p className="mt-3 text-lg font-semibold text-slate-900">{evaluation.originality.category}</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{evaluation.originality.rationale}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dependencia de fuentes</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            {evaluation.originality.findings.length ? evaluation.originality.findings.map((finding) => (
              <li key={`${finding.type}-${finding.evidence}`} className="rounded-2xl bg-white px-3 py-2">
                <span className="font-semibold">{finding.type}:</span> {finding.evidence}
              </li>
            )) : <li className="rounded-2xl bg-white px-3 py-2">Sin indicios relevantes.</li>}
          </ul>
        </article>
      </div>

      <article className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Observación final</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">Informe orientativo para revisión docente.</p>
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
