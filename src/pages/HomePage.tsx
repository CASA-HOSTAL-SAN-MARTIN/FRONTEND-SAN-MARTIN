export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Sistema de gestión
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Casa Estudiantil San Martín
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Plataforma de gestión para administradores, personal y residentes.
        </p>
      </section>
    </main>
  );
}
