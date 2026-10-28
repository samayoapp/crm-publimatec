import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-black text-indigo-500 mb-2">404</h1>
      <h2 className="text-xl font-bold text-white mb-4">Página no encontrada</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        La ruta que intentas consultar no existe o ha sido movida.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
