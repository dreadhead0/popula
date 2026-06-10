export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex max-w-5xl flex-col gap-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-700">
          Popula
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
          Full-stack demographic analytics workspace.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Upload demographic CSV data, build nested visual queries, and turn
          filtered records into tables and charts.
        </p>
      </section>
    </main>
  );
}