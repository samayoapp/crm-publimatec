'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-xl font-bold text-white mb-2">Algo salió mal</h2>
      <p className="text-xs text-slate-400 mb-6 max-w-md">
        Ocurrió un error inesperado al procesar la solicitud.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
      >
        Reintentar
      </button>
    </div>
  );
}
