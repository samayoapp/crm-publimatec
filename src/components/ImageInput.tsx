'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Crop } from 'lucide-react';
import ImageCropModal from '@/components/ImageCropModal';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  shape?: 'circle' | 'square';
}

export default function ImageInput({
  label,
  value,
  onChange,
  placeholder = 'https://ejemplo.com/foto.jpg o subir archivo...',
  shape = 'circle',
}: ImageInputProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Leer archivo para abrir el modal de recorte
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCropImageSrc(event.target.result);
        setCropModalOpen(true);
      }
    };
    reader.onerror = () => {
      setError('No se pudo leer la imagen seleccionada');
    };
    reader.readAsDataURL(file);

    // Limpiar input para permitir seleccionar la misma imagen si fuera necesario
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setError(null);
    setUploading(true);

    try {
      // Enviar como WebP comprimido y optimizado a 400x400
      const optimizedFile = new File([blob], `img_${Date.now()}.webp`, {
        type: 'image/webp',
      });

      const formData = new FormData();
      formData.append('file', optimizedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al subir la imagen optimizada');
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Error al procesar y subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <div className="flex items-center gap-3">
        {/* Preview */}
        <div
          className={`relative shrink-0 w-12 h-12 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center ${
            shape === 'circle'
              ? 'rounded-full bg-slate-100 dark:bg-slate-800'
              : 'rounded-xl bg-white dark:bg-slate-900 p-1 shadow-xs'
          }`}
        >
          {value ? (
            <img
              src={value}
              alt="Preview"
              className={`w-full h-full ${
                shape === 'circle' ? 'object-cover' : 'object-contain'
              }`}
              onError={(e) => {
                // fallback on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-400" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            </div>
          )}
        </div>

        {/* Input & Action Buttons */}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Subir y recortar foto o logo"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Subir</span>
          </button>

          {value && (
            <>
              <button
                type="button"
                onClick={() => {
                  setCropImageSrc(value);
                  setCropModalOpen(true);
                }}
                disabled={uploading}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Recortar y re-encuadrar imagen actual"
              >
                <Crop className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Recortar</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-slate-400 transition-colors"
                title="Quitar imagen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 font-medium">{error}</p>
      )}

      {/* Interactive Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        shape={shape}
        title={
          shape === 'circle'
            ? 'Recortar Foto de Perfil'
            : 'Recortar Logotipo de Empresa'
        }
        targetSize={400}
      />
    </div>
  );
}
