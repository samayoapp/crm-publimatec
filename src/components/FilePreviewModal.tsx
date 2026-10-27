'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  FileCode,
  Share2,
  Copy,
  Check,
  AlertCircle,
  FileQuestion,
  File,
} from 'lucide-react';

export interface PreviewDocument {
  id?: string;
  title: string;
  fileUrl: string;
  fileType?: string; // 'PDF' | 'IMAGE' | 'EXCEL' | 'WORD' | 'PPT' | 'LINK' | 'OTRO'
  fileSize?: number | null;
  category?: string;
  version?: string | null;
  description?: string | null;
}

interface FilePreviewModalProps {
  document: PreviewDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onShareWhatsApp?: (doc: PreviewDocument) => void;
}

export default function FilePreviewModal({
  document,
  isOpen,
  onClose,
  onShareWhatsApp,
}: FilePreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Reset states on document change
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setCopied(false);
      setIframeError(false);
    }
  }, [isOpen, document]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  // Determine actual file kind from fileType or url extension
  const rawUrl = document.fileUrl || '';
  const cleanUrl = rawUrl.split('?')[0].toLowerCase();
  const ext = cleanUrl.substring(cleanUrl.lastIndexOf('.'));

  let kind: 'pdf' | 'image' | 'excel' | 'word' | 'ppt' | 'link' | 'other' = 'other';

  const typeUpper = (document.fileType || '').toUpperCase();
  if (typeUpper === 'PDF' || ext === '.pdf') {
    kind = 'pdf';
  } else if (
    typeUpper === 'IMAGE' ||
    ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)
  ) {
    kind = 'image';
  } else if (
    typeUpper === 'EXCEL' ||
    ['.xls', '.xlsx', '.csv'].includes(ext)
  ) {
    kind = 'excel';
  } else if (
    typeUpper === 'WORD' ||
    ['.doc', '.docx'].includes(ext)
  ) {
    kind = 'word';
  } else if (
    typeUpper === 'PPT' ||
    ['.ppt', '.pptx'].includes(ext)
  ) {
    kind = 'ppt';
  } else if (typeUpper === 'LINK' || (rawUrl.startsWith('http') && !cleanUrl.match(/\.(pdf|png|jpg|jpeg|webp|svg|gif|xlsx|xls|docx|doc|pptx|ppt)$/))) {
    kind = 'link';
  }

  const isEmbeddable = kind === 'pdf' || kind === 'image';

  // Format file size
  const formatSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return null;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const sizeStr = formatSize(document.fileSize);

  const handleCopyLink = () => {
    const full = document.fileUrl.startsWith('http')
      ? document.fileUrl
      : `${window.location.origin}${document.fileUrl}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeInfo = () => {
    switch (kind) {
      case 'pdf':
        return { label: 'Documento PDF', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60' };
      case 'image':
        return { label: 'Imagen', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900/60' };
      case 'excel':
        return { label: 'Hoja de Cálculo Excel', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60' };
      case 'word':
        return { label: 'Documento Word', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60' };
      case 'ppt':
        return { label: 'Presentación PPT', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60' };
      case 'link':
        return { label: 'Enlace Web', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60' };
      default:
        return { label: 'Archivo', color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const badge = getBadgeInfo();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-all duration-300 ${
          isEmbeddable
            ? 'max-w-6xl h-[92vh]'
            : 'max-w-xl h-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              {kind === 'pdf' && <FileText className="w-5 h-5 text-rose-600" />}
              {kind === 'image' && <ImageIcon className="w-5 h-5 text-purple-600" />}
              {kind === 'excel' && <FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
              {kind === 'word' && <FileText className="w-5 h-5 text-blue-600" />}
              {kind === 'ppt' && <Presentation className="w-5 h-5 text-amber-600" />}
              {kind === 'link' && <ExternalLink className="w-5 h-5 text-cyan-600" />}
              {kind === 'other' && <File className="w-5 h-5 text-slate-600" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate"
                  title={document.title}
                >
                  {document.title}
                </h3>
                {document.version && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    {document.version}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                  {badge.label}
                </span>
                {sizeStr && <span>• {sizeStr}</span>}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Image Zoom Controls */}
            {kind === 'image' && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-1.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  title="Alejar (-)"
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-slate-500 w-10 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  title="Acercar (+)"
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Restablecer tamaño"
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Share WhatsApp */}
            {onShareWhatsApp && (
              <button
                type="button"
                onClick={() => onShareWhatsApp(document)}
                title="Compartir por WhatsApp"
                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copiar enlace directo"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Direct Download */}
            <a
              href={document.fileUrl}
              download={!document.fileUrl.startsWith('http')}
              title="Descargar archivo"
              className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Open in new tab */}
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en nueva pestaña"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="Cerrar vista previa (Esc)"
              className="p-2 ml-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-center">
          {/* 1. PDF PREVIEW */}
          {kind === 'pdf' && (
            <div className="w-full h-full relative flex flex-col bg-slate-100 dark:bg-slate-950">
              <iframe
                src={`${document.fileUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={document.title}
                onError={() => setIframeError(true)}
              />
              {iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/95 dark:bg-slate-900/95">
                  <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 max-w-md">
                    Tu navegador no soporta la visualización incrustada de este PDF.
                  </p>
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Abrir o Descargar PDF
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 2. IMAGE PREVIEW */}
          {kind === 'image' && (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4 select-none">
              <div
                className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
                style={{ transform: `scale(${zoom})` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={document.fileUrl}
                  alt={document.title}
                  className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-xl border border-slate-200/50 dark:border-slate-800"
                />
              </div>
            </div>
          )}

          {/* 3. OFFICE & DOWNLOADABLE FILES (Excel, Word, PowerPoint, Zip, etc.) */}
          {!isEmbeddable && (
            <div className="p-8 sm:p-12 w-full flex flex-col items-center text-center">
              {/* Vibrant Decorative Icon Box */}
              <div className="relative mb-6">
                <div
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl border ${
                    kind === 'excel'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400/40 shadow-emerald-500/20'
                      : kind === 'word'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white border-blue-400/40 shadow-blue-500/20'
                      : kind === 'ppt'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-700 text-white border-amber-400/40 shadow-amber-500/20'
                      : kind === 'link'
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400/40 shadow-cyan-500/20'
                      : 'bg-gradient-to-br from-slate-600 to-slate-800 text-white border-slate-500/40 shadow-slate-500/20'
                  }`}
                >
                  {kind === 'excel' && <FileSpreadsheet className="w-12 h-12" />}
                  {kind === 'word' && <FileText className="w-12 h-12" />}
                  {kind === 'ppt' && <Presentation className="w-12 h-12" />}
                  {kind === 'link' && <ExternalLink className="w-12 h-12" />}
                  {kind === 'other' && <FileCode className="w-12 h-12" />}
                </div>

                {ext && (
                  <span className="absolute -bottom-2 -right-2 text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-lg bg-slate-900 text-white border border-slate-700 shadow-md">
                    {ext.replace('.', '')}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white max-w-md">
                {document.title}
              </h4>

              {document.description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
                  {document.description}
                </p>
              )}

              {/* Explanation note */}
              <div className="mt-5 p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 max-w-md text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {kind === 'link'
                    ? 'Este recurso corresponde a un enlace externo. Haz clic para abrirlo en una nueva pestaña del navegador.'
                    : `Los archivos de ${
                        kind === 'excel' ? 'Excel' : kind === 'word' ? 'Word' : kind === 'ppt' ? 'PowerPoint' : 'este tipo'
                      } no pueden visualizarse dentro del navegador. Puedes descargarlo directamente para abrirlo en tu computadora.`}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <a
                  href={document.fileUrl}
                  download={kind !== 'link'}
                  target={kind === 'link' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform active:scale-95 ${
                    kind === 'excel'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : kind === 'word'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                      : kind === 'ppt'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                  }`}
                >
                  {kind === 'link' ? (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Visitar Enlace Externo
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Descargar Archivo {sizeStr ? `(${sizeStr})` : ''}
                    </>
                  )}
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
