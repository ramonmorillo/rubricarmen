const fieldClassName =
  'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

export function EvaluationForm({ rubric, formData, onChange, onSubmit, loading, error, onLoadExample }) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-panel backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Entrada del trabajo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Introduce los datos básicos y pega el texto completo del alumno para obtener una valoración razonada.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadExample}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          Cargar ejemplo
        </button>
      </div>

      <form className="mt-6 grid gap-5" onSubmit={onSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nombre del alumno" required>
            <input
              className={fieldClassName}
              name="studentName"
              placeholder="Ej.: Carmen Ruiz López"
              value={formData.studentName}
              onChange={onChange}
              required
            />
          </Field>
          <Field label="Grupo / curso" required>
            <input
              className={fieldClassName}
              name="studentGroup"
              placeholder="Ej.: 2º Bach A"
              value={formData.studentGroup}
              onChange={onChange}
              required
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-[2fr,1fr]">
          <Field label="Título del trabajo" required>
            <input
              className={fieldClassName}
              name="assignmentTitle"
              placeholder="Ej.: Realidad y deseo en la poesía de Luis Cernuda"
              value={formData.assignmentTitle}
              onChange={onChange}
              required
            />
          </Field>
          <Field label="Rúbrica" required>
            <select className={fieldClassName} name="rubricId" value={formData.rubricId} onChange={onChange}>
              <option value={rubric.id}>{rubric.name}</option>
            </select>
          </Field>
        </div>

        <Field label="Texto del trabajo" required help="Se recomienda pegar el trabajo completo para mejorar la detección de evidencias.">
          <textarea
            className={`${fieldClassName} min-h-[320px] resize-y`}
            name="essayText"
            placeholder="Pega aquí el trabajo del alumno..."
            value={formData.essayText}
            onChange={onChange}
            required
          />
        </Field>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Analizando…' : 'Analizar trabajo'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, required, help, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-brand-600">*</span> : null}
      </span>
      {children}
      {help ? <span className="mt-2 block text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}
