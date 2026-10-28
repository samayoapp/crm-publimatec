'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  Crop,
  Sparkles,
  Move,
  Info,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (blob: Blob, previewUrl: string) => void;
  shape?: 'circle' | 'square';
  title?: string;
  targetSize?: number;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  shape = 'square',
  title = 'Recortar y Optimizar Imagen',
  targetSize = 400,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Transform states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>('');

  const VIEW_SIZE = 300; // Interactive viewport size in CSS px

  // Load image when imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Draw interactive canvas
  const drawViewport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = VIEW_SIZE * dpr;
    canvas.height = VIEW_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.clearRect(0, 0, VIEW_SIZE, VIEW_SIZE);

    // Checkered transparent pattern or dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, VIEW_SIZE, VIEW_SIZE);

    // Calculate base scale so image fills the crop area
    const baseScale = Math.max(VIEW_SIZE / image.width, VIEW_SIZE / image.height);
    const finalScale = baseScale * zoom;

    ctx.save();
    // Move to center of viewport
    ctx.translate(VIEW_SIZE / 2, VIEW_SIZE / 2);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply user pan offset (in unrotated coordinate space)
    ctx.translate(offset.x, offset.y);
    // Scale image
    ctx.scale(finalScale, finalScale);

    // Draw image centered
    ctx.drawImage(
      image,
      -image.width / 2,
      -image.height / 2,
      image.width,
      image.height
    );
    ctx.restore();

    // Draw dark overlay with transparent cutout mask
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_SIZE, VIEW_SIZE);

    const margin = 10;
    const cutoutSize = VIEW_SIZE - margin * 2;
    const cx = VIEW_SIZE / 2;
    const cy = VIEW_SIZE / 2;
    const r = cutoutSize / 2;

    if (shape === 'circle') {
      // Counter-clockwise circle for cutout
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    } else {
      // Rounded rectangle cutout (counter-clockwise)
      const radius = 24;
      const x0 = margin;
      const y0 = margin;
      const w = cutoutSize;
      const h = cutoutSize;

      ctx.moveTo(x0 + radius, y0);
      ctx.lineTo(x0 + w - radius, y0);
      ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + radius);
      ctx.lineTo(x0 + w, y0 + h - radius);
      ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - radius, y0 + h);
      ctx.lineTo(x0 + radius, y0 + h);
      ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - radius);
      ctx.lineTo(x0, y0 + radius);
      ctx.quadraticCurveTo(x0, y0, x0 + radius, y0);
      ctx.closePath();
    }
    ctx.fill('evenodd');

    // Draw border outline around cutout
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else {
      const radius = 24;
      const x0 = margin;
      const y0 = margin;
      const w = cutoutSize;
      const h = cutoutSize;
      ctx.roundRect ? ctx.roundRect(x0, y0, w, h, radius) : ctx.rect(x0, y0, w, h);
    }
    ctx.stroke();

    // Subtle rule of thirds lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const oneThird = cutoutSize / 3;
    // vertical
    ctx.moveTo(margin + oneThird, margin);
    ctx.lineTo(margin + oneThird, margin + cutoutSize);
    ctx.moveTo(margin + oneThird * 2, margin);
    ctx.lineTo(margin + oneThird * 2, margin + cutoutSize);
    // horizontal
    ctx.moveTo(margin, margin + oneThird);
    ctx.lineTo(margin + cutoutSize, margin + oneThird);
    ctx.moveTo(margin, margin + oneThird * 2);
    ctx.lineTo(margin + cutoutSize, margin + oneThird * 2);
    ctx.stroke();

    ctx.restore();
  }, [image, zoom, rotation, offset, shape]);

  useEffect(() => {
    drawViewport();
  }, [drawViewport]);

  // Mouse & Touch Dragging Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    offsetStartRef.current = { ...offset };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    // Account for rotation when panning
    const rad = (-rotation * Math.PI) / 180;
    const rotDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotDy = dx * Math.sin(rad) + dy * Math.cos(rad);

    setOffset({
      x: offsetStartRef.current.x + rotDx,
      y: offsetStartRef.current.y + rotDy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  };

  // Generate cropped output at target resolution (e.g. 400x400) and WebP compression
  const handleCropAndSave = async () => {
    if (!image) return;
    setProcessing(true);

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetSize;
      exportCanvas.height = targetSize;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar el procesador de imagen');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear transparent
      ctx.clearRect(0, 0, targetSize, targetSize);

      // Scale factor from interactive viewport to final export canvas
      const cutoutMargin = 10;
      const cutoutDisplaySize = VIEW_SIZE - cutoutMargin * 2;
      const exportScaleFactor = targetSize / cutoutDisplaySize;

      const baseScale = Math.max(VIEW_SIZE / image.width, VIEW_SIZE / image.height);
      const totalScale = baseScale * zoom * exportScaleFactor;

      ctx.save();
      // Translate to export center
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(offset.x * exportScaleFactor, offset.y * exportScaleFactor);
      ctx.scale(totalScale, totalScale);

      ctx.drawImage(
        image,
        -image.width / 2,
        -image.height / 2,
        image.width,
        image.height
      );
      ctx.restore();

      // Convert to lightweight WebP or fallback to JPEG
      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setProcessing(false);
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(blob, previewUrl);
          setProcessing(false);
          onClose();
        },
        'image/webp',
        0.85
      );
    } catch (err) {
      console.error('Error al recortar:', err);
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Arrastra para centrar y usa el zoom para encuadrar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="flex flex-col items-center">
          <div
            className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-700 bg-slate-950 cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ width: VIEW_SIZE, height: VIEW_SIZE }}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => {
              if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handlePointerUp}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              style={{ width: VIEW_SIZE, height: VIEW_SIZE }}
              className="block"
            />

            {/* Drag helper hint */}
            <div className="absolute top-2 left-2 pointer-events-none px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white/80 flex items-center gap-1 font-medium">
              <Move className="w-3 h-3" />
              <span>Arrastrar</span>
            </div>
          </div>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.15))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-500 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Girar 90°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOffset({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium transition-colors"
                title="Centrar y restablecer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Centrar</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="w-3 h-3 text-indigo-400" />
              <span>{targetSize}×{targetSize} px • WebP</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCropAndSave}
            disabled={processing || !image}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
          >
            {processing ? (
              <span>Optimizando...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Recortar y Aplicar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
