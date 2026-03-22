import { FileCheck2, ShieldCheck, Sparkles } from 'lucide-react';

export function AppShell({ title, subtitle, disclaimer, children }) {
  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                <Sparkles className="h-4 w-4" />
                Asistencia docente basada en rúbrica
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-3 text-lg text-slate-600">{subtitle}</p>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">{disclaimer}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[24rem] lg:grid-cols-1">
              <FeatureCard
                icon={<FileCheck2 className="h-5 w-5 text-brand-600" />}
                title="Rúbrica transparente"
                description="Cada criterio muestra nivel, peso, justificación y evidencia insuficiente cuando corresponda."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5 text-brand-600" />}
                title="Frontend sin claves"
                description="La evaluación se delega a un Worker independiente para mantener la configuración sensible fuera del cliente."
              />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm">{icon}</div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </article>
  );
}
